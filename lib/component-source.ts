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
      componentSource
        .replace(clientDirective, "")
        .replace(sceneImport, "")
        .trim(),
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
    path.join(process.cwd(), "public/creative-login/OFL.txt"),
    "utf8",
  );
  return `${componentSource}\n\n/*\nCharacter and animations: Visme (visme.co).\nBundled Fira Sans font license:\n${fontLicense.replaceAll("*/", "* /")}\n*/\n`;
}

const componentStylesImport =
  /^import\s*\{\s*ComponentStyles\s*\}\s*from\s*["'](?:\.\/|@\/components\/ui\/)component-styles["'];?[ \t]*\r?\n?/m;

/** Inline the shared stylesheet resource helper so exported components stay independent. */
function includePortableStyles(source: string): string {
  if (!componentStylesImport.test(source)) return source;
  const helper = readFileSync(
    path.join(process.cwd(), "components/ui/component-styles.tsx"),
    "utf8",
  );
  return `${source.replace(componentStylesImport, "").trim()}\n\n${helper.trim()}\n`;
}

/** Include the actual product photo so copied cards do not need a public folder. */
function includeRedBullPhoto(source: string): string {
  const photoPath = "/redbull/energy-drink-can.webp";
  const photo = readFileSync(path.join(process.cwd(), "public", photoPath));
  const dataUrl = `data:image/webp;base64,${photo.toString("base64")}`;
  return `${source.replaceAll(`"${photoPath}"`, JSON.stringify(dataUrl))}\n\n// Product photo: Red Bull official Energy Drink product page.\n// https://www.redbull.com/int-en/energydrink/products/red-bull-energy-drink\n`;
}

/** Embed both reference images so the cursor trail can be copied into another project. */
function includePortfolioImages(source: string): string {
  let portableSource = source;
  for (const fileName of ["portrait.webp", "tech-texture.webp"]) {
    const publicUrl = `/portfolio-trail/${fileName}`;
    const image = readFileSync(
      path.join(process.cwd(), "public/portfolio-trail", fileName),
    );
    const dataUrl = `data:image/webp;base64,${image.toString("base64")}`;
    for (const quote of ['"', "'", "`"]) {
      portableSource = portableSource.replaceAll(
        `${quote}${publicUrl}${quote}`,
        `${quote}${dataUrl}${quote}`,
      );
    }
    if (!portableSource.includes(dataUrl)) {
      throw new Error(`Portfolio Image Trail does not reference ${fileName}.`);
    }
  }
  if (portableSource.includes("/portfolio-trail/")) {
    throw new Error("Portfolio Image Trail contains an asset that was not embedded.");
  }
  return `${portableSource}\n\n// Portrait and technology texture extracted from the user-supplied portfolio interaction video.\n// Source frames: 0.08 seconds (portrait), 2.00 seconds (technology texture).\n`;
}

const referenceAssetFolders: Record<string, string> = {
  "clothing-color-customizer": "/clothing-customizer/",
  "chrome-profile-carousel": "/chrome-profiles/",
  "swift-sneaker-store": "/swift-sneaker-store/",
  "globe-travel-explorer": "/reference-travel/",
  "classic-microcars": "/classic-microcars/",
  "sapiens-character-builder": "/sapiens-characters/",
};

/** Embed local reference artwork on export without putting it in every preview bundle. */
function includeReferenceAssets(slug: string, source: string): string {
  const folder = referenceAssetFolders[slug];
  if (!folder) return source;
  const mimeTypes: Record<string, string> = {
    ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg", ".gif": "image/gif", ".svg": "image/svg+xml",
    ".woff2": "font/woff2", ".woff": "font/woff",
  };
  // Keep the backtick as a regex escape: a literal backtick in this template
  // breaks the minified server bundle during production page-data collection.
  const assetPattern = new RegExp(`(["'\\x60])(${folder}[a-zA-Z0-9_./-]+)\\1`, "g");
  const embedded = new Map<string, string>();
  const result = source.replace(assetPattern, (_match, _quote: string, publicUrl: string) => {
    let dataUrl = embedded.get(publicUrl);
    if (!dataUrl) {
      const mime = mimeTypes[path.extname(publicUrl).toLowerCase()];
      if (!mime) throw new Error(`Unsupported reference asset: ${publicUrl}`);
      const asset = readFileSync(path.join(process.cwd(), "public", publicUrl));
      dataUrl = `data:${mime};base64,${asset.toString("base64")}`;
      embedded.set(publicUrl, dataUrl);
    }
    return JSON.stringify(dataUrl);
  });
  if (result.includes(folder)) {
    throw new Error(`${slug} contains a reference asset that was not embedded.`);
  }
  const attribution = slug === "clothing-color-customizer"
    ? "Front photos: Haryo Setyadi (T-shirt), https://unsplash.com/photos/acn5ERAeSb4; Mediamodifier (hoodie), https://unsplash.com/photos/kJXGTOY1wLQ, under https://unsplash.com/license. Back photos: Monstera Production (T-shirt), https://www.pexels.com/photo/black-man-in-white-t-shirt-6311141/; MART PRODUCTION (hoodie), https://www.pexels.com/photo/person-in-white-hoodie-jacket-8217415/, under https://www.pexels.com/license/. Rear demo photographs show similar garments, not the exact front items. Cropped and manually masked; no AI image generation."
    : slug === "swift-sneaker-store"
    ? "Native artwork extracted from the user-supplied recording; HD shoe variants refined with imagegen. Use artwork=\"reference\" for original pixels."
    : slug === "globe-travel-explorer"
      ? "Reference artwork extracted from the user-supplied recording; terrain obscured by recorded UI restored with imagegen."
      : slug === "sapiens-character-builder"
        ? "Male artwork extracted from the reference recording; female pose artwork generated with imagegen to complement the illustration style."
      : "Reference artwork extracted from the user-supplied interaction recording.";
  return `${result}\n\n// ${attribution}\n`;
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

  const portableSource = includeReferenceAssets(slug, includePortableStyles(source));
  if (slug === "redbull-card") return includeRedBullPhoto(portableSource);
  if (slug === "portfolio-image-trail") return includePortfolioImages(portableSource);
  return slug === "creative-login"
    ? createPortableCreativeLogin(portableSource)
    : portableSource;
}
