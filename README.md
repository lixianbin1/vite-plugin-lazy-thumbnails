<h1 align="center">vite-plugin-lazy-thumbnails</h1>

[En](./README_en.md) 

一个 Vite 插件，用于生成图片缩略图并在页面加载时实现渐进式图片加载效果，用于优化体验，简单，方便

主要功能:

 - 缩略图生成：为所有图片（jpg/png/jpeg/webp）生成低质量、小尺寸的缩略图
 - 渐进式加载：先加载缩略图，在原图请求好之后替换原图。防止刷新白屏及图片加载缓慢
 - 模糊过渡：加模糊过渡效果，让用户体验更加良好

## 插件介绍

[更新日志](./log/README.md)

## 简单使用

安装 vite-plugin-lazy-thumbnails

```
npm install vite-plugin-lazy-thumbnails
```

在Vite.config中使用，打包编译的时候，插件会自动执行并将图片进行缩略化显示
```js
// vite.config.js
import lazyThumbnail from 'vite-plugin-lazy-thumbnails';

export default defineConfig({
  plugins: [
    lazyThumbnail(),
  ],
  // ...
})
```

## 相关配置

```js
// vite.config.js
import lazyThumbnail from 'vite-plugin-lazy-thumbnails';

export default defineConfig({
  plugins: [
    lazyThumbnail({
      quality: 10,          // 缩略图质量
      skipSmallImages: true,// 跳过小图
      minSizeToResize: 30,  // 小于多少KB不处理
      blurAmount: 3,        // 模糊像素
      transitionDuration: '0.3s'
    }),
  ],
  // ...
})
```