# Changelog

[En] (./README_en.md)

A Vite plugin that generates image thumbnails and implements progressive image loading effects on page load

Key features:

- Thumbnail generation: Generate low-quality, small-sized thumbnails for all images (jpg/png/jpeg/webp).
- Progressive loading: Modify the image reference in the code to point to the thumbnail, inject the runtime script, and replace it with the original image after the page loads
- Blur Transition: Add a blur transition effect

...

## v0.1.0

Complete the above basic functions (thumbnail generation, progressive loading, blur transitions).

## v0.2.0

- Modified the blur transition effect
- Modify the regular expression for background image processing
- Added format preservation option (output format based on original format)