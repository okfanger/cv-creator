# 轻简 · Markdown 简历编辑器

一个以内容为中心的简历编辑器，基于 React、TypeScript、Vite、CodeMirror 和 markdown-it。

```sh
npm install
npm run dev
```

打开终端显示的本地地址。`npm run build` 执行类型检查并构建，`npm test` 验证扩展格式。

支持 Markdown 实时 A4 预览、自动分页、三种主题、字体/颜色/字号/行距/边距设置、智能一页、多个本地简历、Markdown 导入导出，以及浏览器打印 PDF。导出 PDF 时选择「另存为 PDF」，建议关闭页眉页脚并启用背景图形。

内容自动保存在当前浏览器的 localStorage，不连接远程存储；请导出 Markdown 留存备份。清除浏览器数据会清除简历。

## 字体、行距与证件照

在「样式设置」中切换现代黑体、传统黑体、宋体、楷体或等宽字体。字体使用本机已安装的字体，缺失时自动回退。正文行距支持 1.00–2.50 倍的精确数值、滑块，以及紧凑/舒适/宽松预设，变更后自动重新分页。

点击侧栏「证件照」可上传或拖入 JPG、PNG、WebP 图片（最大 10 MB）。图片在浏览器中自动缩小到最长边 960 像素，并转为 JPEG 保存在当前简历。支持左右位置、竖版/方形/圆形、宽度、缩放与水平/垂直取景，也可以隐藏照片并随时恢复。

照片与简历顶部信息一同参与分页，仅在首页显示。打印 PDF 使用相同布局，包含证件照；Markdown 导出仅包含源文字，不包含照片和排版设置。

## 标题格式与图标

「样式设置 → 标题格式」可分别配置 H1–H6 的字号、行距、段前、段后与装饰留白。段前、段后和留白均支持 0；设置优先于主题的默认间距，也作用于分栏和照片旁的标题。「全部标题紧凑」保留当前字号并压缩各级标题的间距、行距与留白。更改后自动重新分页，旧简历自动补齐默认配置。

使用 `icon:xxx` 插入图标，例如：

```md
icon:phone 138 0000 0000 · icon:mail hello@example.com
icon:location 杭州 · [icon:github GitHub](https://github.com)
## icon:briefcase 工作经历
```

内置 phone、mail、map-pin、github、graduation-cap、briefcase、award、trophy、calendar、link、globe、user、code、book-open、heart、star；email、location、education、work、website、tel 是常用别名。图标随当前字体大小和颜色变化；代码、转义的 `icon\:phone`、链接地址不被替换，未知名称保留原文。

Iconfont 接入使用官方支持的 [SVG Symbol 格式](https://www.iconfont.cn/help/detail?helptype=code)：

1. 在 Iconfont「我的项目」中下载至本地，解压取得 `iconfont.js`。
2. 在「样式设置 → 简历图标」导入该文件，也可导入 SVG 图标或 Symbol 图标集。限制 2 MB、300 个图标。
3. `symbol id="icon-xxx"` 对应 `icon:xxx`（`icon:icon-xxx` 也兼容）。其它自定义前缀按图标列表中显示的完整名称使用。点击列表可插入语法。

图标数据经清理后保存于当前简历，导入的 JS 仅提取 SVG 数据，不执行脚本。支持多色路径和本地渐变；单个无 id 的 SVG 使用 `icon:custom`。同名自定义图标优先，重新导入会替换当前图标集。移除后，无法解析的自定义图标恢复原文。

预览、自动分页和浏览器打印使用同一份内联 SVG。Markdown 导出仅保留 `icon:xxx` 文字，自定义图标集与标题设置仍只保存在本地。可用 `examples/heading-icons.md` 配合 `examples/iconfont-demo.svg` 体验。

## 扩展格式

兼容木及简历公开说明中的左右与三列区块：按 `left → center（可选）→ right` 的顺序组成一行，开始下一组 `left` 时自动换行，各列可以包含普通 Markdown。`:::left` 和 `::: left` 均可使用。

```md
::: left

### 公司名称

前端开发工程师
:::
::: right
2023.07 — 至今
杭州
:::
```

在独立一行写 `::: pagebreak` 插入分页。开启「智能一页」后忽略手动分页，并缩放至单页；大量内容缩放后文字可能较小。长列表与表格会按条目自动分页；不可拆分的超长段落或分栏会缩放到单页，建议分为较短内容以保持可读性。原始 HTML 不执行；渲染结果经 DOMPurify 清理。

参考编辑器链接未能加载其实际界面，因此本项目根据公开格式说明与功能构建，并非对私有页面的像素复刻。
