# 果冻实验室

上游：https://github.com/scottstts/Jelly-Baby
上游版本：df52c92a8459286bb287f0849764929e73b4f8ce
改编：犀牛伯爵（自由吹风、快递挑战、低重力跳高、中文界面与网站整合）。保留上游署名，不将其物理和渲染实现宣称为原创。

## 重新构建

源码保存在本目录；大体积素材从固定上游版本恢复，以免在网站仓库内重复保存。

```sh
git clone https://github.com/scottstts/Jelly-Baby.git /tmp/jelly-upstream
git -C /tmp/jelly-upstream checkout df52c92a8459286bb287f0849764929e73b4f8ce
cp -R /tmp/jelly-upstream/src/assets src/
cp -R /tmp/jelly-upstream/public .
npm ci --ignore-scripts
node --experimental-strip-types scripts/prepare-web-assets.mjs
npm run lint
npm run test:physics
npm run test:performance
npm run build -- --base=/builds/jelly-baby/
cp -R dist/. ../../builds/jelly-baby/
```

需要 WebGPU；运行在 HTTPS 或 localhost。计分纪录仅存当前浏览器，隐藏页面暂停倒计时。切换模式与重置结束当前挑战。修改后同时检查首页 data.js 中的卡片和 index.html 中的预渲染卡片。

素材优化脚本使用 macOS 自带 sips。运行时下载约 5.6 MB 素材；模型 gzip 无损，木纹 1024px，预计算 HDR 512×256。运行时并行下载并显示进度，网络 30 秒与启动 45 秒超时提供具体诊断。
