import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const resolveModule = createRequire(import.meta.url);
const testDirectory = path.dirname(fileURLToPath(import.meta.url));

function loadTypeScript(file, resolve = resolveModule) {
  const source = fs.readFileSync(path.join(testDirectory, "..", file), "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const compiledModule = { exports: {} };
  new Function("require", "module", "exports", result.outputText)(
    resolve,
    compiledModule,
    compiledModule.exports,
  );
  return compiledModule.exports;
}

const catalog = loadTypeScript("lib/component-registry.ts");
const { getComponentSource } = loadTypeScript(
  "lib/component-source.ts",
  (name) => {
    if (name === "server-only") return {};
    if (name === "@/lib/component-registry") return catalog;
    return resolveModule(name);
  },
);
const { ComponentStyles } = loadTypeScript(
  "components/ui/component-styles.tsx",
);

test("all catalog exports include their styles without a project-local helper import", () => {
  for (const { slug } of catalog.components) {
    const source = getComponentSource(slug);
    assert.match(source, /^"use client";/, slug);
    assert.doesNotMatch(
      source,
      /from ["'](?:\.\/|@\/components\/ui\/)component-styles["']/,
      slug,
    );
    if (source.includes("<ComponentStyles"))
      assert.match(source, /function ComponentStyles\(/, slug);
    const parsed = ts.createSourceFile(
      `${slug}.tsx`,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    assert.equal(
      parsed.parseDiagnostics.length,
      0,
      `${slug} must remain valid TSX`,
    );
  }
});

function assertIndependentTypecheck(slugs) {
  const sources = new Map(
    slugs.map((slug) => [
      path.join(process.cwd(), ".portable-source-check", `${slug}.tsx`),
      getComponentSource(slug),
    ]),
  );
  const options = {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    esModuleInterop: true,
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
  };
  const host = ts.createCompilerHost(options);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion, ...args) =>
    sources.has(fileName)
      ? ts.createSourceFile(
          fileName,
          sources.get(fileName),
          languageVersion,
          true,
          ts.ScriptKind.TSX,
        )
      : originalGetSourceFile(fileName, languageVersion, ...args);
  const diagnostics = ts.getPreEmitDiagnostics(
    ts.createProgram([...sources.keys()], options, host),
  );
  assert.equal(
    diagnostics.length,
    0,
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (file) => file,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => "\n",
    }),
  );
}

test("Basketball and Red Bull exports typecheck as independent component files", () => {
  assertIndependentTypecheck(["basketball-upload", "redbull-card"]);
});

test("clothing customizer source is standalone and includes both sides of each demo garment", () => {
  assertIndependentTypecheck(["clothing-color-customizer"]);
  const source = getComponentSource("clothing-color-customizer");
  for (const file of ["tee.webp", "tee-mask.png", "tee-back.webp", "tee-back-mask.png", "hoodie.webp", "hoodie-mask.png", "hoodie-back.webp", "hoodie-back-mask.png"]) {
    const bytes = fs.readFileSync(path.join(process.cwd(), "public/clothing-customizer", file));
    const mime = file.endsWith(".webp") ? "image/webp" : "image/png";
    assert.ok(source.includes(`data:${mime};base64,${bytes.toString("base64")}`), file);
  }
  assert.ok(!source.includes("/clothing-customizer/"));
});

test("video cursor components typecheck as independent component files", () => {
  assertIndependentTypecheck(["portfolio-image-trail", "liquid-cursor"]);
});

test("identical component styles are deduplicated during server rendering", () => {
  const css = ".resource-test{color:blue}";
  const markup = renderToStaticMarkup(
    React.createElement(
      React.Fragment,
      null,
      React.createElement(ComponentStyles, { css }),
      React.createElement(ComponentStyles, { css }),
    ),
  );
  assert.equal((markup.match(/<style/g) || []).length, 1);
  assert.match(markup, /data-precedence="components"/);
  assert.ok(markup.includes(css));
});

test("edited CSS gets a different resource identity for Fast Refresh", () => {
  const first = renderToStaticMarkup(
    React.createElement(ComponentStyles, { css: ".test{color:red}" }),
  );
  const second = renderToStaticMarkup(
    React.createElement(ComponentStyles, { css: ".test{color:tan}" }),
  );
  assert.notEqual(
    first.match(/data-href="([^"]+)"/)[1],
    second.match(/data-href="([^"]+)"/)[1],
  );
});

test("Red Bull copied source includes the exact product photo bytes", () => {
  const source = getComponentSource("redbull-card");
  const photo = fs.readFileSync(
    path.join(process.cwd(), "public/redbull/energy-drink-can.webp"),
  );
  assert.ok(
    source.includes(`data:image/webp;base64,${photo.toString("base64")}`),
  );
  assert.ok(!source.includes('src="/redbull/energy-drink-can.webp"'));
});


test("portfolio copied source embeds the exact portrait and texture bytes", () => {
  const source = getComponentSource("portfolio-image-trail");
  for (const fileName of ["portrait.webp", "tech-texture.webp"]) {
    const bytes = fs.readFileSync(path.join(process.cwd(), "public/portfolio-trail", fileName));
    assert.ok(source.includes(`data:image/webp;base64,${bytes.toString("base64")}`), `${fileName} must be included without changing its bytes`);
  }
  assert.ok(!source.includes("/portfolio-trail/"), "copied source must not depend on a public folder");
});

function readPreviewMappings() {
  const source = ts.createSourceFile("component-previews.ts", fs.readFileSync(path.join(process.cwd(), "lib/component-previews.ts"), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const mappings = new Map();
  const imports = new Map();
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement) && statement.importClause && ts.isStringLiteral(statement.moduleSpecifier)) {
      const moduleName = statement.moduleSpecifier.text;
      if (statement.importClause.name) imports.set(statement.importClause.name.text, moduleName);
      const bindings = statement.importClause.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) {
        for (const element of bindings.elements) imports.set(element.name.text, moduleName);
      }
    }
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !["componentPreviews", "componentThumbnails"].includes(declaration.name.text)) continue;
      assert.ok(declaration.initializer && ts.isObjectLiteralExpression(declaration.initializer));
      const entries = new Map();
      for (const property of declaration.initializer.properties) {
        assert.ok(ts.isPropertyAssignment(property) && (ts.isStringLiteral(property.name) || ts.isIdentifier(property.name)), "preview mappings must have explicit, readable keys");
        const slug = property.name.text;
        assert.ok(!entries.has(slug), `duplicate ${declaration.name.text} key: ${slug}`);
        assert.ok(ts.isIdentifier(property.initializer), `${slug} must map to an imported component`);
        entries.set(slug, property.initializer.text);
      }
      mappings.set(declaration.name.text, entries);
    }
  }
  return { mappings, imports };
}

test("catalog entries have unique identities and matching preview/thumbnail mappings", () => {
  for (const field of ["slug", "number", "sourceFile"]) {
    const values = catalog.components.map((entry) => entry[field]);
    assert.equal(new Set(values).size, values.length, `catalog ${field} values must be unique`);
  }
  const { mappings, imports } = readPreviewMappings();
  for (const mappingName of ["componentPreviews", "componentThumbnails"]) {
    const mapping = mappings.get(mappingName);
    assert.ok(mapping, `${mappingName} must exist`);
    assert.equal(mapping.size, catalog.components.length, `${mappingName} must contain exactly the registered catalog`);
    for (const entry of catalog.components) {
      const componentName = mapping.get(entry.slug);
      assert.ok(componentName, `${entry.slug} needs a ${mappingName} mapping`);
      assert.equal(imports.get(componentName), `@/components/ui/${entry.sourceFile.replace(/\.tsx$/, "")}`, `${entry.slug} must use its own component file`);
    }
  }
});

test("video cursor thumbnails are inert, effect-free artwork across gallery frames", () => {
  for (const [slug, exportName] of [["portfolio-image-trail", "PortfolioImageTrailThumbnail"], ["liquid-cursor", "LiquidCursorThumbnail"]]) {
    const source = getComponentSource(slug);
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } });
    const componentModule = { exports: {} };
    const guardedReact = { ...React, useEffect: () => assert.fail(`${slug} thumbnail must not mount effects`), useLayoutEffect: () => assert.fail(`${slug} thumbnail must not mount layout effects`) };
    new Function("require", "module", "exports", compiled.outputText)((name) => name === "react" ? guardedReact : resolveModule(name), componentModule, componentModule.exports);
    const Thumbnail = componentModule.exports[exportName];
    assert.equal(typeof Thumbnail, "function", `${slug} must export its gallery thumbnail`);
    const frames = new Set();
    for (let previewStep = 0; previewStep < 4; previewStep += 1) {
      const markup = renderToStaticMarkup(React.createElement(Thumbnail, { previewStep }));
      assert.match(markup, /inert=""/);
      assert.match(markup, /aria-hidden="true"/);
      assert.doesNotMatch(markup, /<(?:button|a|input|select|textarea|canvas)(?:\s|>)/, `${slug} thumbnail must not mount interactive controls or a cursor canvas`);
      frames.add(markup);
    }
    assert.ok(frames.size > 1, `${slug} must respond visually to the shared gallery frame`);
  }
});
