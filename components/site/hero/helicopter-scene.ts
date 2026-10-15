import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { RefObject } from "react";
import type { HelicopterFlightPhase } from "./helicopter-landing";

export type HelicopterMotion = {
  lookX: number; lookY: number; velocityX: number; velocityY: number;
  facing: 1 | -1; movedAt: number; tapAt: number;
  footprint?: { x: number; y: number; top: number };
  onFootprintChange?: () => void;
};
export type HelicopterState = { active: boolean; talking: boolean; guideKey: string; phase: HelicopterFlightPhase };
export type HelicopterController = { setState: (state: HelicopterState) => void; dispose: () => void };

const MODEL_URL = "/models/developer-helicopter/developer-helicopter.glb";
const FRAME_INTERVAL = 1000 / 30;

/** A small transparent WebGL scene; no render loop runs while the guide is hidden. */
export async function createHelicopterScene(
  host: HTMLDivElement,
  motion: RefObject<HelicopterMotion>,
  signal: AbortSignal,
  onContextLost: () => void,
): Promise<HelicopterController> {
  const response = await fetch(MODEL_URL, { signal });
  if (!response.ok) throw new Error("Helicopter model is unavailable.");
  const gltf = await new GLTFLoader().parseAsync(await response.arrayBuffer(), "/models/developer-helicopter/");
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  gltf.scene.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    geometries.add(node.geometry);
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  let renderer: THREE.WebGLRenderer | undefined;
  let environment: THREE.WebGLRenderTarget | undefined;
  let resize: ResizeObserver | undefined;
  let frame = 0;
  let lastFrame = 0;
  let disposed = false;
  let resume: () => void = () => undefined;
  let state: HelicopterState = { active: false, talking: false, guideKey: "", phase: "flying" };
  const mixer = new THREE.AnimationMixer(gltf.scene);
  const actions = new Map(gltf.animations.map((clip) => [clip.name, mixer.clipAction(clip)]));

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastFrame = 0;
  }
  function contextLost(event: Event) {
    event.preventDefault();
    stop();
    onContextLost();
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    stop();
    document.removeEventListener("visibilitychange", visibilityChange);
    resize?.disconnect();
    renderer?.domElement.removeEventListener("webglcontextlost", contextLost);
    mixer.stopAllAction();
    mixer.uncacheRoot(gltf.scene);
    for (const resource of [...geometries, ...materials, ...textures]) resource.dispose();
    environment?.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss();
    renderer?.domElement.remove();
  }
  function visibilityChange() {
    if (document.hidden) stop();
    else resume();
  }
  // Fetch/decode can finish after React has unmounted the cursor.
  if (signal.aborted) { dispose(); throw new DOMException("Aborted", "AbortError"); }

  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    host.appendChild(renderer.domElement);
    const world = new THREE.Scene();
    const flightRig = new THREE.Group();
    const pivot = new THREE.Vector3(-.85, 1.35, 0);
    flightRig.position.copy(pivot);
    gltf.scene.position.sub(pivot);
    flightRig.add(gltf.scene);
    world.add(flightRig);

    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    try { environment = pmrem.fromScene(room, .04, .1, 100, { size: 64 }); }
    finally { room.dispose(); pmrem.dispose(); }
    world.environment = environment.texture;
    world.add(new THREE.HemisphereLight("#f4fff9", "#647580", 2));
    const key = new THREE.DirectionalLight("#fff0dd", 3.5);
    key.position.set(3, 6, 5); world.add(key);
    const rim = new THREE.DirectionalLight("#aeffe2", 2);
    rim.position.set(-3, 3, -4); world.add(rim);

    const canopy = gltf.scene.getObjectByName("Canopy");
    if (canopy instanceof THREE.Mesh && canopy.material instanceof THREE.MeshPhysicalMaterial) {
      // An alpha canopy preserves the page underneath this transparent overlay.
      // The downloadable GLB retains its original physical transmission material.
      const glass = canopy.material.clone();
      glass.transmission = 0;
      glass.transparent = true;
      glass.color.set("#4b879e");
      glass.opacity = .34;
      glass.roughness = .08;
      glass.clearcoat = 1;
      glass.envMapIntensity = .3;
      glass.depthWrite = false;
      glass.side = THREE.FrontSide;
      canopy.material = glass;
      materials.add(glass);
      const outlineGeometry = new THREE.EdgesGeometry(canopy.geometry, 30);
      const outlineMaterial = new THREE.LineBasicMaterial({ color: "#428aa0", transparent: true, opacity: .9, toneMapped: false });
      canopy.add(new THREE.LineSegments(outlineGeometry, outlineMaterial));
      geometries.add(outlineGeometry); materials.add(outlineMaterial);
      // Deliberate highlights keep the curved glass legible at cursor size.
      const reflectionMaterial = new THREE.MeshBasicMaterial({ color: "#f2ffff", transparent: true, opacity: .75, depthWrite: false });
      materials.add(reflectionMaterial);
      for (const phi of [.75, 1.15]) {
        const points = Array.from({ length: 12 }, (_, i) => {
          const theta = .38 + i / 11 * .48;
          return new THREE.Vector3(1.148 * Math.cos(theta), 1.35 + .928 * Math.sin(theta) * Math.cos(phi), .827 * Math.sin(theta) * Math.sin(phi));
        });
        const geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 16, .012, 5, false);
        canopy.add(new THREE.Mesh(geometry, reflectionMaterial));
        geometries.add(geometry);
      }
    }
    gltf.scene.traverse((node) => {
      if (!(node instanceof THREE.Mesh) || !node.name.startsWith("MainBlade_")) return;
      node.scale.y *= 3;
      node.scale.z *= 1.35;
      // Unlit color avoids small blades washing out under the studio lights.
      const blade = new THREE.MeshBasicMaterial({ color: "#299c75", side: THREE.DoubleSide, toneMapped: false });
      node.material = blade;
      materials.add(blade);
      const edgeGeometry = new THREE.EdgesGeometry(node.geometry, 35);
      const edgeMaterial = new THREE.LineBasicMaterial({ color: "#1a6e52", transparent: true, opacity: .7, toneMapped: false });
      node.add(new THREE.LineSegments(edgeGeometry, edgeMaterial));
      geometries.add(edgeGeometry); materials.add(edgeMaterial);
    });
    const camera = new THREE.OrthographicCamera(-2.4, 2.4, 1.8, -1.8, .1, 30);
    camera.position.set(4.5, 5.0, 8);
    camera.lookAt(-.85, 1.35, 0);
    camera.updateMatrixWorld();
    // Reserve space for the entire turning arc as well as the rotor blades.
    const projected = new THREE.Box3();
    const leftHeading = -Math.PI * .68;
    for (const heading of [leftHeading, -1.6, -1.1, -.55, 0, .2]) {
      flightRig.rotation.y = heading;
      world.updateMatrixWorld(true);
      gltf.scene.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        node.geometry.computeBoundingBox();
        const bounds = node.geometry.boundingBox;
        if (!bounds) return;
        for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
          projected.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(node.matrixWorld).applyMatrix4(camera.matrixWorldInverse));
        }
      });
    }
    flightRig.rotation.y = 0;
    world.updateMatrixWorld(true);
    const projectedSize = projected.getSize(new THREE.Vector3());
    const projectedCenter = projected.getCenter(new THREE.Vector3());
    camera.position.add(new THREE.Vector3(projectedCenter.x, projectedCenter.y, 0).applyQuaternion(camera.quaternion));
    camera.updateMatrixWorld();
    resize = new ResizeObserver(() => {
      if (!renderer || disposed) return;
      const width = host.clientWidth, height = host.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      const aspect = width / height;
      const halfHeight = Math.max(projectedSize.y / 2, projectedSize.x / (2 * aspect)) * 1.12;
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
    });
    resize.observe(host);
    const head = gltf.scene.getObjectByName("PilotHead");
    const pilot = gltf.scene.getObjectByName("Pilot");
    const pilotYaw = pilot?.rotation.y ?? 0;
    for (const name of ["RotorSpin", "Hover", "Blink"]) actions.get(name)?.play();
    actions.get("RotorSpin")?.setEffectiveTimeScale(2.7);
    const greeting = actions.get("Greet");
    greeting?.setLoop(THREE.LoopOnce, 1);
    mixer.addEventListener("finished", (event) => { if (event.action === greeting) greeting?.fadeOut(.25); });

    type Maneuver = "figure-eight" | "curious" | "wiggle" | "salute" | "boost";
    const idleMoves: Maneuver[] = ["figure-eight", "curious", "wiggle", "salute"];
    let elapsed = 0;
    let nextPlay = 2;
    let playStarted = 0;
    let playDuration = 0;
    let maneuver: Maneuver | null = null;
    let previousManeuver: Maneuver | null = null;
    let lastTap = 0;
    let contact = 0;
    let rotorSpeed = 2.7;
    let takeoffStarted = 0;
    const targetPosition = new THREE.Vector3();
    const contactParts: { node: THREE.Mesh; points: THREE.Vector3[]; foot: boolean }[] = [];
    gltf.scene.traverse((node) => {
      if (!(node instanceof THREE.Mesh) || !(node.name.startsWith("LandingSkid_") || node.name.startsWith("MainBlade_"))) return;
      const positions = node.geometry.attributes.position;
      const points = [];
      for (let i = 0; i < positions.count; i++) points.push(new THREE.Vector3().fromBufferAttribute(positions, i));
      contactParts.push({ node, points, foot: node.name.startsWith("LandingSkid_") });
    });
    const projectedPoint = new THREE.Vector3();
    function updateFootprint() {
      const width = host.clientWidth, height = host.clientHeight;
      if (!width || !height) return;
      flightRig.updateWorldMatrix(true, true);
      let left = Infinity, right = -Infinity, bottom = -Infinity, top = Infinity;
      for (const part of contactParts) for (const point of part.points) {
        projectedPoint.copy(point).applyMatrix4(part.node.matrixWorld).project(camera);
        const x = (projectedPoint.x * .5 + .5) * width;
        const y = (-projectedPoint.y * .5 + .5) * height;
        if (part.foot) { left = Math.min(left, x); right = Math.max(right, x); bottom = Math.max(bottom, y); }
        else top = Math.min(top, y);
      }
      if (![left, right, bottom, top].every(Number.isFinite)) return;
      const next = { x: (left + right) / 2, y: bottom, top };
      const previous = motion.current.footprint;
      if (!previous || Math.max(Math.abs(next.x - previous.x), Math.abs(next.y - previous.y), Math.abs(next.top - previous.top)) > .2) {
        motion.current.footprint = next;
        motion.current.onFootprintChange?.();
      }
    }
    function beginPlay(kind: Maneuver, duration: number) {
      maneuver = kind;
      previousManeuver = kind;
      playStarted = elapsed;
      playDuration = duration;
      if (kind === "salute" || kind === "boost") greeting?.reset().fadeIn(.15).play();
    }

    function tick(now: number) {
      if (disposed || !state.active || document.hidden) { frame = 0; return; }
      frame = requestAnimationFrame(tick);
      if (lastFrame && now - lastFrame < FRAME_INTERVAL) return;
      const delta = lastFrame ? Math.min((now - lastFrame) / 1000, .08) : 0;
      lastFrame = now;
      elapsed += delta;
      const grounded = state.phase === "landed";
      const docking = grounded || state.phase === "landing";
      contact = THREE.MathUtils.damp(contact, grounded ? 1 : docking ? .45 : 0, 8, delta);
      if (grounded && contact > .998) contact = 1;
      rotorSpeed = THREE.MathUtils.damp(rotorSpeed, grounded ? 0 : docking ? .9 : state.phase === "taking-off" ? 3.6 : 2.7, grounded ? 4 : 7, delta);
      if (grounded && rotorSpeed < .03) rotorSpeed = 0;
      actions.get("RotorSpin")?.setEffectiveTimeScale(rotorSpeed);
      actions.get("Hover")?.setEffectiveWeight(1 - contact);
      mixer.update(delta);
      const amount = 1 - Math.exp(-delta * 6);
      const input = motion.current;
      const stillFor = input.movedAt ? (now - input.movedAt) / 1000 : elapsed;
      const moving = stillFor < .22;
      if (state.phase !== "flying" || state.guideKey || (moving && maneuver !== "boost")) maneuver = null;
      if (input.tapAt > lastTap) {
        lastTap = input.tapAt;
        if (!state.guideKey && state.phase === "flying") beginPlay("boost", 1.3);
      }
      if (maneuver && elapsed - playStarted >= playDuration) {
        maneuver = null;
        nextPlay = elapsed + 3 + Math.random() * 3;
      }
      if (state.phase === "flying" && !state.guideKey && !moving && stillFor > 1.3 && !maneuver && elapsed >= nextPlay) {
        const options = idleMoves.filter((kind) => kind !== previousManeuver);
        beginPlay(options[Math.floor(Math.random() * options.length)], 2.6 + Math.random());
      }
      const progress = maneuver ? Math.min((elapsed - playStarted) / playDuration, 1) : 0;
      const phase = progress * Math.PI * 2;
      const envelope = Math.sin(progress * Math.PI);
      let offsetX = 0, offsetY = 0, offsetZ = 0, yaw = 0, roll = 0;
      if (maneuver === "figure-eight") {
        offsetX = Math.sin(phase) * .16;
        offsetY = Math.sin(phase * 2) * .09;
        offsetZ = Math.sin(phase + .7) * .06 * envelope;
        roll = Math.sin(phase) * .08;
      } else if (maneuver === "curious") {
        yaw = Math.sin(phase) * .28;
        offsetY = envelope * .1;
      } else if (maneuver === "wiggle") {
        roll = Math.sin(phase * 3) * .13 * envelope;
        offsetX = Math.sin(phase * 2) * .06 * envelope;
      } else if (maneuver === "salute") {
        offsetY = Math.sin(phase) * .07;
      } else if (maneuver === "boost") {
        offsetY = envelope * .2;
        roll = Math.sin(phase) * .13;
      }
      if (state.phase === "taking-off") offsetY += Math.sin(Math.min((elapsed - takeoffStarted) / .45, 1) * Math.PI) * .1;
      const targetHeading = (input.facing === -1 ? leftHeading : 0) + yaw;
      flightRig.rotation.y = THREE.MathUtils.damp(flightRig.rotation.y, targetHeading, 6, delta);
      flightRig.rotation.z = THREE.MathUtils.lerp(flightRig.rotation.z, docking ? 0 : -input.velocityY * .13 + roll, amount);
      flightRig.rotation.x = THREE.MathUtils.lerp(flightRig.rotation.x, docking ? 0 : input.velocityX * .06, amount);
      targetPosition.set(pivot.x + offsetX, pivot.y + offsetY, pivot.z + offsetZ);
      flightRig.position.lerp(targetPosition, amount);
      // Swivel the pilot toward the visitor while the aircraft turns around.
      if (pilot) pilot.rotation.y = THREE.MathUtils.damp(pilot.rotation.y, pilotYaw - flightRig.rotation.y * .72, 5, delta);
      // Velocity settles independently of pointer events when the mouse stops.
      input.velocityX *= Math.exp(-delta * 5);
      input.velocityY *= Math.exp(-delta * 5);
      if (head && !state.talking) {
        head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, input.lookX * .4 + yaw * .4, amount);
        head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, input.lookY * .15, amount);
        head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, maneuver === "curious" ? Math.sin(phase) * .1 : 0, amount);
      }
      if (state.phase !== "flying" || !motion.current.footprint) updateFootprint();
      const mode = state.phase !== "flying" ? state.phase : state.guideKey ? state.talking ? "explaining" : "presenting" : maneuver ?? (moving ? "following" : "hovering");
      if (host.dataset.flightMode !== mode) host.dataset.flightMode = mode;
      const facing = input.facing === -1 ? "left" : "right";
      if (host.dataset.facing !== facing) host.dataset.facing = facing;
      if (host.dataset.rotor !== (rotorSpeed === 0 ? "stopped" : "spinning")) host.dataset.rotor = rotorSpeed === 0 ? "stopped" : "spinning";
      renderer?.render(world, camera);
    }
    function startLoop() {
      if (!frame && state.active && !document.hidden && !disposed) frame = requestAnimationFrame(tick);
    }
    // Assigned before the controller is returned; visibility callbacks share it.
    resume = startLoop;
    document.addEventListener("visibilitychange", visibilityChange);
    return {
      setState(next) {
        if (disposed) return;
        if (next.phase === "taking-off" && state.phase !== "taking-off") { takeoffStarted = elapsed; nextPlay = elapsed + 4; }
        if (next.phase === "landed" && state.phase !== "landed") greeting?.reset().fadeIn(.18).play();
        if (next.talking !== state.talking) {
          const speech = actions.get("Speak");
          if (next.talking) speech?.reset().fadeIn(.18).play();
          else speech?.fadeOut(.18);
        }
        if (next.guideKey && next.guideKey !== state.guideKey) greeting?.reset().fadeIn(.18).play();
        if (!next.guideKey && state.guideKey) greeting?.fadeOut(.2);
        state = next;
        if (state.active) startLoop(); else stop();
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
