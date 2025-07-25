<h1 align="center">vite-plugin-lazy-thumbnails</h1>

<p align="center">
  <a href="https://npmcharts.com/compare/vite-plugin-lazy-thumbnails?minimal=true"><img src="https://img.shields.io/npm/dm/vite-plugin-lazy-thumbnails.svg?sanitize=true" alt="Downloads"></a>
  <a href="https://www.npmjs.com/package/vite-plugin-lazy-thumbnails"><img src="https://img.shields.io/npm/v/vite-plugin-lazy-thumbnails.svg?sanitize=true" alt="Version"></a>
  <a href="https://www.npmjs.com/package/vite-plugin-lazy-thumbnails"><img src="https://img.shields.io/npm/l/vite-plugin-lazy-thumbnails.svg?sanitize=true" alt="License"></a>
</p>

[中文] (./README.md)

A Vite plugin for generating image thumbnails and implementing progressive image loading effects on page load, for optimizing the experience, simple and convenient

Key features:

 - Thumbnail generation: Generate low-quality, small-sized thumbnails for all images (jpg/png/jpeg/webp).
 - Progressive loading: Loads thumbnails first, and replaces them when the original image is requested. Prevent white screen refresh and slow image loading
 - Blur Transition: Add a blur transition effect to make the user experience better

## Plugin Introduction

[Changelog] (./log/README_en.md)

## Simple to use

Install vite-plugin-lazy-thumbnails

```
npm install vite-plugin-lazy-thumbnails
```

In Vite.config, when packaging and compiling, the plugin will automatically execute and abbreviate the image
```js
// vite.config.js
import lazyThumbnail from 'vite-plugin-lazy-thumbnails';

export default defineConfig({
  plugins: [
    lazyThumbnail({

    }),
  ],
  // ...
})
```

## Related configurations

```js
// vite.config.js
import lazyThumbnail from 'vite-plugin-lazy-thumbnails';

export default defineConfig({
  plugins: [
    lazyThumbnail({
      quality: 30,           //Thumbnail quality
      width: 128,            //Thumbnail width
      skipSmallImages: true, //Skip the small image
      skipBackground: true,  //Skip the image with a white background
      minSizeToResize: 30,   //How many KB are not processed
      blurAmount: 3,         //Blurred pixels
      transitionDuration: '0.3s'
    }),
  ],
  // . ..
})
```