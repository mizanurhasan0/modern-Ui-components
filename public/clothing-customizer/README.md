# Clothing color customizer

The bundled demo uses **real garment photographs**: a front T-shirt by [Haryo Setyadi](https://unsplash.com/photos/acn5ERAeSb4) and a front hoodie by [Mediamodifier](https://unsplash.com/photos/kJXGTOY1wLQ) under the [Unsplash License](https://unsplash.com/license), plus rear views by [Monstera Production](https://www.pexels.com/photo/black-man-in-white-t-shirt-6311141/) and [MART PRODUCTION](https://www.pexels.com/photo/person-in-white-hoodie-jacket-8217415/) under the [Pexels License](https://www.pexels.com/license/). The rear views show different blank white garments photographed from behind; they demonstrate the view switch, not the literal reverse side of the front samples. For an actual product, supply photographs of the same item on both sides. The photographs were cropped, cut out with manually traced silhouettes, and padded onto transparent 640 × 660 canvases. Fabric pixels come from the photographs; no AI image generation or fabric synthesis is used. See `ATTRIBUTION.json` for sources and preparation details.

The matching PNG masks protect the front T-shirt neck label and the front hoodie drawstrings, cord tips, and metal eyelets. SVG tracing guides are included as `*-outline.svg` and `*-protection.svg`; their coordinate spaces are described in `ATTRIBUTION.json`. The shipped PNG masks are aligned to the final WebP images. The cutout contours were tightened inside the photo edge and softly feathered to remove background bleed around the sleeves, hood, and hems. All preparation happened once; live recoloring stays entirely in the browser.

## Add your product

Put a PNG or WebP photo and its manually prepared mask in `public/products/`. Other browser-decodable images are accepted. Both assets must have exactly the same dimensions and alignment. Transparent cutouts and opaque backgrounds are supported.

Paint the mask **white** wherever dye should be applied and **black or transparent** wherever original pixels should remain. Grays give partial coverage for soft edges. Exclude labels, buttons, zippers, logos, skin, props, background shadows, and printed artwork. White-on-transparent and white-on-black masks both work; colored masks use luminance multiplied by alpha.

```tsx
import ClothingColorCustomizer from "@/components/ui/clothing-color-customizer";

<ClothingColorCustomizer
  productTitle="Cotton Panjabi"
  productImage="/products/panjabi-front.webp"
  garmentMask="/products/panjabi-front-mask.png"
  backImage="/products/panjabi-back.webp"
  backGarmentMask="/products/panjabi-back-mask.png"
  initialColor="#D4D2CC"
  availableColors={[
    { name: "Forest", hex: "#425E4C" },
    { name: "Bordeaux", hex: "#793E49" },
  ]}
  onColorChange={(hex, { productId, isOriginal }) => {
    console.log({ hex, productId, isOriginal });
  }}
/>
```

`initialColor` describes the source garment and labels the original selection. The initial preview always displays the untouched image. Reset restores that image exactly. Selected HEX is a target dye color; shading makes individual pixels lighter or darker.

When `backImage` is supplied, the photograph becomes a button: click it or press Enter/Space to switch smoothly between front and back. Both sides stay mounted so the current photo remains visible until the selected color is ready on the next side, then the photos crossfade. The selected color and preview zoom follow the view. Zoom controls scale the garment from 1× to 2× in 25% steps; changing products resets the view and zoom. Motion is reduced for visitors who request less animation. Provide a separate `backGarmentMask` aligned to the back photo; each photo/mask pair must have matching dimensions. Products without a back photo remain front-only.

Pass `products` to enable a style selector. Each `ClothingProduct` has `id`, `title`, `productImage`, optional `description`, `garmentMask`, `backImage`, `backGarmentMask`, `initialColor`, `availableColors`, and `recolorAllOpaquePixels`. Changing products resets the preview and calls `onColorChange` with `isOriginal: true`. Supply callbacks from a client component.

Without a mask, controls are disabled. For a plain garment-only cutout, explicitly set `recolorAllOpaquePixels` to `true` to recolor all visible pixels. This also recolors logos, hardware, and any shadows in the asset. Transparency alone never identifies protected details; a prepared mask is the reliable option.

## Processing and limitations

The exported `useGarmentRecolor`, `prepareGarmentPixels`, and `recolorGarmentPixels` can also be used independently. Luminance is calculated in linear light, normalized against bright diffuse garment regions, and reused for every selection. A lookup table keeps changes fast, and animation frames coalesce pending renders. Source alpha and pixels outside the mask are preserved. Decoded sources use a four-entry/four-million-pixel cache limit. Loading and animation frames are cleaned up on unmount. Preparation uses OffscreenCanvas where available, with Canvas 2D as the fallback.

Preview processing scales large assets to a maximum side of 1400 pixels to limit memory and main-thread work. The original image retains its supplied resolution. Use fresh/versioned URLs after changing cached assets. Consumers of the standalone hook should hide the original image while its painted canvas is shown to avoid doubling translucent pixels.

Use same-origin assets, data URLs, or remote servers that allow anonymous CORS. Blocked assets, invalid URLs, mismatched masks, and empty masks produce readable errors. Color changes make no network requests; images and masks load when needed.

A single image cannot reveal actual material reflectance or reconstruct missing texture in clipped whites or crushed blacks. Use a neutral, evenly lit mid-to-light garment photo for best results. Colored lighting, metallic fabrics, sheer materials, and saturated source garments produce approximate results. HEX colors cannot guarantee physical dye or screen color accuracy. Multicolor garments need separate masks and an editing workflow to recolor regions independently; protected prints retain their original pixels.

The gallery thumbnail is inert visual artwork. The detail-page demo performs the full pixel transformation. Copy/download embeds all four front and back photographs and their masks into the standalone component source, with photo attribution and license links.
