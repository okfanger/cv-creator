# 标题格式和图标验证（2026-10-03）

验证页面使用 http://localhost:5173 的独立浏览器存储，未编辑 127.0.0.1 来源的用户简历。

- H1–H6 独立配置字号、行距、段前/后、装饰留白。H2 设为段前 0、段后 0、装饰留白 0、行距 1.1，浏览器计算样式为 margin-top/bottom 0px、padding 0px、line-height 17.6px（字号 16px）。
- 切换现代蓝调后，H2 上下间距和上下 padding 仍为 0px；保留主题的左右 padding 10px。
- H1 字号单独改为 28px，H2 设置保持；刷新后标题配置及图标集保留。
- 16 组 H2 + 段落的验证简历，默认标题布局 2 页；全部标题紧凑后最终 DOM 为 1 页，包含全部 16 个标题。
- 内置 SVG 在标题、正文、链接标签、分栏中渲染，继承字体大小/颜色。
- 上传测试 Iconfont JS 后，medal、contact 多色图标正常显示。脚本/foreignObject/事件属性/远程 fill 均被清理，图标预览 DOM 中对应计数为 0。
- SVG 渐变测试：全局 defs 被复制到内联图标、渐变 id 和 URL 引用同时加前缀；根 fill/stroke 被保留。点击图标能在源码光标处插入 icon:gradient。
- 官方生成的真实 Symbol JS（64 个图标）导入成功，自定义 kb-icon-* 前缀出现在图标列表。另一官方文件包含 313 个图标，按 300 个上限显示错误并保留之前的图标集。
- 23 项 Node 回归检查通过；生产构建通过。构建仍有既有的 bundle size 和 lucide use-client 提示。

官方参考：https://www.iconfont.cn/help/detail?helptype=code
真实文件兼容验证参考：https://at.alicdn.com/t/project/2209725/f2cd21dc-979a-4b07-ac67-d700aea7c70b.html

截图：heading-icons.jpg（各级标题配置与预览），iconfont-preview.jpg（图标列表与多色奖牌）。

打印复用预览中的内联 SVG 和标题 CSS 变量。此次未实际完成系统打印对话框中的 PDF 保存；不声称验证了最终 PDF 文件。Markdown 导出仍只包含源码，不包含自定义图标数据或排版设置。
