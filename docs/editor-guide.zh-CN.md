# 轻简 · Markdown 简历编辑器

一个以内容为中心的简历编辑器，基于 React、TypeScript、Vite、CodeMirror 和 markdown-it。

```sh
npm install
npm run dev
```

打开终端显示的本地地址。`npm run build` 执行类型检查并构建，`npm test` 验证扩展格式。

支持紧凑编辑界面、Markdown 实时 A4 预览、自动分页、七种模板、字体/颜色/字号/行距/边距设置、智能一页、多个本地简历、Markdown 导入导出，以及浏览器打印 PDF。导出 PDF 时选择「另存为 PDF」，建议关闭页眉页脚并启用背景图形。

模板中心保留「自然简约」「经典书页」「现代蓝调」，新增「编辑雅致」「技术极客」「商务正式」。切换模板会应用对应颜色和字体，保留正文、照片、图标与自定义间距；七种模板均支持完整 Markdown 文件往返。

新增「自然简约 · AI 工程」（`ai-minimal`）作为自然简约的独立副本：深青色强调、细分隔线、项目技术栈浅底行、贡献标签与等宽代码片段。复用原有 Markdown、标题设置、自动分页和打印流程，不注入任何能力或经历文字。

第三方 Agent 可读取 [llms.txt](../llms.txt)，了解 `qingjian.version: 1` 的 YAML 配置、模板标识、分栏、分页、图标和内嵌媒体格式。该文件与解析器实现一致，并随应用构建发布：本地访问 `/llms.txt`，GitHub Pages 访问 `/cv-creator/llms.txt`。文件末尾提供可直接导入的完整示例。

未连接本地文件的简历自动保存在当前浏览器的 localStorage。可在「我的简历」连接本地文件夹，直接读取与修改本机 Markdown 文件；简历数据不会上传到 GitHub 或其他服务器。完整 Markdown 导出可用于备份，清除浏览器数据会清除浏览器简历、连接记录和恢复草稿。

## 部署到 GitHub Pages

项目不需要后端。仓库已提供 `.github/workflows/deploy.yml`，推送到 `main` 或在 Actions 中手动运行后，会安装锁定的 npm 依赖、运行测试并构建发布。

1. 将代码推送到 GitHub 仓库。
2. 在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 在 Actions 查看 **Deploy GitHub Pages** 工作流；成功后访问 `https://okfanger.github.io/cv-creator/`。

默认 Pages 构建路径为 `/cv-creator/`。如果使用不同仓库名或自定义域名，在 **Settings → Secrets and variables → Actions → Variables** 设置 `VITE_BASE_PATH`，例如 `/other-repo/` 或 `/`。本地开发及普通构建默认使用 `/`，也可显式验证子路径：

```sh
VITE_BASE_PATH=/cv-creator/ npm run build
VITE_BASE_PATH=/cv-creator/ npm run preview
```

打开预览地址的 `/cv-creator/` 路径。工作流使用 Node.js 24；GitHub Pages 提供 HTTPS，支持浏览器的文件读写授权。此版本不提供 Service Worker，断网后不保证能重新加载应用。

## 本地文件夹与双向同步

使用桌面 Chrome / Edge，在「我的简历」点击「连接文件夹」，选择专门存放简历的目录并允许读写。应用递归列出 `.md`、`.markdown` 文件，显示相对路径；只读取所选简历的内容，连接或打开文件不会改写它。

- 网页正文或样式编辑停止约 500 ms 后写回文件；⌘/Ctrl+S 立即保存。状态显示「已保存到文件」时写入才完成。
- 页面在前台时每秒检查当前文件、每 5 秒更新目录列表；重新回到页面时立即检查。后台标签页不保证固定延迟，关闭网页后不再同步。
- 外部编辑器修改正文或 YAML 后，网页没有待保存修改时会更新内容、样式及预览。双方同时修改时暂停自动保存，选择「使用磁盘版本」「使用网页版本」或「网页版本另存副本」。
- 选择版本前，会在浏览器 IndexedDB 留下网页与磁盘恢复副本，可在「我的简历 → 查看冲突恢复副本」下载。若磁盘在选择期间再次变化，需重新选择；无效 YAML 或未知格式版本需在外部修复，应用暂停原文件写入。
- 文件删除、权限撤销或写入失败时保留浏览器草稿，不自动重建原文件。可以恢复授权、重试，或下载/另存网页副本。再次打开目录时，已删除文件的草稿也会列出。
- 新建和复制简历写入选中目录根层；同名自动追加编号。修改简历标题不更改文件名。原有浏览器简历通过「将当前浏览器简历保存到文件夹」迁移，连接目录不会自动搬迁数据。
- 同一目录在同一浏览器源下只允许一个标签页写入，其他标签页只读。关闭写入标签页后，在其他标签页点击「恢复授权 / 取得写入权限」。浏览器与外部程序无法共享锁，冲突检测尽力避免覆盖，但不提供跨程序原子事务。

应用记住目录句柄，刷新或重开时检查权限；浏览器可能要求再次点击授权。需要 HTTPS 或 localhost 安全环境，且浏览器同时支持 File System Access API 与 Web Locks。不支持时仍可导入文件、下载完整 Markdown 和打印 PDF，不会宣称自动写回原文件。

## 完整 Markdown 文件

单份简历使用 YAML frontmatter 保存配置，正文紧随其后。网页内容编辑区只显示正文，样式面板修改对应配置；本地编辑器可以直接编辑完整文件。例如：

```md
---
qingjian:
  version: 1
  title: 前端开发简历
  settings:
    template: minimal
    color: '#2c584b'
    fontSize: 13
    lineHeight: 1.7
    margin: 48
    font: sans
    onePage: false
---

# 你的姓名
```

导出文件包含完整 `settings`（含 H1–H6 标题配置）、可选 `photo` 和 `iconLibrary`。照片压缩后作为 data URL 内嵌，图标保存清理后的 SVG；复制一个 `.md` 文件即可携带完整简历。照片及 SVG 数据会使文件增大，单文件限制为 **16 MiB**。普通无配置 Markdown 使用默认样式，首次编辑保存时加入配置。文件开头的 `---` 被视为 YAML 头部，必须有对应的结束 `---`。

保存会保留其他 YAML 字段、嵌套未知字段及注释，序列化可能调整缩进与引号，不保证配置排版逐字不变。无效 YAML、无效配置结构、重复键或未知 `qingjian.version` 会阻止写入；可下载原文件并在外部修复。移除照片或图标会删除对应的应用配置字段。浏览器内部的草稿、目录授权与冲突恢复数据仅用于恢复，不替代文件备份。

## 开发验证

`npm test` 使用可控时钟与文件句柄替身验证保存队列、冲突、失败恢复和格式往返。启动 `npm run dev` 后，可访问 `/tests/workspace-harness.html`：这个仅在开发服务器提供的测试页面使用浏览器 OPFS 沙盒中的真实文件句柄、IndexedDB 和 Web Locks，替换目录选择器以方便复现流程，不访问用户目录，也不进入生产构建。

在验证页面连接文件夹，打开 `resume.md` 后编辑并检查保存状态。展开「开发验证工具」，用「写入外部版本」模拟外部修改、「读取磁盘版本」检查实际保存内容；快速连续修改网页和外部版本可触发冲突。打开第二个同源验证标签页可检查只读锁。`/tests/workspace-harness.html?unsupported=1` 用于检查不支持文件访问时的兼容界面。沙盒验证不替代桌面 Chrome / Edge 对真实用户目录的原生授权与磁盘集成测试。

## 字体、行距与证件照

在「样式设置」中切换现代黑体、传统黑体、宋体、楷体或等宽字体。字体使用本机已安装的字体，缺失时自动回退。正文行距支持 1.00–2.50 倍的精确数值、滑块，以及紧凑/舒适/宽松预设，变更后自动重新分页。

点击侧栏「证件照」可上传或拖入 JPG、PNG、WebP 图片（最大 10 MB）。图片在浏览器中自动缩小到最长边 960 像素，并转为 JPEG 保存在当前简历。支持左右位置、竖版/方形/圆形、宽度、缩放与水平/垂直取景，也可以隐藏照片并随时恢复。

照片与简历顶部信息一同参与分页，仅在首页显示。打印 PDF 使用相同布局，包含证件照；完整 Markdown 导出通过 YAML 保存照片和排版设置。

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

图标数据经清理后保存于当前简历及完整 Markdown 的 YAML 配置，导入的 JS 仅提取 SVG 数据，不执行脚本。支持多色路径和本地渐变；单个无 id 的 SVG 使用 `icon:custom`。同名自定义图标优先，重新导入会替换当前图标集。移除后，无法解析的自定义图标恢复原文。

预览、自动分页和浏览器打印使用同一份内联 SVG。完整 Markdown 的正文保留 `icon:xxx` 文字，YAML 配置携带自定义图标集与标题设置。可用 `examples/heading-icons.md` 配合 `examples/iconfont-demo.svg` 体验。

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

## 公开介绍页与检索入口

构建同时发布静态 `about.html`、教程 HTML / Markdown、示例文件和 `sitemap.xml`。编辑器入口保持原地址，指南页不需要 JavaScript。

自定义域名或子路径部署时同时设置 `VITE_BASE_PATH`（例如 `/` 或 `/resume/`）和 `VITE_SITE_URL`（完整公开地址，建议以 `/` 结尾），以保持资源路径、canonical 和 sitemap 一致。GitHub Pages 项目路径中的 robots.txt 不能控制整个主机，因此子路径构建不会生成它；只有根路径构建会生成。

先执行 `npm run build`，再运行 `npm run check:site` 检查文档链接、示例解析、站点资源和 sitemap。PR CI 会运行这些检查。
