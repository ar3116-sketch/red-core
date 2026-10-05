import * as THREE from 'three';
// PS1 pipeline: clip-space vertex snap (+ optional affine UVs) on scene materials, then a low-res
// post pass with a sodium-vapor grade, Cherenkov-cyan danger clash, 4x4 Bayer dither and 5-bit quantize.
const seen=new WeakSet(),res={value:new THREE.Vector2(256,192)};
export const ps1Res=res;
function patch(m,{affine=false}={}){
 if(!m||seen.has(m))return;seen.add(m);
 if(m.isShaderMaterial||/Sprite|Depth|Distance|Shadow/.test(m.type))return;
 const aff=affine&&!!m.map&&(m.isMeshLambertMaterial||m.isMeshBasicMaterial),prev=m.onBeforeCompile,base=m.customProgramCacheKey();
 m.onBeforeCompile=function(s,r){prev.call(this,s,r);s.uniforms.uPS1Res=res;
  s.vertexShader='uniform vec2 uPS1Res;\n'+(aff?'varying float vPS1W;\n':'')+s.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
if(gl_Position.w>0.){vec2 g=uPS1Res*.5;gl_Position.xy=floor(gl_Position.xy/gl_Position.w*g+.5)/g*gl_Position.w;}`+(aff?'\n#ifdef USE_MAP\nvMapUv*=gl_Position.w;vPS1W=gl_Position.w;\n#endif':''));
  if(aff)s.fragmentShader='varying float vPS1W;\n'+s.fragmentShader.replace('#include <map_fragment>','#ifdef USE_MAP\ndiffuseColor*=texture2D(map,vMapUv/vPS1W);\n#endif');
 };
 m.customProgramCacheKey=()=>base+(aff?'|ps1a':'|ps1');m.needsUpdate=true;
}
// Explicit: patch every material under root (idempotent).
export function applyPS1Materials(root,opts){root.traverse(o=>{if(o.material)for(const m of [].concat(o.material))patch(m,opts);});return root;}
// Automatic: patch any material lazily the first time it is drawn (covers late GLTF loads, clones, overlay scenes).
let auto=null;
export function autoPS1(opts){
 if(auto)return;const base=THREE.Material.prototype.onBeforeRender;
 auto=function(...a){if(!seen.has(this))patch(this,opts);return base.apply(this,a);};THREE.Material.prototype.onBeforeRender=auto;
}
const VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
const FS=`uniform sampler2D tScene;uniform vec2 uRes;uniform float uDanger,uTime,uBlackout,uDither,uLevels,uGrain,uVignette;
varying vec2 vUv;
const vec3 CY=vec3(.1,.9,1.);
vec3 srgb(vec3 c){c=clamp(c,0.,1.);return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));}
vec3 tap(vec2 o){return srgb(texture2D(tScene,vUv+o/uRes).rgb);}
float luma(vec3 c){return dot(c,vec3(.299,.587,.114));}
vec3 hsv(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.),p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g)),q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);return vec3(abs(q.z+(q.w-q.y)/(6.*d+1e-6)),d/(q.x+1e-6),q.x);}
float bayer2(vec2 a){a=floor(a);return fract(dot(a,vec2(.5,a.y*.75)));}
float bayer4(vec2 a){return bayer2(.5*a)*.25+bayer2(a);}
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){
 vec3 c=tap(vec2(0.)),h=hsv(c);float l=luma(c);
 float cy=smoothstep(.075,.035,abs(h.x-.51))*smoothstep(.3,.55,h.y)*smoothstep(.06,.18,h.z);
 vec3 g=mix(vec3(l),c,.6);
 g=pow(g,vec3(.97,1.04,1.5))*vec3(1.05,.97,.78);
 g=mix(g,g*g*(3.-2.*g),.25);
 g=g*.955+vec3(.04,.034,.008);
 vec3 o=mix(g,c,cy);
 float d=uDanger,pulse=.72+.28*sin(uTime*6.5);
 float v=smoothstep(.3,.95,length((vUv-.5)*vec2(uRes.x/uRes.y,1.)));
 o*=1.-v*uVignette;
 if(d>.001){
  float gl=0.;
  for(int i=0;i<8;i++){float a=float(i)*.7854;vec2 r=vec2(cos(a),sin(a))*(i<4?2.5:5.);gl+=smoothstep(.4,.9,luma(tap(r)));}
  gl/=8.;
  o=mix(o,CY*(.22+l*1.25),smoothstep(.08,.6,l)*d*.8);
  o+=CY*(gl*.6+v*.5+.04)*d*pulse;
 }
 o+=(hash(gl_FragCoord.xy+fract(uTime)*97.)-.5)*uGrain*(1.+uBlackout*1.5);
 o=floor(o*uLevels+.5+(bayer4(gl_FragCoord.xy)-.47)*uDither)/uLevels;
 gl_FragColor=vec4(clamp(o,0.,1.),1.);
}`;
// post.render(scene,camera,{danger,blackout,time},overlay): overlay() runs with the low-res target bound.
export function createPS1Post(renderer,options={}){
 const opt=Object.assign({snap:.5,dither:1,levels:31,grain:.018,vignette:.3},options),size=new THREE.Vector2();
 const target=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:true,colorSpace:renderer.capabilities.isWebGL2?THREE.SRGBColorSpace:THREE.NoColorSpace});
 const u={tScene:{value:target.texture},uRes:{value:new THREE.Vector2(1,1)},uDanger:{value:0},uTime:{value:0},uBlackout:{value:0},uDither:{value:1},uLevels:{value:31},uGrain:{value:0},uVignette:{value:0}};
 const material=new THREE.ShaderMaterial({uniforms:u,vertexShader:VS,fragmentShader:FS,depthTest:false,depthWrite:false});
 const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);quad.frustumCulled=false;
 const view=new THREE.Scene(),flat=new THREE.OrthographicCamera(-1,1,1,-1,0,1);view.add(quad);
 function sync(){
  renderer.getDrawingBufferSize(size);
  if(size.x!==target.width||size.y!==target.height){target.setSize(size.x,size.y);u.uRes.value.copy(size);}
  res.value.copy(size).multiplyScalar(opt.snap);
  u.uDither.value=opt.dither;u.uLevels.value=opt.levels;u.uGrain.value=opt.grain;u.uVignette.value=opt.vignette;
 }
 return {options:opt,uniforms:u,target,
  setSize(){sync();},
  render(scene,camera,{danger=0,blackout=false,time=performance.now()/1000}={},overlay){
   sync();u.uDanger.value=THREE.MathUtils.clamp(danger,0,1);u.uBlackout.value=blackout?1:0;u.uTime.value=time;
   const previous=renderer.getRenderTarget();renderer.setRenderTarget(target);
   if(!renderer.autoClear)renderer.clear();
   renderer.render(scene,camera);overlay?.();
   renderer.setRenderTarget(previous);renderer.render(view,flat);
  },
  dispose(){target.dispose();material.dispose();quad.geometry.dispose();}
 };
}
