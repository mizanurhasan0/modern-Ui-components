# Developer helicopter — editable 3D concept

- **Asset:** `developer-helicopter.glb` — standalone glTF 2.0 binary, about 626 KiB.
- **Preview:** `/models/developer-helicopter/index.html` on the running Next.js app.
- **Rebuild:** `node scripts/create-helicopter-model.mjs` from the project root.
- **Coordinates:** Y up, helicopter nose along +X; units are meters.
- **Materials:** PBR shell, mint trim, clear transmission canopy. No external textures.

The model is a procedural, stylized interpretation of the approved helicopter image
and the developer reference portrait. Facial likeness is approximate. It is not a
photogrammetry scan or a frame-for-frame reconstruction of the generated image.

## Animation clips

| Clip | Duration | Purpose |
| --- | --- | --- |
| `RotorSpin` | 1 s | Separate main and tail rotor pivots; adjust playback speed. |
| `Hover` | 4 s | Gentle vertical movement and body roll. |
| `LookAround` | 4 s | Pilot head turns from side to side. |
| `Greet` | 2 s | A small right arm greeting gesture. |
| `Blink` | 4 s | Both eyelid morph targets close and open. |
| `Speak` | 1.4 s | Mouth morph target with subtle head nods; visual only, no audio. |

Play `RotorSpin`, `Hover`, and `Blink` together. Choose one of `LookAround`,
`Greet`, or `Speak` as the pilot's current interaction. When directly controlling
the head with pointer input, stop the clips that also animate `PilotHead`.
All clips loop by default when loaded with Three.js `AnimationMixer`.

## Editable controls

- `Helicopter`: complete vehicle pivot.
- `MainRotor`, `TailRotor`: independent rotor pivots.
- `Canopy`: clear glass; hide this mesh to see or edit the pilot.
- `Pilot`, `PilotHead`, `PilotRightArm`, `PilotLeftArm`: articulated object pivots.
- `BlinkLeft`, `BlinkRight`: each has one morph target named `Blink`.
- `PilotMouth`: one morph target named `Speak`.

The pilot uses object pivots rather than a full skeletal skin. A full-body
deformation rig and phoneme-specific lip sync would be additional modeling work.
Import the GLB into Blender to edit the meshes, materials, transforms, and clips.

## Minimal Three.js loading

```js
import { AnimationMixer } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const gltf = await new GLTFLoader().loadAsync(
  '/models/developer-helicopter/developer-helicopter.glb',
);
scene.add(gltf.scene);
const mixer = new AnimationMixer(gltf.scene);
for (const name of ['RotorSpin', 'Hover', 'Blink']) {
  const clip = gltf.animations.find((item) => item.name === name);
  if (clip) mixer.clipAction(clip).play();
}
// Call mixer.update(deltaSeconds) from the render loop.
```

The preview bundles the project's installed Three.js runtime locally. Its MIT
license is preserved in `vendor/LICENSE`. The GLB itself does not require the
preview's `vendor` or `utils` folders.

## Website co-pilot

The home page uses `components/site/hero/cursor-helicopter.tsx` and the lazy-loaded
`helicopter-scene.ts` renderer. Direction comes from accumulated pointer travel,
so slow movements turn the craft without jitter flipping it back and forth.
The model turns around a centered 3D pivot and retains its last facing direction.
The camera reserves room for the turning arc and rotor tips.

When the pointer rests away from cards, it chooses a figure-eight, a curious
glance, a gentle wiggle, or a greeting. Clicking noninteractive empty space
triggers a little hop. These moves stay inside the cursor canvas and stop when
a component explanation opens. The information bubble types its description
while reserving its final height, and cancels typing on a component change.

Touch devices and reduced-motion preferences disable the cursor companion.
The WebGL loop pauses while hidden and is capped at 30 rendered frames per second.
