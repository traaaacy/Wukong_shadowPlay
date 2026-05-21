# Shadow Puppet - p5.js + MediaPipe

这个版本用 p5.js + MediaPipe Hands 检测手部左右摆动。每触发一次挥手，计数从 1 到 8 前进，并在 3x3 九宫格中播放对应的皮影视频；中心格为空。

## 文件

- `index.html` - 网页入口，加载 p5.js 和 MediaPipe。
- `style.css` - 页面基础样式。
- `sketch.js` - 主逻辑：摄像头、手部识别、挥手触发、九宫格播放。

## 视频路径

视频从左上到右下排列，中间留空：

```text
../all-touchdesigner-0420/video/movie1-2.mp4
../all-touchdesigner-0420/video/movie2-2.mp4
../all-touchdesigner-0420/video/movie3-2.mp4
../all-touchdesigner-0420/video/movie4-2.mp4
../all-touchdesigner-0420/video/movie5-2.mp4
../all-touchdesigner-0420/video/movie6-2.mp4
../all-touchdesigner-0420/video/movie7-2.mp4
../all-touchdesigner-0420/video/movie8-2.mp4
```

原始 `.mov` 是 HEVC/H.265，浏览器里可能不能播放。已用 ffmpeg 转出网页更稳定的 H.264 `.mp4`，代码现在加载这些 mp4。

## 运行方式

如果你电脑上有 Python，请从上一级项目目录启动服务器，这样网页可以访问旁边的 `all-touchdesigner-0420` 文件夹：

```powershell
cd "I:\Capstone_All\整理好的皮影视频-0416"
python -m http.server 8000
```

然后打开：

```text
http://localhost:8000/shadow_web/
```

第一次打开时允许浏览器摄像头权限。

如果没有 Python，也可以直接运行本文件夹里的 PowerShell 服务器：

```powershell
cd "I:\Capstone_All\整理好的皮影视频-0416\shadow_web"
.\serve.ps1
```

## 调节

- `swingThreshold`：挥手幅度阈值，越小越敏感。
- `triggerCooldown`：两次触发之间的冷却时间，单位毫秒。
- 按空格或点击页面可以手动触发下一段，方便没有摄像头时测试。
- 右下角有摄像头预览；顶部会显示 `hand: detected` 和 `dx`，用于检查 MediaPipe 是否识别到手。
# Netlify

This repo is ready for Netlify with the publish directory set to the repository root.
