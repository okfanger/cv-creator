# 文件同步与 Pages 验证记录

日期：2026-10-03

## 自动验证

- `npm test`：55 项通过，0 项失败。
- `VITE_BASE_PATH=/cv-creator/ npm run build`：TypeScript 检查和生产构建通过；产物仅包含网站入口和资源，不包含开发测试页。
- `git diff --check`：通过。
- 独立临时目录中执行 `npm ci`、测试和子路径构建通过，确认 package-lock 可用于 GitHub Actions。该检查时为 54 项测试；随后新增的重复轮询合并测试在最终 55 项测试中通过。
- 构建仍提示现有主包超过 500 kB，以及 lucide-react 的 `use client` 指令警告；均未阻止构建。

## 浏览器验证

使用 Codex 浏览器工具操作实际应用。开发测试页 `tests/workspace-harness.html` 将目录选择器指向浏览器 OPFS 沙盒，使用实际原生文件句柄、IndexedDB 和 Web Locks；不访问用户个人文件。

- 连接沙盒目录并递归显示 `.md` 与子目录 `.markdown` 相对路径。
- 打开普通 Markdown 不立即改写；编辑正文和标题后自动保存。测试页读取实际文件确认 frontmatter 与正文写回。
- 测试页模拟外部写入后，正文、标题和样式同步更新。
- 双方修改产生冲突，自动保存暂停；选择网页版本后保存成功，恢复列表提供双方版本。
- 第二标签页恢复相同目录后只读，名称和编辑器禁用；原标签页断开后重新取得写入权限。
- 将未保存草稿放入 IndexedDB 后刷新、重新打开文件，恢复草稿并保存。
- 未知格式版本阻止打开和写入，并提供原文件下载入口。
- 子目录简历编辑和复制成功；副本写入根目录，文件列表更新。
- 禁用目录 API 后仍可使用浏览器简历、导入和完整 Markdown 下载入口。
- 最终生产地址 `http://127.0.0.1:5200/cv-creator/` 可加载。导入含照片、SVG 图标和字体配置的完整文件后，照片与图标显示、正文不含 frontmatter、字体尺寸恢复为 15 px。刷新后保持恢复状态，未捕获到浏览器错误日志。

## 证据

- [目录列表](file-workspace-qa.jpg)
- [冲突提示](file-conflict-qa.jpg)
- [不支持目录 API 的回退](file-fallback-qa.jpg)
- [子路径生产预览、照片和图标](file-complete-preview-qa.jpg)

## 待手动验收

- 系统目录选择器在当前自动化浏览器中无法完成授权。因此尚未验证桌面 Chrome/Edge 对真实系统目录的权限提示、系统磁盘写回，以及外部编辑器实际修改后的同步；OPFS 验证不能替代这些检查。
- 下载入口可触发，但自动化浏览器未返回 Blob 下载事件，因此未取得最终下载文件证据。完整 Markdown 序列化内容由单元测试验证。
- PDF 使用现有系统打印流程；本轮未取得系统打印生成的 PDF 文件。建议在桌面浏览器中检查多页打印、照片和图标。
- GitHub Actions 配置已添加，未推送或实际发布。仓库 Settings → Pages 的 Source 应设为 GitHub Actions，再推送 main 或手动运行工作流。
