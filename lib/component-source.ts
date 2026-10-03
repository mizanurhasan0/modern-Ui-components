import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";
import { getComponent } from "@/lib/component-registry";

const creativeLoginAssetTypes = {
  "body.glb.gz": "application/gzip",
  "hair.glb.gz": "application/gzip",
  "beard.glb.gz": "application/gzip",
  "blazer.glb.gz": "application/gzip",
  "pants.glb.gz": "application/gzip",
  "shoes.glb.gz": "application/gzip",
  "entrance.glb.gz": "application/gzip",
  "waiting.glb.gz": "application/gzip",
  "environment.exr": "image/x-exr",
  "font-regular.ttf": "font/ttf",
  "font-bold.ttf": "font/ttf",
  "poster.png": "image/png",
} as const;

const clientDirective = /^\s*["']use client["'];?\s*/;
const sceneImport =
  /^import\s*\{[^}]*\}\s*from\s*["'](?:\.\/|@\/components\/ui\/)creative-login-scene["'];?[ \t]*\r?\n?/m;
const moduleImport =
  /^import\s+(?:(?:type\s+)?\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+["']([^"']+)["'];?[ \t]*(?:\r?\n)?/gm;

/** Package the renderer and its assets so the exported component needs one file. */
function createPortableCreativeLogin(source: string): string {
  const imports: string[] = [];
  let componentSource = source;

  if (sceneImport.test(componentSource)) {
    const sceneSource = readFileSync(
      path.join(process.cwd(), "components/ui/creative-login-scene.tsx"),
      "utf8",
    );
    const sceneBody = sceneSource
      .replace(clientDirective, "")
      .replace(moduleImport, (statement: string, moduleName: string) => {
        // The component owns the shared React hooks; renderer imports stay intact.
        if (moduleName !== "react") imports.push(statement.trim());
        return "";
      });

    componentSource = [
      '"use client";',
      imports.join("\n"),
      componentSource.replace(clientDirective, "").replace(sceneImport, "").trim(),
      "// 3D renderer included with the component for standalone reuse.",
      sceneBody.trim(),
    ].join("\n\n");
  }

  for (const [fileName, mimeType] of Object.entries(creativeLoginAssetTypes)) {
    const publicUrl = `/creative-login/${fileName}`;
    if (!componentSource.includes(publicUrl)) continue;

    const asset = readFileSync(
      path.join(process.cwd(), "public/creative-login", fileName),
    );
    const dataUrl = `data:${mimeType};base64,${asset.toString("base64")}`;

    // Match complete quoted URLs, including URLs used by embedded @font-face CSS.
    for (const quote of ['"', "'", "`"]) {
      componentSource = componentSource.replaceAll(
        `${quote}${publicUrl}${quote}`,
        `${quote}${dataUrl}${quote}`,
      );
    }
  }

  if (componentSource.includes("/creative-login/")) {
    throw new Error("Creative Login contains an asset that was not embedded.");
  }

  const fontLicense = readFileSync(
    path.join(process.cwd(), "public/creative-login/OFL.txt"), "utf8",
  );
  return `${componentSource}\n\n/*\nCharacter and animations: Visme (visme.co).\nBundled Fira Sans font license:\n${fontLicense.replaceAll("*/", "* /")}\n*/\n`;
}

/** Only registered files can be exposed; portable exports include required assets. */
export function getComponentSource(slug: string): string {
  const component = getComponent(slug);

  if (!component) {
    throw new Error(`No source is registered for component: ${slug}`);
  }

  const source = readFileSync(
    path.join(process.cwd(), "components/ui", component.sourceFile),
    "utf8",
  );

  return slug === "creative-login" ? createPortableCreativeLogin(source) : source;
}
