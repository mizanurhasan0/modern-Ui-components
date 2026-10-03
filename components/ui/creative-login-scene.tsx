"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";

export type ScenePoint = { x: number; y: number };
export type SceneFrame = {
  /** Seconds elapsed at the reference video's playback speed. */
  elapsed: number;
  phase: "entrance" | "waiting";
  /** Clockwise: top left, top right, bottom right, bottom left. Normalized 0–1. */
  corners: ScenePoint[];
  /** Resting corners in the same camera, for a relative CSS projective transform. */
  restingCorners: ScenePoint[];
};

export type CharacterSceneAssets = Record<
  "body" | "hair" | "beard" | "blazer" | "pants" | "shoes" | "entrance" | "waiting" | "environment",
  string
>;

const DEFAULT_ASSETS: CharacterSceneAssets = {
  body: "/creative-login/body.glb.gz",
  hair: "/creative-login/hair.glb.gz",
  beard: "/creative-login/beard.glb.gz",
  blazer: "/creative-login/blazer.glb.gz",
  pants: "/creative-login/pants.glb.gz",
  shoes: "/creative-login/shoes.glb.gz",
  entrance: "/creative-login/entrance.glb.gz",
  waiting: "/creative-login/waiting.glb.gz",
  environment: "/creative-login/environment.exr",
};

const REFERENCE_SPEED = 4 / 3;
const PART_NAMES = ["body", "hair", "beard", "blazer", "pants", "shoes"] as const;

const COLORS: Record<string, Record<string, string>> = {
  body: { "Vis_Skin.002": "#F6C6AB", "Vis_Eye_Color.003": "#90543C", "Vis_Hair.003": "#6e4c00" },
  hair: { "Vis_Hair.004": "#996c00" },
  beard: { "Vis_Hair.002": "#996c00" },
  blazer: { "Vis_Fabric_A.002": "#7b7b7b", "Vis_Fabric_A": "#dfdfdf" },
  pants: { "Vis_Fabric_E.078": "#303030", "Vis_Leather_A": "#1f1f1f" },
  shoes: { "Vis_Fabric_A": "#dfdfdf", "Vis_Solid_B.001": "#818181" },
};

function assembleCharacter(scene: THREE.Object3D, parts: Record<string, GLTF>) {
  const bones = new Map<string, THREE.Bone>();
  const normalize = (name: string) => name.replace(/_1$/, "");
  scene.traverse((node) => {
    if ((node as THREE.Bone).isBone) bones.set(normalize(node.name), node as THREE.Bone);
    node.frustumCulled = false;
  });
  const rig = scene.getObjectByName("Rig002") ?? scene.getObjectByName("Rig.002");
  if (!rig) throw new Error("The character animation has no root rig.");

  for (const part of PART_NAMES) {
    const meshes: THREE.SkinnedMesh[] = [];
    parts[part].scene.traverse((node) => {
      if ((node as THREE.SkinnedMesh).isSkinnedMesh) meshes.push(node as THREE.SkinnedMesh);
    });
    for (const original of meshes) {
      const mesh = original.clone();
      const skeleton = original.skeleton.clone();
      skeleton.bones = original.skeleton.bones.map((bone) => {
        const target = bones.get(normalize(bone.name));
        if (!target) throw new Error(`Missing character bone: ${bone.name}`);
        return target;
      });
      mesh.position.set(0, 0, 0);
      mesh.quaternion.identity();
      mesh.scale.set(1, 1, 1);
      mesh.bind(skeleton, new THREE.Matrix4());
      mesh.frustumCulled = false;
      const recolor = (material: THREE.Material) => {
        const copy = material.clone() as THREE.MeshStandardMaterial;
        const color = COLORS[part]?.[material.name];
        if (color && copy.color) copy.color.set(color);
        return copy;
      };
      mesh.material = Array.isArray(original.material)
        ? original.material.map(recolor)
        : recolor(original.material);
      rig.add(mesh);
    }
  }
  const placeholder = scene.getObjectByName("ExportRig");
  if (placeholder) placeholder.visible = false;
}

function planeCorners(plane: THREE.Mesh, camera: THREE.Camera): ScenePoint[] {
  if (!plane.geometry.boundingBox) plane.geometry.computeBoundingBox();
  const box = plane.geometry.boundingBox!;
  return [
    [box.min.x, box.max.y], [box.max.x, box.max.y],
    [box.max.x, box.min.y], [box.min.x, box.min.y],
  ].map(([x, y]) => {
    const point = new THREE.Vector3(x, y, 0).applyMatrix4(plane.matrixWorld).project(camera);
    return { x: (point.x + 1) / 2, y: (1 - point.y) / 2 };
  });
}

/** Compressed, self-contained GLBs need no external Draco decoder or CDN. */
async function loadModel(loader: GLTFLoader, url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Unable to load character (${response.status}).`);
  const bytes = await response.arrayBuffer();
  const signature = new Uint8Array(bytes, 0, Math.min(2, bytes.byteLength));
  const buffer = signature[0] === 0x1f && signature[1] === 0x8b
    ? await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer()
    : bytes;
  return loader.parseAsync(buffer, "");
}

export function CharacterScene({
  intro = true,
  reducedMotion = false,
  assets = DEFAULT_ASSETS,
  onReady,
  onProgress,
  onError,
}: {
  intro?: boolean;
  reducedMotion?: boolean;
  assets?: CharacterSceneAssets;
  onReady?: () => void;
  onProgress?: (frame: SceneFrame) => void;
  onError?: (error: Error) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onReady, onProgress, onError });
  useEffect(() => { callbacks.current = { onReady, onProgress, onError }; }, [onReady, onProgress, onError]);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;
    let disposed = false;
    let failed = false;
    let frameId = 0;
    let resize: ResizeObserver | undefined;
    let renderer: THREE.WebGLRenderer | undefined;
    let environmentTarget: THREE.WebGLRenderTarget | undefined;
    const requests = new AbortController();
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    const skeletons = new Set<THREE.Skeleton>();

    const trackObject = (object: THREE.Object3D) => {
      object.traverse((node) => {
        if (!(node as THREE.Mesh).isMesh) return;
        const mesh = node as THREE.Mesh;
        geometries.add(mesh.geometry);
        const entries = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const material of entries) {
          materials.add(material);
          for (const value of Object.values(material)) {
            if (value instanceof THREE.Texture) textures.add(value);
          }
        }
        if ((node as THREE.SkinnedMesh).isSkinnedMesh) skeletons.add((node as THREE.SkinnedMesh).skeleton);
      });
    };
    const disposeAssets = () => {
      for (const resource of [...geometries, ...materials, ...textures, ...skeletons]) resource.dispose();
      geometries.clear();
      materials.clear();
      textures.clear();
      skeletons.clear();
    };
    const cleanup = () => {
      requests.abort();
      cancelAnimationFrame(frameId);
      resize?.disconnect();
      environmentTarget?.dispose();
      environmentTarget = undefined;
      disposeAssets();
      renderer?.dispose();
      renderer?.domElement.remove();
      renderer = undefined;
    };

    async function start() {
      const gl = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
      renderer = gl;
      gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      gl.setClearColor(0, 0);
      gl.outputColorSpace = THREE.SRGBColorSpace;
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = 2.9;
      gl.domElement.style.cssText = "display:block;width:100%;height:100%;";
      host!.appendChild(gl.domElement);

      const loader = new GLTFLoader();
      const modelKeys = [...PART_NAMES, "entrance", "waiting"] as const;
      const [models, environment] = await Promise.all([
        Promise.all(modelKeys.map(async (key) => {
          const model = await loadModel(loader, assets[key], requests.signal);
          // Originals also own materials and skeletons, even when only their
          // cloned geometry is attached to the rendered character.
          trackObject(model.scene);
          if (disposed || failed) disposeAssets();
          return [key, model] as const;
        })),
        new EXRLoader().loadAsync(assets.environment).then((texture) => {
          textures.add(texture);
          if (disposed || failed) disposeAssets();
          return texture;
        }),
      ]);
      if (disposed || failed) return;
      const loaded = Object.fromEntries(models) as Record<string, GLTF>;
      const entrance = loaded.entrance;
      const waiting = loaded.waiting;
      const world = new THREE.Scene();
      world.add(entrance.scene);
      assembleCharacter(entrance.scene, loaded);
      trackObject(world);
      const pmrem = new THREE.PMREMGenerator(gl);
      environmentTarget = pmrem.fromEquirectangular(environment);
      world.environment = environmentTarget.texture;
      environment.dispose();
      textures.delete(environment);
      pmrem.dispose();

      const shadowCanvas = document.createElement("canvas");
      shadowCanvas.width = shadowCanvas.height = 128;
      const context = shadowCanvas.getContext("2d");
      if (context) {
        const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, "rgba(0,0,0,0.7)");
        gradient.addColorStop(0.4, "rgba(0,0,0,0.35)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        context.fillStyle = gradient;
        context.fillRect(0, 0, 128, 128);
      }
      const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
          color: "#142052", map: new THREE.CanvasTexture(shadowCanvas),
          transparent: true, opacity: 0.16, depthWrite: false, toneMapped: false,
        }),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.renderOrder = -1;
      world.add(shadow);
      trackObject(shadow);
      const leftFoot = entrance.scene.getObjectByName("DEF-footL");
      const rightFoot = entrance.scene.getObjectByName("DEF-footR");
      const leftFootPosition = new THREE.Vector3();
      const rightFootPosition = new THREE.Vector3();

      // Framing calibrated to the reference video’s 640 × 404 stage.
      const camera = new THREE.PerspectiveCamera(40.2, 640 / 404, 0.1, 1000);
      camera.position.set(0.81, 1.148, 4.5134897);
      camera.updateMatrixWorld();
      const plane = entrance.scene.getObjectByName("Form_Plane") as THREE.Mesh;
      if (!plane) throw new Error("The animation has no form plane.");
      plane.visible = false;
      const briefcase = entrance.scene.getObjectByName("Briefcase002") ?? entrance.scene.getObjectByName("Briefcase.002");
      const mixer = new THREE.AnimationMixer(entrance.scene);
      const entranceAction = mixer.clipAction(entrance.animations[0]);
      entranceAction.setLoop(THREE.LoopOnce, 1);
      entranceAction.clampWhenFinished = true;
      const waitingAction = mixer.clipAction(waiting.animations[0]);
      const introDuration = entrance.animations[0].duration;
      let restingCorners: ScenePoint[] = [];

      entranceAction.play();
      mixer.setTime(introDuration);
      world.updateMatrixWorld(true);
      // Retain the resting plane in world space, then project it with the
      // actual camera aspect whenever the stage changes size.
      const restingPlane = plane.clone();
      restingPlane.matrixAutoUpdate = false;
      restingPlane.matrixWorld.copy(plane.matrixWorld);
      entranceAction.stop();
      mixer.setTime(0);
      let phase: SceneFrame["phase"] = intro && !reducedMotion ? "entrance" : "waiting";
      if (phase === "entrance") entranceAction.reset().play();
      else {
        waitingAction.play();
        mixer.setTime(1.2);
        if (briefcase) briefcase.visible = false;
      }

      let previous = performance.now();
      let elapsed = 0;
      const draw = () => {
        world.updateMatrixWorld(true);
        if (leftFoot && rightFoot) {
          leftFoot.getWorldPosition(leftFootPosition);
          rightFoot.getWorldPosition(rightFootPosition);
          shadow.position.set(
            (leftFootPosition.x + rightFootPosition.x) / 2,
            0.005,
            (leftFootPosition.z + rightFootPosition.z) / 2,
          );
          const spread = Math.abs(leftFootPosition.x - rightFootPosition.x);
          shadow.scale.set(0.65 + spread, 0.35, 1);
          const height = Math.max(0, Math.min(leftFootPosition.y, rightFootPosition.y) - 0.1);
          shadow.material.opacity = 0.16 * Math.max(0.25, 1 - height);
        }
        gl.render(world, camera);
        callbacks.current.onProgress?.({ elapsed, phase, corners: planeCorners(plane, camera), restingCorners });
      };
      const fit = () => {
        const { width, height } = host!.getBoundingClientRect();
        if (!width || !height) return;
        gl.setSize(width, height, false);
        camera.aspect = width / height;
        // Keep the source stage's vertical composition as its CSS stage scales.
        camera.updateProjectionMatrix();
        restingCorners = planeCorners(restingPlane, camera);
        if (reducedMotion) draw();
      };
      resize = new ResizeObserver(fit);
      resize.observe(host!);
      fit();
      const render = (now: number) => {
        if (disposed) return;
        // Background tabs may receive only one animation frame per second.
        // Preserve elapsed time so the character stays synchronized with the form.
        const delta = Math.max((now - previous) / 1000, 0);
        previous = now;
        if (!reducedMotion) {
          elapsed += delta;
          mixer.update(delta * REFERENCE_SPEED);
          if (phase === "entrance" && entranceAction.time >= introDuration) {
            phase = "waiting";
            entranceAction.stop();
            waitingAction.reset().play();
            mixer.update(0);
            if (briefcase) briefcase.visible = false;
          }
        }
        draw();
        if (!reducedMotion) frameId = requestAnimationFrame(render);
      };
      render(previous);
      callbacks.current.onReady?.();
    }

    start().catch((error: unknown) => {
      if (disposed) return;
      failed = true;
      cleanup();
      callbacks.current.onError?.(error instanceof Error ? error : new Error(String(error)));
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [intro, reducedMotion, assets]);

  return <div ref={containerRef} aria-hidden="true" className="pointer-events-none absolute inset-0" />;
}
