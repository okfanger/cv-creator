# Browser support, local storage, and file sync / 常见问题

[Editor / 编辑器](../index.html) · [AI workflow](ai-workflow.md)

## Does Qingjian upload my resume? / 简历会上传吗？

The editor stores resume content in your browser or authorized local files and does not upload it to its own server. Loading the hosted app still makes ordinary requests to its host. An external AI assistant has separate data handling rules.

编辑器把正文保存在浏览器或授权的本地文件中，不上传到自有服务端。加载托管页面仍会向托管平台请求资源；外部 AI 助手的数据处理规则另行适用。

## Which browsers support local folders? / 哪些浏览器支持目录同步？

Use desktop Chrome / Edge on HTTPS or localhost with File System Access API and Web Locks. When unsupported, use Markdown import/download and browser printing. Mobile folder synchronization is not advertised as supported.

本地目录同步需要桌面 Chrome / Edge 和相应 API；不支持时使用导入、下载和打印。当前不宣称支持移动端目录同步。

## Why did my external edit not appear immediately? / 外部修改为什么没有马上显示？

Foreground checks run about once a second for the current file and every five seconds for the directory listing. Background tabs may be throttled; closed pages do not sync. A pending browser edit or conflict can also postpone updates.

前台约每秒检查当前文件、每五秒检查目录；后台可能限频，关闭后不再同步。待保存网页编辑或冲突也会阻止直接更新。

## How are simultaneous changes handled? / 同时修改怎么办？

Saving pauses and offers disk/web versions or a separate copy. Recovery copies are retained in browser IndexedDB. Browser and external programs do not share an atomic filesystem transaction; keep backups and avoid simultaneous writing.

保存暂停后选择磁盘、网页版本或另存副本。IndexedDB 保留恢复副本；跨程序写入不具备原子事务保障。完整操作见[恢复手册](editor-guide.zh-CN.md)。

## What if I clear browser data or delete a file? / 清除数据或删除文件怎么办？

Browser-only resumes and recovery records can be lost when site data is cleared. A disk write failure preserves a browser draft and does not recreate the original file automatically. Download Markdown backups and check the save status.

清除站点数据会清除浏览器草稿与恢复记录；磁盘写入失败时保留草稿，不自动重建原文件。请保留下载备份并查看保存状态。

## Is it offline-capable? / 可以完全离线吗？

There is no Service Worker in this version. An already loaded page can process content locally, but reloading without a network connection is not guaranteed.

当前没有 Service Worker；已经加载的页面可以本地处理内容，断网重新加载不保证可用。

## Is AI built in? Is the UI multilingual? / 内置 AI 或多语言界面吗？

No AI model is embedded. External assistants edit your Markdown files. The current UI is Simplified Chinese; English content and documentation are supported, not a translated English UI.

当前不内置 AI，界面为简体中文；英文简历与英文文档不等于已经实现英文界面。
