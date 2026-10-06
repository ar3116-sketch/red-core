// Procedural bunker sound. Everything is synthesised: no samples to download, nothing to license.
// Buses: world (sent to a long concrete reverb), suit (dry and close: breath, heart), ui (dry).
const rand=(a,b)=>a+Math.random()*(b-a);
export class BunkerAudio {
  constructor(){
    this.ctx=null;this.enabled=false;
    this.nextBeat=0;this.nextGeiger=0;this.nextStep=0;this.nextDrip=0;this.nextAlarm=0;this.alarmId='normal';
    this.nextClank=0;this.nextGroan=0;this.breath={phase:'out',until:0};this.wasHolding=false;
    this.coarsePointer=matchMedia('(pointer:coarse)');
  }
  async toggle(){
    if(!this.ctx)this.start();
    if(!this.ctx)return false;
    await this.ctx.resume();
    this.enabled=!this.enabled;
    this.master.gain.setTargetAtTime(this.enabled?.9:0,this.ctx.currentTime,.05);
    if(this.enabled){const t=this.ctx.currentTime;this.nextBeat=t+.2;this.nextGeiger=t+.5;this.nextClank=t+rand(3,8);this.nextGroan=t+rand(8,16);}
    return this.enabled;
  }
  // Browsers only allow audio after a gesture; the first click or key press turns it on.
  async enable(){if(this.enabled)return true;return this.toggle();}

  start(){
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    const ctx=this.ctx=new AC();
    this.master=ctx.createGain();this.master.gain.value=0;
    const comp=ctx.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=3;comp.attack.value=.01;comp.release.value=.25;
    this.master.connect(comp).connect(ctx.destination);
    // Noise sources: white for hiss and transients, brown for rumble.
    const len=ctx.sampleRate*3;this.noise=ctx.createBuffer(1,len,ctx.sampleRate);this.brown=ctx.createBuffer(1,len,ctx.sampleRate);
    {const w=this.noise.getChannelData(0),b=this.brown.getChannelData(0);let last=0;for(let i=0;i<len;i++){w[i]=Math.random()*2-1;last=(last+.02*w[i])/1.02;b[i]=last*3.5;}}
    // Concrete bunker reverb: early reflections, then a dark 2.6 s tail.
    const ir=ctx.createBuffer(2,ctx.sampleRate*2.6,ctx.sampleRate);
    for(let c=0;c<2;c++){const d=ir.getChannelData(c);let lp=0;for(let i=0;i<d.length;i++){const t=i/ctx.sampleRate;lp+= .18*((Math.random()*2-1)-lp);d[i]=lp*Math.pow(1-t/2.6,2.4)*.9;}
      for(const [t,g] of [[.011,.6],[.023,.45],[.037,.35],[.052,.3],[.071,.22]])d[Math.floor((t+c*.003)*ctx.sampleRate)]+=g;}
    this.verb=ctx.createConvolver();this.verb.buffer=ir;const wet=ctx.createGain();wet.gain.value=.42;this.verb.connect(wet).connect(this.master);
    this.world=ctx.createGain();this.world.gain.value=.85;this.world.connect(this.master);this.world.connect(this.verb);
    this.suit=ctx.createGain();this.suit.gain.value=.8;this.suit.connect(this.master);
    this.ui=ctx.createGain();this.ui.gain.value=.7;this.ui.connect(this.master);
    // Bed: mains hum with a slow wobble, room rumble, and per-area machinery layers.
    const hum=ctx.createGain();hum.gain.value=.03;hum.connect(this.world);
    for(const [f,g] of [[50,1],[100,.45],[150,.15]]){const o=ctx.createOscillator();o.frequency.value=f;const k=ctx.createGain();k.gain.value=g;o.connect(k).connect(hum);o.start();}
    const wob=ctx.createOscillator();wob.frequency.value=.13;const wg=ctx.createGain();wg.gain.value=.012;wob.connect(wg).connect(hum.gain);wob.start();
    this.layers={};
    const loop=(buf,type,freq,q,bus=this.world)=>{const s=ctx.createBufferSource();s.buffer=buf;s.loop=true;s.loopStart=rand(0,1);const f=ctx.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q;const g=ctx.createGain();g.gain.value=0;s.connect(f).connect(g).connect(bus);s.start(0,rand(0,2));return {g,f};};
    this.layers.rumble=loop(this.brown,'lowpass',180,.5);this.layers.rumble.g.gain.value=.12;
    this.layers.fan=loop(this.noise,'lowpass',420,.7);
    const blade=ctx.createOscillator();blade.frequency.value=7.5;const bg=ctx.createGain();bg.gain.value=.012;blade.connect(bg).connect(this.layers.fan.g.gain);blade.start();
    this.layers.steam=loop(this.noise,'bandpass',2600,.8);
    this.layers.furnace=loop(this.brown,'lowpass',260,.9);
    this.layers.water=loop(this.noise,'lowpass',900,.4);
    this.layers.shaft=loop(this.brown,'bandpass',90,1.5);
    // The specimen's presence: a sub growl that swells as it closes in.
    const growl=ctx.createOscillator();growl.type='sawtooth';growl.frequency.value=41;const gf=ctx.createBiquadFilter();gf.type='lowpass';gf.frequency.value=160;this.growl=ctx.createGain();this.growl.gain.value=0;
    const gl=ctx.createOscillator();gl.frequency.value=3.1;const glg=ctx.createGain();glg.gain.value=6;gl.connect(glg).connect(growl.frequency);gl.start();
    growl.connect(gf).connect(this.growl).connect(this.world);growl.start();
  }

  // ---- building blocks ----
  env(g,t,peak,attack,decay){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+attack+decay);}
  pan(v){const p=this.ctx.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,v));return p;}
  burst(t,{type='bandpass',freq=1000,q=1,dur=.1,vol=.1,attack=.002,bus=this.world,pan=0,sweep=null,buffer=this.noise}){
    const s=this.ctx.createBufferSource();s.buffer=buffer;const f=this.ctx.createBiquadFilter();f.type=type;f.frequency.setValueAtTime(freq,t);f.Q.value=q;
    if(sweep)f.frequency.exponentialRampToValueAtTime(sweep,t+dur);
    const g=this.ctx.createGain();this.env(g,t,vol,attack,dur);s.connect(f).connect(g).connect(this.pan(pan)).connect(bus);s.start(t,rand(0,2));s.stop(t+attack+dur+.05);
  }
  tone(t,{freq=440,to=null,type='sine',dur=.2,vol=.05,attack=.005,bus=this.world,pan=0}){
    const o=this.ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(freq,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+attack+dur);
    const g=this.ctx.createGain();this.env(g,t,vol,attack,dur);o.connect(g).connect(this.pan(pan)).connect(bus);o.start(t);o.stop(t+attack+dur+.05);
  }
  // Struck metal: an impulse into a few high-Q resonators. Inharmonic partials read as steel.
  ring(t,{freqs=[620,1013,1680],q=30,vol=.12,dur=.8,bus=this.world,pan=0}){
    const s=this.ctx.createBufferSource();s.buffer=this.noise;const g=this.ctx.createGain();this.env(g,t,1,.001,.012);s.connect(g);
    const out=this.ctx.createGain();out.gain.setValueAtTime(vol,t);out.gain.exponentialRampToValueAtTime(.0001,t+dur);out.connect(this.pan(pan)).connect(bus);
    for(const f of freqs){const b=this.ctx.createBiquadFilter();b.type='bandpass';b.frequency.value=f;b.Q.value=q;g.connect(b).connect(out);}
    s.start(t,rand(0,2));s.stop(t+.05);
  }
  distort(amount=8){const w=this.ctx.createWaveShaper(),n=1024,c=new Float32Array(n);for(let i=0;i<n;i++){const x=i/n*2-1;c[i]=Math.tanh(x*amount)/Math.tanh(amount);}w.curve=c;return w;}

  // ---- sounds ----
  step(t,surface,vol=1,pan=0){
    if(surface==='metal'){this.burst(t,{freq:2400,q:1.2,dur:.05,vol:.09*vol,pan});this.ring(t,{freqs:[rand(800,900),rand(1250,1400),rand(2000,2300)],q:22,vol:.07*vol,dur:.22,pan});this.tone(t,{freq:110,to:70,dur:.07,vol:.06*vol,pan});}
    else if(surface==='wet'){this.burst(t,{type:'lowpass',freq:900,dur:.16,vol:.11*vol,pan,sweep:400});this.burst(t+.04,{freq:1800,q:3,dur:.06,vol:.03*vol,pan});}
    else{this.burst(t,{freq:rand(1300,1700),q:1,dur:.045,vol:.08*vol,pan});this.tone(t,{freq:120,to:55,dur:.09,vol:.09*vol,pan});this.burst(t+.02,{type:'highpass',freq:4000,dur:.03,vol:.015*vol,pan});}
  }
  pulse(t,loud){
    // Heartbeat: a soft sub thump, felt more than heard.
    this.tone(t,{freq:68,to:38,dur:.16,vol:.22*loud,attack:.012,bus:this.suit});
    this.burst(t,{type:'lowpass',freq:140,dur:.08,vol:.08*loud,bus:this.suit,buffer:this.brown});
  }
  click(t,i){this.burst(t,{type:'highpass',freq:2500,dur:.004,vol:.08*i,attack:.0005,bus:this.ui,pan:rand(-.3,.3)});}
  klaxon(t){
    const d=this.distort(6),f=this.ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=950;f.Q.value=.9;const g=this.ctx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.06,t+.05);g.gain.setValueAtTime(.06,t+1.85);g.gain.exponentialRampToValueAtTime(.0001,t+2);
    d.connect(f).connect(g).connect(this.world);
    for(let i=0;i<4;i++){const o=this.ctx.createOscillator();o.type='sawtooth';o.frequency.value=i%2?554:440;o.connect(d);o.start(t+i*.5);o.stop(t+i*.5+.48);}
  }
  bell(t){for(let i=0;i<10;i++)this.ring(t+i*.06,{freqs:[612,1690,3300],q:40,vol:.05,dur:.5});}
  whoop(t){this.tone(t,{freq:280,to:640,type:'triangle',dur:1.1,vol:.05,attack:.05});}
  clank(){const t=this.ctx.currentTime,p=rand(-1,1);this.ring(t,{freqs:[rand(140,220),rand(330,460),rand(700,900)],q:18,vol:.09,dur:1.6,pan:p});this.burst(t,{type:'lowpass',freq:500,dur:.12,vol:.06,pan:p,buffer:this.brown});}
  groan(){
    const t=this.ctx.currentTime,o=this.ctx.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(rand(38,48),t);o.frequency.linearRampToValueAtTime(rand(60,80),t+1.4);o.frequency.linearRampToValueAtTime(rand(40,52),t+3);
    const f=this.ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=320;f.Q.value=4;const g=this.ctx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.05,t+.8);g.gain.exponentialRampToValueAtTime(.0001,t+3.2);
    o.connect(f).connect(g).connect(this.pan(rand(-.8,.8))).connect(this.world);o.start(t);o.stop(t+3.3);
  }
  breathe(t,inhale,stress){
    // Gas mask: inhale hisses through the filter and ends on the valve click; exhale flutters the rubber.
    const dur=inhale?1.1-stress*.45:1.3-stress*.5,vol=(.035+stress*.03);
    if(inhale){this.burst(t,{freq:1200,q:1.4,dur,vol,attack:dur*.45,bus:this.suit,sweep:1500});this.burst(t+dur*.95,{type:'highpass',freq:3000,dur:.012,vol:.03,attack:.001,bus:this.suit});}
    else{
      const s=this.ctx.createBufferSource();s.buffer=this.noise;const f=this.ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=520;f.Q.value=2;const g=this.ctx.createGain();this.env(g,t,vol*1.1,dur*.25,dur*.75);
      const flutter=this.ctx.createOscillator();flutter.frequency.value=rand(18,26);const fg=this.ctx.createGain();fg.gain.value=vol*.5;flutter.connect(fg).connect(g.gain);
      s.connect(f).connect(g).connect(this.suit);s.start(t,rand(0,2));s.stop(t+dur+.1);flutter.start(t);flutter.stop(t+dur+.1);
    }
  }
  cue(kind){
    if(!this.ctx||!this.enabled)return;const t=this.ctx.currentTime;
    switch(kind){
      case 'beat':this.pulse(t,1.25);return;
      case 'success':this.burst(t,{freq:2200,q:2,dur:.03,vol:.12,bus:this.ui});this.ring(t+.05,{freqs:[1046,2093,3130],q:60,vol:.06,dur:.7,bus:this.ui});return;
      case 'reject':{const o=this.ctx.createOscillator();o.type='square';o.frequency.value=98;const f=this.ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=1100;const g=this.ctx.createGain();this.env(g,t,.06,.005,.28);o.connect(f).connect(g).connect(this.ui);o.start(t);o.stop(t+.35);return;}
      case 'turn':for(let i=0;i<3;i++)this.burst(t+i*.035,{freq:3200,q:4,dur:.012,vol:.07,bus:this.ui});return;
      case 'fall':this.burst(t,{type:'highpass',freq:300,dur:.9,vol:.08,sweep:2500,attack:.2});this.tone(t+.9,{freq:70,to:30,dur:.4,vol:.3});this.burst(t+.9,{type:'lowpass',freq:600,dur:.3,vol:.25,buffer:this.brown});return;
      case 'grab':this.ring(t,{freqs:[310,742,1290],q:25,vol:.18,dur:1.2});this.burst(t,{freq:700,q:2,dur:.25,vol:.08,bus:this.suit});return;
      case 'slip':this.burst(t,{freq:2600,q:6,dur:.45,vol:.08,sweep:700});this.ring(t+.1,{freqs:[520,1340],q:30,vol:.06,dur:.6});return;
      case 'hit':case 'shoved':this.tone(t,{freq:90,to:40,dur:.2,vol:kind==='hit'?.35:.22,bus:this.suit});this.burst(t,{type:'lowpass',freq:900,dur:.12,vol:.15,bus:this.suit});this.burst(t+.02,{freq:3000,q:1,dur:.08,vol:.04});return;
      case 'vent':for(let i=0;i<9;i++)this.ring(t+i*rand(.06,.11),{freqs:[rand(1100,1300),rand(1800,2100),rand(2600,3000)],q:20,vol:.05,dur:.15,pan:rand(-.5,.5)});return;
      case 'pulse':{const o=this.ctx.createOscillator(),m=this.ctx.createOscillator(),mg=this.ctx.createGain();o.frequency.value=220;m.frequency.value=37;mg.gain.value=180;m.connect(mg).connect(o.frequency);const g=this.ctx.createGain();this.env(g,t,.07,.05,1.4);o.connect(g).connect(this.world);o.start(t);m.start(t);o.stop(t+1.6);m.stop(t+1.6);return;}
      case 'radio':this.burst(t,{type:'highpass',freq:1800,dur:.35,vol:.08,bus:this.ui});this.tone(t+.35,{freq:1400,type:'square',dur:.06,vol:.02,bus:this.ui});this.burst(t+.42,{freq:1000,q:.6,dur:.6,vol:.03,bus:this.ui});return;
      case 'lunge':{const o=this.ctx.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(260,t);o.frequency.exponentialRampToValueAtTime(1100,t+.18);o.frequency.exponentialRampToValueAtTime(380,t+.45);const f=this.ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=1400;f.Q.value=3;const g=this.ctx.createGain();this.env(g,t,.1,.02,.45);o.connect(this.distort(4)).connect(f).connect(g).connect(this.world);o.start(t);o.stop(t+.55);this.burst(t,{type:'lowpass',freq:300,dur:.3,vol:.15,buffer:this.brown});return;}
      // Task foley: valves, dials, fuses, wires, phones.
      case 'tick':this.burst(t,{freq:3600,q:6,dur:.008,vol:.09,bus:this.ui});this.ring(t,{freqs:[2400,3900],q:40,vol:.012,dur:.05,bus:this.ui});return;
      case 'creak':this.burst(t,{freq:rand(500,800),q:9,dur:.07,vol:.06,sweep:rand(350,600)});this.burst(t+.03,{freq:2800,q:5,dur:.01,vol:.05});return;
      case 'squeal':{const o=this.ctx.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(rand(900,1200),t);o.frequency.linearRampToValueAtTime(rand(1100,1500),t+.22);const v=this.ctx.createOscillator();v.frequency.value=23;const vg=this.ctx.createGain();vg.gain.value=40;v.connect(vg).connect(o.frequency);const f=this.ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=1300;f.Q.value=6;const g=this.ctx.createGain();this.env(g,t,.05,.02,.25);o.connect(f).connect(g).connect(this.world);o.start(t);v.start(t);o.stop(t+.3);v.stop(t+.3);return;}
      case 'spark':{for(let i=0;i<7;i++)this.burst(t+i*rand(.008,.03),{type:'highpass',freq:rand(3000,6000),dur:.006,vol:rand(.05,.14),attack:.0005});const o=this.ctx.createOscillator();o.type='square';o.frequency.value=100;const g=this.ctx.createGain();this.env(g,t,.035,.005,.18);o.connect(g).connect(this.world);o.start(t);o.stop(t+.2);return;}
      case 'snip':this.burst(t,{type:'highpass',freq:4000,dur:.006,vol:.15,attack:.0005});this.ring(t+.004,{freqs:[3100,4700],q:30,vol:.05,dur:.12});this.burst(t+.05,{type:'highpass',freq:5000,dur:.004,vol:.08,attack:.0005});return;
      case 'cable':this.burst(t,{type:'lowpass',freq:700,dur:.12,vol:.08});this.burst(t+.02,{freq:2400,q:3,dur:.04,vol:.03});return;
      // Radio time signal: five short pips and a long sixth on the minute.
      // A muffled voice through a gas mask: a few formant-filtered bursts.
      case 'voice':for(let k=0;k<4;k++)this.burst(t+k*.07+Math.random()*.03,{freq:500+Math.random()*700,q:5,dur:.06,vol:.035,bus:this.ui});return;
      // Waste canister: a steel drum on concrete, a rubber glove skidding, a hard squeeze.
      case 'clang':this.burst(t,{type:'lowpass',freq:260,dur:.22,vol:.28});this.ring(t,{freqs:[211,523,1187,1960],q:22,vol:.14,dur:1.6});this.ring(t+.32,{freqs:[230,560,1250],q:20,vol:.06,dur:.8});return;
      case 'slip':this.burst(t,{freq:1800,q:3,dur:.09,vol:.07,sweep:900,bus:this.ui});this.tone(t,{freq:320,to:180,dur:.12,vol:.05,type:'triangle',bus:this.ui});return;
      case 'squeeze':this.tone(t,{freq:150,to:210,dur:.09,vol:.08,type:'sawtooth',bus:this.ui});this.burst(t,{type:'lowpass',freq:600,dur:.05,vol:.06,bus:this.ui});return;
      case 'pip':this.tone(t,{freq:1000,dur:.1,vol:.07,attack:.003,bus:this.ui});return;
      case 'pipLong':this.tone(t,{freq:1000,dur:.5,vol:.08,attack:.003,bus:this.ui});return;
      case 'latch':this.burst(t,{type:'lowpass',freq:500,dur:.08,vol:.14});this.ring(t+.01,{freqs:[310,770,1240],q:25,vol:.05,dur:.35});return;
      case 'clank':this.burst(t,{type:'lowpass',freq:300,dur:.18,vol:.2});this.ring(t,{freqs:[180,437,905,1530],q:18,vol:.08,dur:1.1});return;
      case 'peg':this.tone(t,{freq:140,to:90,dur:.06,vol:.12});this.burst(t,{freq:3000,q:4,dur:.015,vol:.06});return;
      case 'buzz':{const o=this.ctx.createOscillator();o.type='sawtooth';o.frequency.value=100;const f=this.ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=900;f.Q.value=3;const g=this.ctx.createGain();this.env(g,t,.02,.005,.12);o.connect(f).connect(g).connect(this.world);o.start(t);o.stop(t+.15);return;}
      case 'warn':for(let i=0;i<4;i++)this.tone(t+i*.2,{freq:i%2?720:960,type:'square',dur:.16,vol:.035,bus:this.ui});return;
      case 'tamper':for(let i=0;i<4;i++)this.burst(t+i*.09,{freq:2200,q:8,dur:.01,vol:.05});return;
      case 'steam':this.burst(t,{type:'highpass',freq:2500,dur:1.3,vol:.12,attack:.03,sweep:5000});this.tone(t,{freq:80,to:45,dur:.25,vol:.18});this.ring(t,{freqs:[180,410,760],q:20,vol:.06,dur:.9});return;
      case 'ring':for(const k of [0,.45])this.tone(t+k,{freq:425,dur:.35,vol:.06,bus:this.ui});for(let i=0;i<5;i++)this.tone(t+1.1+i*.07,{freq:rand(180,320),to:rand(150,260),dur:.06,vol:.04,type:'sawtooth',bus:this.ui});return;
      case 'busy':for(let i=0;i<4;i++)this.tone(t+i*.4,{freq:425,dur:.2,vol:.05,bus:this.ui});return;
      default:this.burst(t,{freq:900,dur:.1,vol:.05});
    }
  }
  // Continuous task beds: radio static, a carrier when tuned, the centrifuge whine.
  loop(name,level){
    if(!this.ctx||!this.enabled)return;this.loops??={};let l=this.loops[name];const t=this.ctx.currentTime;
    if(!l){
      const g=this.ctx.createGain();g.gain.value=0;g.connect(this.ui);
      if(name==='static'){const s=this.ctx.createBufferSource();s.buffer=this.noise;s.loop=true;const f=this.ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=2200;f.Q.value=.6;s.connect(f).connect(g);s.start();l={g};}
      else if(name==='carrier'){const o=this.ctx.createOscillator();o.frequency.value=880;const m=this.ctx.createOscillator();m.frequency.value=4.5;const mg=this.ctx.createGain();mg.gain.value=180;m.connect(mg).connect(o.frequency);const f=this.ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=1100;f.Q.value=2;o.connect(f).connect(g);o.start();m.start();l={g};}
      else{const o=this.ctx.createOscillator();o.type='sawtooth';o.frequency.value=60;const f=this.ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=1800;o.connect(f).connect(g);o.start();l={g,o};}
      this.loops[name]=l;
    }
    l.g.gain.setTargetAtTime(level,t,.05);if(l.o)l.o.frequency.setTargetAtTime(60+level*900,t,.1);
  }
  stopLoops(){for(const k of Object.keys(this.loops||{}))this.loop(k,0);}
  // Specimen footfall: heavy, wet, and somewhere off to one side.
  thud(volume,pan=0){if(!this.ctx||!this.enabled)return;const t=this.ctx.currentTime;this.tone(t,{freq:58,to:32,dur:.28,vol:.32*volume,pan});this.burst(t,{type:'lowpass',freq:320,dur:.22,vol:.2*volume,pan,buffer:this.brown});this.burst(t+.03,{freq:900,q:4,dur:.08,vol:.05*volume,pan});}

  update(dt,{moving,temp,pressure,holdingBreath,position={x:0,y:0,z:0},alarm={id:'normal'},near=0}){
    if(!this.ctx||!this.enabled)return;
    const t=this.ctx.currentTime,p=position;
    const stress=Math.min(1,(moving?.25:0)+Math.max(0,temp-65)/70+Math.max(0,pressure-65)/80+near*.6+(holdingBreath?.2:0));
    // Where we are decides the machinery bed and what our boots hit.
    const sewer=p.z>5&&Math.abs(p.x)<18,hangar=p.x>22&&p.z>12,incinerator=p.x>15&&p.x<23&&p.z<-5,reactor=p.z<-5&&Math.abs(p.x)<8;
    const hall=Math.abs(p.x)>25&&Math.abs(p.x)<31;
    const set=(layer,v)=>this.layers[layer].g.gain.setTargetAtTime(v,t,.5);
    set('fan',incinerator?.05:sewer?.015:hangar?.012:.03);set('steam',sewer?.012:pressure>50?.01:.003);set('furnace',incinerator?.09:reactor?.04:0);
    set('water',sewer?(p.y<-2?.06:.02):0);set('shaft',hall||hangar?.08:0);set('rumble',hangar?.2:.12);
    this.growl.gain.setTargetAtTime(near*.12,t,.4);
    const surface=p.y<-2.5&&sewer?'wet':(hangar||sewer||(hall&&Math.abs(p.x)>28))?'metal':'concrete';
    if(moving&&t>this.nextStep){this.step(t,surface,1,this.nextStep%2?-.12:.12);this.nextStep=t+.42;}
    if(sewer&&t>this.nextDrip){this.tone(t,{freq:rand(1100,1700),to:rand(700,900),dur:.09,vol:.03,pan:rand(-.7,.7)});this.nextDrip=t+rand(1.2,3.8);}
    if(t>this.nextClank){this.clank();this.nextClank=t+rand(7,18);}
    if(t>this.nextGroan){this.groan();this.nextGroan=t+rand(14,30);}
    if(alarm.id!==this.alarmId){this.alarmId=alarm.id;this.nextAlarm=t;}
    if(alarm.id!=='normal'&&t>=this.nextAlarm){
      if(alarm.id==='reactor'){this.klaxon(t);this.nextAlarm=t+3;}
      else if(alarm.id==='coolant'){this.whoop(t);this.nextAlarm=t+4;}
      else if(alarm.id==='power'){this.bell(t);this.nextAlarm=t+5;}
      else{this.ring(t,{freqs:[880,1320],q:50,vol:.04,dur:1});this.nextAlarm=t+9;}
    }
    // Breathing alternates inhale/exhale at a rate set by stress; holding it ends in a gasp.
    if(holdingBreath){this.wasHolding=true;this.breath.until=t+.2;}
    else{if(this.wasHolding){this.wasHolding=false;this.burst(t,{freq:1300,q:1,dur:.5,vol:.07,attack:.05,bus:this.suit});this.breath={phase:'in',until:t+.6};}
      if(t>=this.breath.until){const inhale=this.breath.phase==='out';this.breathe(t,inhale,stress);this.breath={phase:inhale?'in':'out',until:t+(inhale?1.15:1.35)-stress*.55};}}
    const interval=60/(62+stress*70);
    if(this.nextBeat<t-.3)this.nextBeat=t;
    if(this.nextBeat<=t+.05){this.pulse(this.nextBeat,.6+stress*.6);this.pulse(this.nextBeat+.2,.35+stress*.4);if(this.coarsePointer.matches&&navigator.vibrate)navigator.vibrate(12);this.nextBeat+=interval;}
    // Geiger counter: random clicks, faster with heat and with the specimen close.
    if(t>=this.nextGeiger){this.click(t,.5+temp/160+near*.5);this.nextGeiger=t+(-Math.log(Math.random()))*Math.max(.03,.7-temp/180-near*.5);}
  }
}
