import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const requireModule = createRequire(import.meta.url);
const entries = [
  ["spider-reveal", "SpiderRevealThumbnail"],
  ["luxury-clock", "LuxuryClockThumbnail"],
  ["text-rain", "TextRainThumbnail"],
  ["orbit-login", "OrbitLoginThumbnail"],
  ["neon-ring-auth", "NeonRingAuthThumbnail"],
];

function compile(source, resolver = requireModule) {
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  });
  const compiledModule = { exports: {} };
  new Function("require", "module", "exports", compiled.outputText)(
    resolver, compiledModule, compiledModule.exports,
  );
  return compiledModule.exports;
}

const catalog = compile(fs.readFileSync("lib/component-registry.ts", "utf8"));
const { getComponentSource } = compile(
  fs.readFileSync("lib/component-source.ts", "utf8"),
  (name) => {
    if (name === "server-only") return {};
    if (name === "@/lib/component-registry") return catalog;
    return requireModule(name);
  },
);

// Compile exactly what visitors copy, using virtual files outside components/ui.
test("the five video components typecheck as portable files with React-only imports", () => {
  const sources = new Map(entries.map(([slug]) => [
    path.join(process.cwd(), ".portable-video-check", `${slug}.tsx`),
    getComponentSource(slug),
  ]));
  for (const [filename, source] of sources) {
    const parsed = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const imports = parsed.statements.filter(ts.isImportDeclaration).map((node) => node.moduleSpecifier.text);
    assert.deepEqual([...new Set(imports)], ["react"], filename);
    assert.equal(parsed.parseDiagnostics.length, 0, filename);
  }
  const options = {
    strict: true, noEmit: true, skipLibCheck: true, esModuleInterop: true,
    jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
  };
  const host = ts.createCompilerHost(options);
  const readSource = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion, ...args) => sources.has(fileName)
    ? ts.createSourceFile(fileName, sources.get(fileName), languageVersion, true, ts.ScriptKind.TSX)
    : readSource(fileName, languageVersion, ...args);
  const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([...sources.keys()], options, host));
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (file) => file,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => "\n",
  }));
});

test("video thumbnail exports stay inert and deterministic across autoplay frames", () => {
  for (const [slug, thumbnailName] of entries) {
    const Thumbnail = compile(getComponentSource(slug))[thumbnailName];
    assert.equal(typeof Thumbnail, "function", `${slug} thumbnail export`);
    for (const previewStep of [0, 1, 4, 7, NaN, Infinity, -1]) {
      const props = { previewStep };
      const markup = renderToStaticMarkup(React.createElement(Thumbnail, props));
      assert.equal(markup, renderToStaticMarkup(React.createElement(Thumbnail, props)), slug);
      assert.doesNotMatch(markup, /<(?:button|input|a|canvas|dialog)(?:\s|>)/i, slug);
      assert.doesNotMatch(markup, /\btabindex=/i, slug);
      const styles = [...markup.matchAll(/\bstyle="([^"]*)"/g)].map((match) => match[1]);
      assert.ok(styles.every((style) => !/(?:NaN|Infinity)(?:px|%|deg)/.test(style)), slug);
    }
  }
});
