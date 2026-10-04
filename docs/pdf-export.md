# Export a Markdown resume to A4 PDF / 导出 A4 PDF

[Open editor / 打开编辑器](../index.html)

1. Review your content, chosen template, and page count in Qingjian. / 先复核内容、模板和页数。
2. Choose **导出简历 → PDF** to open browser printing. / 打开浏览器打印。
3. Select **Save as PDF / 另存为 PDF** and A4 paper (210 × 297 mm).
4. Turn off browser headers and footers; turn on background graphics. / 关闭页眉页脚，启用背景图形。
5. Check the print preview, save, and reopen the PDF. / 检查打印预览，保存后重新打开复核。

## Pagination / 分页

The editor automatically splits long lists between items and tables between rows. Table headings repeat. A column row or another indivisible oversized block can shrink to fit; shorten or restructure that block if its text becomes too small.

长列表按条目、表格按行分页，表头重复；超长的不可拆分段落或分栏可能缩小，应调整段落结构以保持可读性。

Write `::: pagebreak` on a separate line to request a manual page break. “智能一页” ignores manual breaks and scales the entire resume onto one page; use it only after checking readability. Two readable pages can be preferable to one tiny page.

独立一行写 `::: pagebreak` 可手动分页。“智能一页”会忽略手动分页并整份缩小，请检查文字是否仍清晰。

## Fonts and text / 字体与文本

Fonts use the local machine's available fonts and fallbacks. Check the final PDF on the export machine, including links, page breaks, and copied text. PDF export does not by itself demonstrate ATS compatibility, and this project makes no ATS certification claim.

字体依赖导出设备的本机字体。检查 PDF 链接、分页和复制文本；能导出 PDF 不代表已经通过 ATS 验收。
