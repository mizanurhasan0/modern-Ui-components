import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createRequire } from "node:module";
import { inflateSync } from "node:zlib";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = fs.readFileSync(new URL("../components/ui/clothing-color-customizer.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } });
const component = { exports: {} };
new Function("require", "module", "exports", compiled.outputText)((name) => name === "./component-styles" ? { ComponentStyles: () => null } : require(name), component, component.exports);
const { normalizeGarmentHex, prepareGarmentPixels, recolorGarmentPixels } = component.exports;
const image = (values) => ({ width: values.length / 4, height: 1, data: new Uint8ClampedArray(values) });

test("HEX input accepts shorthand and rejects invalid colors", () => {
  assert.equal(normalizeGarmentHex(" #3aF "), "#33AAFF");
  assert.equal(normalizeGarmentHex("3956a3"), "#3956A3");
  for (const value of ["#12", "#gggggg", "#12345678", "red", ""]) assert.equal(normalizeGarmentHex(value), null);
});

test("colors preserve protected background, alpha, fabric shading, and exact reset", () => {
  const original = image([50, 80, 110, 255, 210, 210, 210, 255, 90, 90, 90, 180, 255, 255, 255, 0]);
  const mask = image([0, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]);
  const prepared = prepareGarmentPixels(original, mask);
  const output = new Uint8ClampedArray(original.data.length);
  for (const hex of ["#FF0000", "#00FF00", "#0000FF", "#000000", "#FFFFFF", "#3956A3"]) {
    recolorGarmentPixels(prepared, hex, output);
    assert.deepEqual(output.slice(0, 4), original.data.slice(0, 4), "black mask preserves background exactly");
    assert.deepEqual(output.slice(12), original.data.slice(12), "transparent source pixels are untouched");
    assert.equal(output[11], 180, "source alpha survives recoloring");
    const brightness = (offset) => output[offset] + output[offset + 1] + output[offset + 2];
    assert.ok(brightness(4) > brightness(8), `${hex} retains the darker fabric fold`);
  }
  recolorGarmentPixels(prepared, "#F00", output);
  assert.ok(output[4] > output[5] * 4 && output[4] > output[6] * 4);
  recolorGarmentPixels(prepared, null, output);
  assert.deepEqual(output, original.data, "reset returns original bytes");
  assert.deepEqual(prepared.pixels, original.data, "processing never mutates cached source pixels");
});

test("mask transparency and feathering protect logos and soften transitions", () => {
  const original = image([200, 200, 200, 255, 200, 200, 200, 255, 200, 200, 200, 255]);
  const mask = image([255, 255, 255, 0, 128, 128, 128, 255, 255, 255, 255, 255]);
  const prepared = prepareGarmentPixels(original, mask);
  const output = new Uint8ClampedArray(original.data.length);
  recolorGarmentPixels(prepared, "#0000FF", output);
  assert.deepEqual(output.slice(0, 4), original.data.slice(0, 4));
  assert.ok(output[4] < 200 && output[4] > output[8], "gray mask blends source and dye");
});

test("unmasked or empty sources require explicit region coverage", () => {
  const original = image([180, 180, 180, 255]);
  assert.throws(() => prepareGarmentPixels(original, null), /no visible recolorable area/);
  assert.doesNotThrow(() => prepareGarmentPixels(original, null, true));
  assert.throws(() => prepareGarmentPixels(original, image([0, 0, 0, 255])), /no visible recolorable area/);
  assert.throws(() => prepareGarmentPixels(original, image([255, 255, 255, 255, 0, 0, 0, 255])), /dimensions/);
});

// Decode the shipped 8-bit RGB PNG masks with Node built-ins. This keeps the
// photographic asset regression checks independent of native image packages.
function readMaskPng(bytes) {
  assert.equal(bytes.subarray(1, 4).toString(), "PNG");
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  assert.equal(bytes[24], 8);
  assert.equal(bytes[25], 2);
  assert.equal(bytes[28], 0);
  const chunks = [];
  for (let offset = 8; offset < bytes.length;) {
    const length = bytes.readUInt32BE(offset);
    if (bytes.toString("ascii", offset + 4, offset + 8) === "IDAT") chunks.push(bytes.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const encoded = inflateSync(Buffer.concat(chunks));
  const rowWidth = width * 3;
  const pixels = Buffer.alloc(rowWidth * height);
  const paeth = (a, b, c) => {
    const p = a + b - c;
    const distances = [Math.abs(p - a), Math.abs(p - b), Math.abs(p - c)];
    return distances[0] <= distances[1] && distances[0] <= distances[2] ? a : distances[1] <= distances[2] ? b : c;
  };
  for (let y = 0; y < height; y++) {
    const type = encoded[y * (rowWidth + 1)];
    assert.ok(type <= 4);
    for (let x = 0; x < rowWidth; x++) {
      const i = y * rowWidth + x;
      const left = x >= 3 ? pixels[i - 3] : 0;
      const above = y > 0 ? pixels[i - rowWidth] : 0;
      const upperLeft = x >= 3 && y > 0 ? pixels[i - rowWidth - 3] : 0;
      const predictor = [0, left, above, Math.floor((left + above) / 2), paeth(left, above, upperLeft)][type];
      pixels[i] = (encoded[y * (rowWidth + 1) + x + 1] + predictor) & 255;
    }
  }
  return { width, height, pixels };
}

test("photographic demo masks align with the photos and protect labels and hardware", () => {
  const folder = new URL("../public/clothing-customizer/", import.meta.url);
  const { assets } = JSON.parse(fs.readFileSync(new URL("ATTRIBUTION.json", folder), "utf8"));
  for (const asset of assets) {
    const photo = fs.readFileSync(new URL(`${asset.product}.webp`, folder));
    assert.equal(photo.toString("ascii", 12, 16), "VP8L", "retain lossless photographic assets");
    const dimensions = photo.readUInt32LE(21);
    const photoWidth = 1 + (dimensions & 0x3fff);
    const photoHeight = 1 + ((dimensions >>> 14) & 0x3fff);
    const mask = readMaskPng(fs.readFileSync(new URL(`${asset.product}-mask.png`, folder)));
    assert.deepEqual([mask.width, mask.height], [photoWidth, photoHeight]);
    assert.deepEqual([mask.width, mask.height], [640, 660]);
    for (const [x, y] of asset.protectedPixels) assert.equal(mask.pixels[(y * mask.width + x) * 3], 0, `${asset.product}: protected detail at ${x},${y}`);
    for (const [x, y] of asset.garmentPixels) assert.equal(mask.pixels[(y * mask.width + x) * 3], 255, `${asset.product}: editable fabric at ${x},${y}`);
    for (const [x, y] of [[0, 0], [320, 10], [10, 330], [630, 330], [320, 650]]) assert.equal(mask.pixels[(y * mask.width + x) * 3], 0, `${asset.product}: preserve background`);
  }
});
