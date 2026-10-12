# Portfolio trail reference assets

These assets were extracted from the user-supplied video
`AQMWQbbN9LjQH83QW0mfQNNeMTi3tBnV9w6Sf6L9o3VhHT6m_Cdzifiv-KPLyIgY3W07mXyVHsOTYivj2Cs1QPxQv4rayfOxahEH2Jt3dA.mp4`
(720 × 1280 pixels, approximately 8.78 seconds). No generated artwork was used.

- `portrait.webp`: frame at 0.08 seconds, crop `(x: 218, y: 468, width: 324, height: 345)`. Edge-connected cream pixels were made transparent, preserving the character, laptop, and internal highlights. The lossless RGBA WebP contains 37,606 fully transparent pixels. Transparent RGB channels are zeroed. The video’s small navbar crossing the top of the hair is preserved; the live navbar overlays the same position: `(x: 290, y: 483, width: 140, height: 22)` in the original frame, or `(x: 72, y: 15)` within the portrait.
- `tech-texture.webp`: frame at 2.00 seconds, crop `(x: 446, y: 535, width: 95, height: 88)`, entirely inside the blue code and diagram artwork. The patch is repeated at its original scale into a 720 × 345 lossless RGB WebP. It contains no interface controls, portfolio copy, or video captions. Repetition preserves the recorded texture detail instead of stretching a small patch across the stage.

Extraction used FFmpeg. Background segmentation used an edge-connected flood fill limited to neutral light pixels (minimum RGB channel 205, maximum channel difference 24). WebP encoding used Pillow’s lossless mode. All visible character and texture pixels originate in the supplied recording. These files are reference-derived portfolio assets; the recording’s original artwork ownership is unchanged.
