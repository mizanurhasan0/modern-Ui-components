/** Rebuild the editable, texture-free glTF 2.0 helicopter concept. */
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// The exporter only needs this small browser API adapter for binary Blob output.
globalThis.FileReader ??= class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => { this.result = result; this.onloadend?.(); });
  }
};

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(project, 'public/models/developer-helicopter');
await mkdir(output, { recursive: true });
const scene = new THREE.Scene();
scene.name = 'DeveloperHelicopterScene';
const helicopter = new THREE.Group();
helicopter.name = 'Helicopter';
helicopter.userData = { description: 'Stylized developer pilot helicopter; separate rotor and pilot pivots.', forward: '+X', up: '+Y', units: 'meters' };
scene.add(helicopter);

const material = (name, color, roughness = .4, metalness = .0, extra = {}) => {
  const result = new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
  result.name = name;
  return result;
};
const charcoal = material('Charcoal shell', '#292d35', .36, .42);
const trim = material('Graphite trim', '#111722', .29, .45);
const mint = material('Mint enamel', '#65e8b4', .23, .26);
const light = material('Mint status lights', '#a3ffde', .22, .1, { emissive: '#36edb1', emissiveIntensity: 1.5 });
const silver = material('Brushed fittings', '#a1adb8', .28, .8);
const seatMaterial = material('Seat upholstery', '#222735', .85);
const hoodie = material('Developer hoodie', '#343943', .94);
const shirt = material('Ivory T-shirt', '#e5e7e5', .95);
const skin = material('Warm skin', '#c18b68', .73);
const hair = material('Dark hair and beard', '#211d1b', .94);
const white = material('Eyes', '#e7e4dc', .3);
const iris = material('Brown irises', '#60422e', .35);
const pupil = material('Pupils', '#111316', .21);
const lip = material('Lips', '#a66a59', .8);
const mouthDark = material('Mouth interior', '#382524', .9);
const glass = new THREE.MeshPhysicalMaterial({
  color: '#ffffff', roughness: .015, metalness: 0, transmission: 1,
  thickness: .002, ior: 1.08, clearcoat: .08, clearcoatRoughness: .02,
  side: THREE.DoubleSide, envMapIntensity: .22,
});
glass.name = 'Clear cockpit glass';
const sphere = new THREE.SphereGeometry(1, 24, 16);
function mesh(name, geometry, surface, parent = helicopter) {
  const item = new THREE.Mesh(geometry, surface);
  item.name = name;
  item.castShadow = surface !== glass;
  item.receiveShadow = surface !== glass;
  parent.add(item);
  return item;
}
function ellipsoid(name, surface, position, scale, parent = helicopter) {
  const item = mesh(name, sphere, surface, parent);
  item.position.set(...position); item.scale.set(...scale);
  return item;
}
function group(name, position = [0, 0, 0], parent = helicopter) {
  const item = new THREE.Group(); item.name = name; item.position.set(...position); parent.add(item); return item;
}
function rod(name, a, b, radius, surface, parent = helicopter, endRadius = radius) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
  const item = mesh(name, new THREE.CylinderGeometry(endRadius, radius, start.distanceTo(end), 12), surface, parent);
  item.position.copy(start).add(end).multiplyScalar(.5);
  item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
  return item;
}
function tube(name, points, radius, surface, parent = helicopter, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed);
  return mesh(name, new THREE.TubeGeometry(curve, Math.max(24, points.length * 5), radius, 8, closed), surface, parent);
}
function ring(name, radius, thickness, surface, position, rotation, parent = helicopter) {
  const item = mesh(name, new THREE.TorusGeometry(radius, thickness, 10, 48), surface, parent);
  item.position.set(...position); item.rotation.set(...rotation); return item;
}

// Three continuous spherical patches leave a real opening for the glass canopy.
const centerY = 1.35, rx = 1.14, ry = .92, rz = .82;
function shellPatch(name, thetaStart, thetaEnd, phiStart, phiEnd, surface) {
  const vertices = [], indices = [], rows = 24, columns = 40;
  for (let row = 0; row <= rows; row++) {
    const theta = thetaStart + (thetaEnd - thetaStart) * row / rows;
    for (let col = 0; col <= columns; col++) {
      const phi = phiStart + (phiEnd - phiStart) * col / columns;
      vertices.push(rx * Math.cos(theta), centerY + ry * Math.sin(theta) * Math.cos(phi), rz * Math.sin(theta) * Math.sin(phi));
    }
  }
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    const a = row * (columns + 1) + col, b = a + columns + 1;
    indices.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return mesh(name, geometry, surface);
}
shellPatch('RearFuselage', Math.PI / 2, Math.PI, 0, Math.PI * 2, charcoal);
shellPatch('LowerNose', 0, Math.PI / 2, Math.PI / 2, Math.PI * 1.5, charcoal);
const canopy = shellPatch('Canopy', 0, Math.PI / 2, -Math.PI / 2, Math.PI / 2, glass);
canopy.castShadow = false;
const arch = [], sill = [];
for (let i = 0; i <= 32; i++) {
  const a = -Math.PI / 2 + i / 32 * Math.PI;
  arch.push([0, centerY + ry * Math.cos(a), rz * Math.sin(a)]);
  sill.push([rx * Math.cos(a), centerY, rz * Math.sin(a)]);
}
tube('CanopyRearSeal', arch, .032, trim);
tube('CanopyLowerSeal', sill, .028, trim);
tube('CanopySilverLip', sill.map(([x, y, z]) => [x * 1.005, y + .025, z * 1.005]), .008, silver);
ellipsoid('CabinFloor', trim, [.28, 1.3, 0], [.64, .045, .58]);
ellipsoid('Dashboard', trim, [.82, 1.36, 0], [.15, .11, .52]);
for (const z of [-.18, -.06, .06, .18]) ellipsoid(`Instrument_${z}`, light, [.8, 1.46, z], [.021, .006, .017]);

// Tapered tail boom, a real duct, and an independently animated tail propeller.
rod('TailBoom', [-.9, 1.35, 0], [-3.15, 1.57, 0], .19, charcoal, helicopter, .065);
const tailHousing = ring('TailDuct', .275, .051, mint, [-3.24, 1.58, 0], [0, 0, 0]);
tailHousing.userData.role = 'Stationary tail rotor housing';
const tailRotor = group('TailRotor', [-3.24, 1.58, 0]);
ellipsoid('TailHub', trim, [0, 0, 0], [.075, .075, .07], tailRotor);
for (let i = 0; i < 3; i++) {
  const blade = ellipsoid(`TailBlade_${i}`, mint, [0, 0, 0], [.06, .215, .018], tailRotor);
  const a = i * Math.PI * 2 / 3;
  blade.position.set(Math.sin(a) * .11, Math.cos(a) * .11, 0); blade.rotation.z = -a;
}
rod('TailFinMount', [-2.65, 1.52, 0], [-2.8, 1.91, 0], .038, trim);
ellipsoid('TailFin', charcoal, [-2.77, 1.82, 0], [.22, .32, .055]);

// Separate mast and blade pivot: exported rotor motion can run on its own.
rod('MainMast', [-.12, 2.13, 0], [-.12, 2.55, 0], .065, trim);
ellipsoid('MastCap', silver, [-.12, 2.53, 0], [.105, .04, .105]);
const mainRotor = group('MainRotor', [-.12, 2.59, 0]);
for (let i = 0; i < 2; i++) {
  const blade = ellipsoid(`MainBlade_${i}`, mint, [0, 0, 0], [1.65, .022, .12], mainRotor);
  blade.rotation.y = i * Math.PI / 2;
}
ellipsoid('RotorHub', trim, [0, .025, 0], [.13, .05, .13], mainRotor);

for (const z of [-.62, .62]) {
  for (const x of [-.42, .6]) rod(`SkidStrut_${x}_${z}`, [x, .68, z * .65], [x, .2, z], .039, charcoal);
  tube(`LandingSkid_${z}`, [[-.95,.31,z],[-.8,.18,z],[-.4,.15,z],[.3,.15,z],[.85,.19,z],[1.02,.33,z]], .052, trim);
  ellipsoid(`SkidTip_${z}`, mint, [1.02,.33,z], [.052,.052,.052]);
}
for (const z of [-.807, .807]) {
  ellipsoid(`NavigationLamp_${z}`, light, [.12, 1.29, z], [.15, .025, .015]);
  for (const x of [-.48, -.3, -.12]) rod(`Vent_${x}_${z}`, [x,1.05,z*.97],[x+.05,1.13,z*.98], .011, trim);
}

// A stylized adult pilot with normal shoulder/head proportions and articulated pivots.
const pilot = group('Pilot', [.35, 1.23, -.04]);
pilot.rotation.y = .6;
pilot.userData = { style: 'Procedural stylized likeness; not a scanned face.', controls: ['PilotHead','PilotRightArm','PilotMouth','PilotEyes'] };
ellipsoid('PilotSeatBack', seatMaterial, [0,.25,-.2],[.3,.4,.10],pilot);
ellipsoid('PilotHeadrest', seatMaterial, [0,.58,-.19],[.16,.12,.055],pilot);
ellipsoid('PilotTorso', hoodie, [0,.23,0],[.265,.285,.16],pilot);
ellipsoid('TShirt', shirt, [0,.455,.105],[.061,.066,.025],pilot);
for (const x of [-.055,.055]) tube(`HoodieOpening_${x}`,[[x,.47,.09],[x*.8,.34,.17],[x*.65,.10,.16]],.009,trim,pilot);
for (const x of [-.095,.095]) tube(`HoodieDrawstring_${x}`,[[x,.43,.15],[x*.85,.34,.18],[x,.28,.18]],.004,shirt,pilot);
for (const x of [-.16,.16]) {
  tube(`Harness_${x}`, [[x,.43,.10],[x,.28,.165],[x*.6,.04,.155]], .018, trim, pilot);
  ellipsoid(`HarnessBuckle_${x}`, silver, [x*.92,.24,.183],[.026,.035,.008],pilot);
}
tube('HoodRim', [[-.16,.42,-.06],[-.14,.48,-.13],[0,.5,-.17],[.14,.48,-.13],[.16,.42,-.06]], .04, hoodie,pilot);
rod('Neck', [0,.43,0],[0,.59,0], .066, skin,pilot);
const head = group('PilotHead',[0,.54,0],pilot);
ellipsoid('HeadSkin',skin,[0,.16,.018],[.142,.19,.137],head);
for (const x of [-.14,.14]) ellipsoid(`Ear_${x}`,skin,[x,.15,.01],[.027,.047,.025],head);
ellipsoid('HairCrown',hair,[0,.3,-.018],[.151,.095,.14],head);
ellipsoid('HairBack',hair,[0,.19,-.087],[.144,.13,.062],head);
for (let i=0;i<4;i++) {
  const clump=ellipsoid(`SweptHair_${i}`,hair,[-.085+i*.052,.315+Math.sin(i*.9)*.021,.015],[.059,.037,.092],head);
  clump.rotation.z=-.3; clump.rotation.x=-.4;
}
ellipsoid('BeardJaw',hair,[0,.034,.035],[.114,.05,.102],head);
for (const x of [-.098,.098]) ellipsoid(`BeardCheek_${x}`,hair,[x,.071,.061],[.026,.052,.047],head);
ellipsoid('Nose',skin,[0,.15,.15],[.028,.037,.035],head);
const eyes = group('PilotEyes',[0,0,0],head);
const eyelids=[];
for (const x of [-.056,.056]) {
  ellipsoid(`EyeWhite_${x}`,white,[x,.195,.138],[.029,.018,.009],eyes);
  ellipsoid(`Iris_${x}`,iris,[x+.003,.195,.146],[.012,.013,.004],eyes);
  ellipsoid(`Pupil_${x}`,pupil,[x+.003,.195,.149],[.006,.008,.002],eyes);
  ellipsoid(`Catchlight_${x}`,white,[x,.199,.151],[.003,.003,.001],eyes);
  tube(`Brow_${x}`,[[x-.027,.229,.132],[x,.236,.14],[x+.027,.23,.132]],.006,hair,head);
  const lid=ellipsoid(x<0?'BlinkLeft':'BlinkRight',skin,[x,.195,.15],[.031,.019,.008],eyes);
  // Actual glTF morph target: starts retracted, closes over the eye at weight 1.
  const geometry=lid.geometry.clone();
  const closed=geometry.attributes.position.clone();
  const opened=geometry.attributes.position.clone();
  for(let j=0;j<opened.count;j++) opened.setY(j, opened.getY(j)*.01+1.12);
  geometry.setAttribute('position',opened);
  geometry.morphAttributes.position=[closed];
  lid.geometry=geometry; lid.updateMorphTargets(); lid.morphTargetDictionary={Blink:0};
  eyelids.push(lid);
}
for (const x of [-.027,.027]) {
  const stache=ellipsoid(`Mustache_${x}`,hair,[x,.107,.146],[.033,.011,.011],head);
  stache.rotation.z=x<0?.12:-.12;
}
const mouth=ellipsoid('PilotMouth',mouthDark,[0,.082,.145],[.036,.003,.006],head);
const mouthGeometry=mouth.geometry.clone();
const openMouth=mouthGeometry.attributes.position.clone();
for(let j=0;j<openMouth.count;j++) openMouth.setY(j,openMouth.getY(j)*5-1.2);
mouthGeometry.morphAttributes.position=[openMouth];
mouth.geometry=mouthGeometry; mouth.updateMorphTargets(); mouth.morphTargetDictionary={Speak:0};
tube('LowerLip',[[-.027,.077,.147],[0,.073,.15],[.027,.077,.147]],.004,lip,head);

for (const [side,x] of [['Left',-.23],['Right',.23]]) {
  const arm=group(`Pilot${side}Arm`,[x,.37,0],pilot);
  const direction=x<0?-1:1;
  rod(`${side}UpperArm`,[0,0,0],[direction*.035,-.23,.08],.071,hoodie,arm,.065);
  ellipsoid(`${side}Elbow`,hoodie,[direction*.035,-.23,.08],[.07,.07,.07],arm);
  rod(`${side}Forearm`,[direction*.035,-.23,.08],[-direction*.12,-.28,.33],.056,hoodie,arm,.049);
  ellipsoid(`${side}Hand`,skin,[-direction*.12,-.28,.35],[.046,.046,.065],arm);
  ellipsoid(`${side}Thumb`,skin,[-direction*.15,-.25,.36],[.021,.034,.025],arm);
}
rod('ControlStick',[0,.02,.36],[0,.17,.4],.021,trim,pilot);
ellipsoid('ControlGrip',trim,[0,.17,.4],[.07,.055,.047],pilot);
ellipsoid('ControlButton',light,[0,.218,.4],[.027,.006,.021],pilot);

const axisX=new THREE.Vector3(1,0,0), axisY=new THREE.Vector3(0,1,0), axisZ=new THREE.Vector3(0,0,1);
function rotations(name,axis,angles,times) {
  return new THREE.QuaternionKeyframeTrack(`${name}.quaternion`,times,angles.flatMap((angle)=>new THREE.Quaternion().setFromAxisAngle(axis,angle).toArray()));
}
const clips=[
  new THREE.AnimationClip('RotorSpin',1,[
    rotations('MainRotor',axisY,[0,Math.PI/2,Math.PI,Math.PI*1.5,Math.PI*2],[0,.25,.5,.75,1]),
    rotations('TailRotor',axisZ,[0,-Math.PI/2,-Math.PI,-Math.PI*1.5,-Math.PI*2],[0,.25,.5,.75,1]),
  ]),
  new THREE.AnimationClip('Hover',4,[new THREE.VectorKeyframeTrack('Helicopter.position',[0,1,2,3,4],[0,0,0,0,.055,0,0,0,0,0,-.035,0,0,0,0]),rotations('Helicopter',axisX,[0,.012,0,-.012,0],[0,1,2,3,4])]),
  new THREE.AnimationClip('LookAround',4,[rotations('PilotHead',axisY,[0,-.35,0,.35,0],[0,1,2,3,4])]),
  new THREE.AnimationClip('Greet',2,[rotations('PilotRightArm',axisZ,[0,-.42,-.7,-.48,-.7,0],[0,.4,.8,1.2,1.6,2])]),
  new THREE.AnimationClip('Blink',4,eyelids.map((lid)=>new THREE.NumberKeyframeTrack(`${lid.name}.morphTargetInfluences`,[0,2.8,2.9,3.04,3.16,4],[0,0,1,1,0,0]))),
  new THREE.AnimationClip('Speak',1.4,[new THREE.NumberKeyframeTrack('PilotMouth.morphTargetInfluences',[0,.12,.24,.36,.48,.60,.72,.84,.96,1.08,1.2,1.4],[0,.65,.15,1,.25,.7,0,.6,.2,.9,.3,0]),rotations('PilotHead',axisX,[0,.06,-.03,.04,0],[0,.35,.7,1.05,1.4])]),
];
scene.updateMatrixWorld(true);
const binary=await new GLTFExporter().parseAsync(scene,{binary:true,animations:clips,onlyVisible:true});
const modelPath=path.join(output,'developer-helicopter.glb');
await writeFile(modelPath,Buffer.from(binary));

// Bundle the installed runtime so the preview works without a CDN or account.
const runtimeFiles=[
  ['build/three.module.js','three.module.js'],['build/three.core.js','three.core.js'],
  ['examples/jsm/loaders/GLTFLoader.js','GLTFLoader.js'],
  ['examples/jsm/controls/OrbitControls.js','OrbitControls.js'],
  ['examples/jsm/environments/RoomEnvironment.js','RoomEnvironment.js'],
];
await mkdir(path.join(output,'vendor'),{recursive:true});
for(const [from,to] of runtimeFiles) {
  await copyFile(path.join(project,'node_modules/three',from),path.join(output,'vendor',to));
}
// Preserve relative utility import paths used by the official GLTFLoader.
await mkdir(path.join(output,'utils'),{recursive:true});
for(const name of ['BufferGeometryUtils.js','SkeletonUtils.js']) await copyFile(path.join(project,'node_modules/three/examples/jsm/utils',name),path.join(output,'utils',name));
await copyFile(path.join(project,'node_modules/three/LICENSE'),path.join(output,'vendor/LICENSE'));
console.log(`Created ${modelPath} (${(binary.byteLength/1024).toFixed(0)} KiB), ${clips.length} animation clips.`);
