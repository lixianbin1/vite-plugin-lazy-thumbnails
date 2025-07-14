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

        // 先尝试从浏览器缓存直接加载原图
        const cacheTest = new Image();
        cacheTest.onload = function () {
          // 缓存命中：直接替换，无闪屏
          img.src = originalSrc;
          img.dataset.loaded = 'true';
        };
        cacheTest.onerror = function () {
          // 缓存未命中：走缩略图→原图过渡
          // 创建原图加载
          const tempImg = new Image();
          tempImg.onload = function() {
            // 加载成功：先模糊，再替换成原图，再取消模糊
            img.style.filter = 'blur(0px)';
            img.src = originalSrc;
            img.dataset.loaded = 'true';
          };
          tempImg.onerror = function () {
            console.error('Failed to load image:', originalSrc);
            img.style.filter = 'none';
          };
          tempImg.src = originalSrc;

          // 添加过渡效果
          img.style.transition = 'filter 0.2s ease';
          img.style.filter = 'blur(2px)';
        };
        cacheTest.src = originalSrc; // 触发缓存检测
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
        const originalBg = thumbPath.replace(new RegExp(THUMBNAIL_PREFIX), '');

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
    width: 50,            // 缩略图宽度
    height: null,         // 高度自适应
    skipSmallImages: true,// 跳过小图
    minSizeToResize: 30,  // 小于多少KB不处理
    format: 'auto',       // 输出格式
    blurAmount: 2,        // 模糊像素
    transitionDuration: '0.3s'
  };
  const finalOptions = { ...defaultOptions, ...options };

  return {
    name: 'vite-plugin-image-thumbnail',

    // ── ① 生成阶段：为每张图片产出一份缩略图资源
    async generateBundle(_, bundle) {
      const processPromises = [];
      for (const [filename, asset] of Object.entries(bundle)) {
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
            let processor = sharp(buffer)
              .resize({
                width: finalOptions.width,
                height: finalOptions.height,
                fit: 'inside',
                withoutEnlargement: true
              });

            // 根据原图格式或指定格式导出
            switch (finalOptions.format) {
              case 'png':
                processor = processor.png({ quality: finalOptions.quality });
                break;
              case 'webp':
                processor = processor.webp({ quality: finalOptions.quality });
                break;
              case 'jpeg':
                processor = processor.jpeg({ quality: finalOptions.quality });
                break;
              default:
                if (filename.toLowerCase().endsWith('.png')) {
                  processor = processor.png({ quality: finalOptions.quality });
                } else if (filename.toLowerCase().endsWith('.webp')) {
                  processor = processor.webp({ quality: finalOptions.quality });
                } else {
                  processor = processor.jpeg({ quality: finalOptions.quality });
                }
            }

            // 把缩略图塞进最终产物
            this.emitFile({
              type: 'asset',
              fileName: thumbPath,
              source: await processor.toBuffer()
            });
          } catch (error) {
            console.error(`Failed to generate thumbnail for ${filename}:`, error);
          }
        })());
      }
      await Promise.all(processPromises);
    },

    // ── ② 对 JS 中出现的静态图片路径，替换为缩略图路径
    renderChunk(code) {
      return code.replace(
        /(const\s+\w+\s*=\s*["'])(.*?\.(jpg|png|jpeg|webp|avif|gif))(["'])/gi,
        (_, prefix, imgPath, ext, suffix) => {
          const thumbPath = getThumbnailPath(imgPath);
          return `${prefix}${thumbPath}${suffix}`;
        }
      );
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