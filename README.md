# 印成册 · 图片转 PDF

一个纯前端、无需注册的图片转 PDF 工具。图片只在浏览器本地处理，不会上传到服务器。

## 在线使用

GitHub Pages：<https://9991314.github.io/imagetopdf/>

## 功能

- 支持 JPG、PNG、WebP、GIF 图片
- 拖拽上传与多图批量添加
- 拖动调整 PDF 页面顺序
- 单张图片旋转与移除
- A4、A5、Letter 纸张尺寸
- 自动、纵向、横向页面方向
- 完整显示、填满裁切、拉伸填满
- 自定义页边距和导出文件名
- 所有图片均在本地浏览器处理

## 本地运行

直接双击 `index.html` 即可使用；也可以通过任意静态服务器运行：

```bash
python -m http.server 8080
```

然后访问 `http://localhost:8080`。

## 技术栈

- HTML / CSS / JavaScript
- [jsPDF](https://github.com/parallax/jsPDF)
- [Lucide Icons](https://lucide.dev/)

## 部署

仓库内置 GitHub Pages 工作流，推送到 `main` 分支后会自动部署。
