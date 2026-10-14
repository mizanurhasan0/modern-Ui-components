# Image refinement provenance

Tool: built-in imagegen. Generated PNGs were converted to WebP using cwebp quality 94 with alpha preserved. Original extracted images remain in this folder. These refinements contain synthetic material details; they are not recovered original FHD photographs.

## Red side profile

Use case: precise-object-edit. Asset type: transparent sneaker cutout for a faithfully reproduced storefront. Image 1 is the EDIT TARGET: tiny low-resolution red sneaker in horizontal side profile, heel on left toe on right. Image 2 is supporting view of the SAME shoe. Restore target 1 into a crisp high-resolution product cutout, tightly framed to the same silhouette and approximately 2.125:1 bounding box aspect ratio. Preserve exact camera side view, toe direction, warm brick-red upper, red laces, simple seam panels, and cream/white sole thickness and silhouette. Add clear natural mesh and seam detail consistent with reference, remove compression artifacts. Do not redesign the shoe, add branding, alter the shape, change viewpoint or add shadows extending past the shoe. Genuinely transparent background. Only ONE shoe, side view. No text, no UI, no extra objects. Output enough detail for sharp display on a 1920px desktop.

## Red, sand and navy diagonal views

The following prompt was applied separately to each original `red-angle.webp`, `sand-angle.webp`, and `navy-angle.webp`, substituting its asset name:

Use case: precise-object-edit. Edit target: the attached tiny sneaker cutout. Restore ONLY its resolution/texture for an FHD storefront. Keep exactly the same shoe, shape, silhouette, diagonal angle (heel upper left, toe lower right), camera viewpoint, proportions, color pattern, laces, white sole and panel seams. Keep the bounding box aspect ratio and framing of the target. No added logo or text. Genuinely transparent background. Remove flat colored background remnants inside edges. Sharp natural material detail, not exaggerated or redesigned. ONE shoe only, tightly framed and no external shadow. Preserve original shoe silhouette extremely closely.

## Partial gray view

Use case: precise-object-edit. Edit target is the attached low resolution cropped white/light grey sneaker for a storefront panel. Reconstruct its image detail at high resolution, keeping exactly the same partial silhouette/crop, diagonal orientation heel top-left toe towards bottom-right outside crop, camera angle, shape, pale grey mesh upper, gray laces, seam shapes and bright white sole. Keep same tall narrow bounding box aspect ratio 40:65. This is intentionally a cropped partial shoe; do not complete the off-image toe or change its crop. Transparent background, no colored leftover background, no shadow outside silhouette, no branding, no text, no extra objects. Same shoe with sharp natural material texture.

## Source pixel option

Use `<SwiftSneakerStore artwork="reference" />` for the unmodified video cutouts. Default enhanced artwork is intended for larger displays.
