# Changelog

[中文] (./README.md)

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

## v0.3.0

- Added logic to prioritize caching if images are cached (to prevent flickering caused by page refreshing replacement paths)
- Fixed an issue where `\t` in the path caused the path to be incorrect

# v0.3.1

  Update the configuration introduction in the README document

# v0.3.2

  Update the query keywords for npm packages

# v0.4.0

 - Fixed the incorrect logic that caused background images in CSS to be ignored.
 - Removed the width/height options for thumbnails (when a background image is not set to cover, these dimensions could break CSS background sizing).
 - Removed the custom output-format option (current replacement logic does not support custom formats).
 - Adjusted the default values of some parameters.

# v0.4.1

 - Due to the original size of the thumbnail still being too large, the algorithm was adjusted to proportionally reduce it
 - Turn off the replacement scheme for the default background image. If you release it, please note that the background image needs to be styled as full.

# v0.4.2

  - Add algorithms for thumbnail and rendering size to prevent height deviation of 1px and size fluctuations caused by thumbnail replacement of the original image
  - Modify the style of the background image to fill the background container.