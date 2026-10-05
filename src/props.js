import { PROP_LAYOUT } from '../shared/world.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const assets = {
  locker: new URL('../assets/locker.glb', import.meta.url).href,
  pump: new URL('../assets/pump.glb', import.meta.url).href,
  terminal: new URL('../assets/terminal.glb', import.meta.url).href,
  door: new URL('../assets/blast-door.glb', import.meta.url).href,
  filter: new URL('../assets/filter-canister.glb', import.meta.url).href,
};
export function addProps(scene) {
  const loader = new GLTFLoader();
  return Promise.all(Object.entries(assets).map(async ([key,url]) => {
    const {scene:model} = await loader.loadAsync(url);
    for(const {x,z,yaw} of PROP_LAYOUT.filter(p=>p.type===key)) {
      const prop = model.clone(true);
      prop.position.set(x,0,z); prop.rotation.y=yaw;
      scene.add(prop);
    }
  })).catch(error => console.error('Bunker prop loading failed', error));
}
