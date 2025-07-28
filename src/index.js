/*!
 * vite-plugin-lazy-thumbnails JavaScript Library v0.5.0
 * https://www.npmjs.com/package/vite-plugin-lazy-thumbnails
 *
 * Date: 2025-07-28T09:18Z
 */
// 引入 Node.js 内置模块
const path = require('path');                   // 路径处理
const fs = require('fs/promises');              // 异步文件系统
const sharp = require('sharp');                 // 高性能图片处理库

// 缩略图文件名前缀，可改
const THUMBNAIL_PREFIX = 'thumb_';

// ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
// 浏览器端运行时脚本（字符串形式，后续注入到 HTML）
// ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
const RUNTIME_SCRIPT = `
  document.addEventListener('DOMContentLoaded', function() {
    // 处理 <img> 标签

    function loadOriginalImages() {
      const images = document.querySelectorAll('img');

      images.forEach(img => {
        const src = img.src;
        // 检查是否是缩略图路径
        if (!src.includes('${THUMBNAIL_PREFIX}')) return;

        // 已经加载过的不再处理
        if (img.dataset.loaded === 'true') return;

        // 计算原图路径（去掉 thumb_ 前缀）
        const originalSrc = src.replace(new RegExp('${THUMBNAIL_PREFIX}', 'g'), '');

        // 先记录缩略图的尺寸（在替换 src 前）
        const thumbImg = new Image();
        thumbImg.onload = () => {
          const boxW = thumbImg.naturalWidth;
          const boxH = thumbImg.naturalHeight;

          // 保持缩略图占位尺寸
          img.style.width = img.clientWidth + 'px';
          img.style.height = img.clientHeight + 'px';

          // 缓存检测
          const cacheTest = new Image();
          cacheTest.onload = () => {
            // 缓存命中：直接替换
            img.src = originalSrc;
            img.dataset.loaded = 'true';
          };
          cacheTest.onerror = () => {
            // 缓存未命中：走缩略图→原图过渡
            const tempImg = new Image();
            tempImg.onload = () => {
              // 加载成功：先模糊，再替换成原图，再取消模糊
              img.style.filter = 'blur(0px)';
              img.src = originalSrc;
              img.dataset.loaded = 'true';
            };
            tempImg.onerror = () => {
              console.error('Failed to load image:', originalSrc);
              img.style.filter = 'none';
            };
            tempImg.src = originalSrc;

            // 添加过渡效果
            img.style.transition = 'filter 0.2s ease';
            img.style.filter = 'blur(2px)';
          };
          cacheTest.src = originalSrc; // 触发缓存检测
        };
        thumbImg.src = src; // 加载缩略图以获取尺寸
      });
    }

    // 处理 CSS background-image
    function loadOriginalBackgrounds() {
      const elements = document.querySelectorAll('*');
      elements.forEach(el => {
        if (el.dataset.bgLoaded === 'true') return;

        const bgImage = window.getComputedStyle(el).backgroundImage;
        if (!bgImage.includes('${THUMBNAIL_PREFIX}')) return;

        // 用正则把 url(...) 中的路径提出来
        const urlMatch = bgImage.match(/url\\(["']?(.*?)["']?\\)/i);
        if (!urlMatch) return;

        const thumbPath = urlMatch[1];
        const originalBg = thumbPath.replace(new RegExp('${THUMBNAIL_PREFIX}'), '');

        const tempImg = new Image();
        tempImg.onload = function() {
          // 替换背景图
          el.style.backgroundImage = bgImage.replace(thumbPath, originalBg);
          el.dataset.bgLoaded = 'true';
        };
        tempImg.onerror = function() {
          console.error('Failed to load background image:', originalBg);
        };
        tempImg.src = originalBg;
      });
    }

    // 页面初次加载
    loadOriginalImages();
    loadOriginalBackgrounds();

    // 监听后续动态插入的 DOM
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length) {
          loadOriginalImages();
          loadOriginalBackgrounds();
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
`;

// ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
// Vite 插件主体
// ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
function thumbnailLoading(options = {}) {
  // 默认配置
  const defaultOptions = {
    quality: 30,          // 缩略图质量
    width: 128,           // 缩略图宽度
    skipSmallImages: true,// 跳过小图
    skipBackground: true, // 跳过背景图
    minSizeToResize: 30,  // 小于多少KB不处理
    blurAmount: 3,        // 模糊像素
    transitionDuration: '0.3s'
  };
  const finalOptions = { ...defaultOptions, ...options };

  return {
    name: 'vite-plugin-image-thumbnail',

    // ── ① 生成阶段：为每张图片产出一份缩略图资源
    async generateBundle(_, bundle) {
      // 处理图片
      const processPromises = [];
      for (const [filename, asset] of Object.entries(bundle)) {
        console.log('filename', filename);
        // 仅处理图片资源
        if (!/\.(jpg|png|jpeg|webp|avif|gif)$/i.test(filename)) continue;

        processPromises.push((async () => {
          try {
            // 读取文件内容
            const buffer = asset.type === 'asset'
              ? asset.source
              : await fs.readFile(asset.fileName);

            // 跳过小图
            const fileSizeKB = buffer.length / 1024;
            if (finalOptions.skipSmallImages && fileSizeKB <= finalOptions.minSizeToResize) return;

            // 计算缩略图文件名
            const thumbName = THUMBNAIL_PREFIX + path.basename(filename);
            const thumbPath = path.join(path.dirname(filename), thumbName);

            // 创建缩略图
            const ext = path.extname(filename).slice(1).toLowerCase();
            const bufferOut = await sharp(buffer)
              .resize(finalOptions.width)
              .toFormat(ext, { quality: finalOptions.quality })
              .toBuffer();

            // 把缩略图塞进最终产物
            this.emitFile({
              type: 'asset',
              fileName: thumbPath,
              source: bufferOut
            });
          } catch (error) {
            console.error(`Failed to generate thumbnail for ${filename}:`, error);
          }
        })());
      }
      // 处理CSS
      if(!finalOptions.skipBackground){
        for (const [fileName, chunk] of Object.entries(bundle)) {
          if (fileName.endsWith('.css') && chunk.type === 'asset') {
            let css = chunk.source.toString();
            css = css.replace(
              /url\(["']?(.*?\.(?:jpg|png|jpeg|webp|avif|gif))["']?\)/gi,
              (match, imgPath) => {
                const thumbPath = getThumbnailPath(imgPath);
                return `url("${thumbPath}") center / cover no-repeat`;
              }
            );
            chunk.source = Buffer.from(css);
          }
        }
      }
      await Promise.all(processPromises);
    },

    // ── ② 对 JS 产物中出现的静态图片路径，替换为缩略图路径（AST）
    renderChunk(code) {
      const babel = require('@babel/parser');
      const traverse = require('@babel/traverse').default;
      const MagicString = require('magic-string').default || require('magic-string');
      let ast;
      try {
        ast = babel.parse(code, { sourceType: 'module' });
      } catch {
        return null; // 不是 JS，跳过
      }
      const s = new MagicString(code);
      let hasReplaced = false;
      traverse(ast, {
        StringLiteral(path) {
          const { value } = path.node;
          if (/\.(jpg|png|jpeg|webp|avif|gif)$/i.test(value)) {
            const thumb = getThumbnailPath(value);
            // 替换为缩略图路径
            s.overwrite(path.node.start, path.node.end, JSON.stringify(thumb));
            hasReplaced = true;
          }
        },
      });
      if (!hasReplaced) return null;
      return {
        code: s.toString(),
        map: s.generateMap({ hires: true }),
      };
    },

    // ── ③ 把运行时脚本注入到最终 HTML <body> 末尾
    transformIndexHtml(html) {
      const script = RUNTIME_SCRIPT
        .replace(/'blur\(2px\)'/, `'blur(${finalOptions.blurAmount}px)'`)
        .replace(/0\.3s/g, finalOptions.transitionDuration);

      return {
        html,
        tags: [
          {
            tag: 'script',
            injectTo: 'body',
            children: script
          }
        ]
      };
    }
  };

  // ── 工具：根据原图路径返回缩略图路径
  function getThumbnailPath(imgPath) {
    const baseName = path.basename(imgPath);
    const dir = path.dirname(imgPath);
    return path.posix.join(dir, THUMBNAIL_PREFIX + baseName).replace(/\\/g, '/');
  }
}

module.exports = thumbnailLoading;