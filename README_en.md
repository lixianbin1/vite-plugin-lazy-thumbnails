<h1 align="center">vite-plugin-lazy-thumbnails</h1>

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
      quality: 30, //Thumbnail quality
      width: 50, //Thumbnail width
      height: null, //Highly adaptive
      skipSmallImages: true, //Skip the small image
      minSizeToResize: 30, //How many KB are not processed
      format: 'auto', //Output format
      blurAmount: 2, //Blurred pixels
      transitionDuration: '0.3s'
    }),
  ],
  // . ..
})
```