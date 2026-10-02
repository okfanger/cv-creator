import { useState } from 'react';
import type { Resume } from './data';
import type { useFileWorkspace } from './useFileWorkspace';

export function downloadFile(source: string | Blob, name: string) {
  const blob =
    typeof source === 'string'
      ? new Blob([source], { type: 'text/markdown;charset=utf-8' })
      : source;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export default function FileWorkspacePanel({
  workspace,
  resume,
  onOpen,
  onToast,
}: {
  workspace: ReturnType<typeof useFileWorkspace>;
  resume: Resume;
  onOpen(): void;
  onToast(message: string): void;
}) {
  const [recovery, setRecovery] = useState<Awaited<ReturnType<typeof workspace.recoveries>> | null>(
    null
  );
  const perform = (fn: () => Promise<unknown> | undefined) => {
    void fn()?.catch((error) => onToast(error instanceof Error ? error.message : '文件操作失败'));
  };
  return (
    <section className="file-workspace" aria-label="本地简历文件夹">
      <h3>本地简历文件夹</h3>
      <p>授权后直接编辑本机文件，包含子文件夹；内容不会上传。</p>
      {!workspace.supported ? (
        <p className="workspace-warning">
          当前浏览器不支持文件夹读写。请使用桌面 Chrome / Edge，或继续使用导入与下载。
        </p>
      ) : (
        <>
          <div className="workspace-buttons">
            <button
              className="button"
              disabled={workspace.busy}
              onClick={() => perform(workspace.connect)}
            >
              {workspace.record ? '更换文件夹' : '连接文件夹'}
            </button>
            {workspace.record && (
              <>
                <button
                  className="button"
                  disabled={workspace.busy}
                  onClick={() => perform(workspace.reconnect)}
                >
                  恢复授权 / 取得写入权限
                </button>
                <button
                  className="button"
                  disabled={workspace.busy}
                  onClick={() => perform(workspace.disconnect)}
                >
                  断开
                </button>
              </>
            )}
          </div>
          {workspace.record && (
            <>
              <p>
                <strong>{workspace.record.handle.name}</strong> ·{' '}
                {workspace.permission !== 'granted'
                  ? '需要授权'
                  : workspace.writer
                    ? '可读写'
                    : '只读：其他标签页正在写入'}
                {workspace.dirtyCount > 0 && ` · ${workspace.dirtyCount} 份尚未写入文件`}
              </p>
              {!workspace.active && (
                <button
                  className="button"
                  disabled={!workspace.canWrite}
                  onClick={() =>
                    perform(async () => {
                      await workspace.add(resume);
                      onOpen();
                      onToast('已保存到文件夹');
                    })
                  }
                >
                  将当前浏览器简历保存到文件夹
                </button>
              )}
              <div className="document-list file-list">
                {workspace.entries.map((entry) => (
                  <button
                    key={entry.path}
                    disabled={workspace.permission !== 'granted' || workspace.busy}
                    onClick={() =>
                      perform(async () => {
                        await workspace.open(entry);
                        onOpen();
                      })
                    }
                  >
                    <div>
                      <strong>{entry.path}</strong>
                      <small>
                        {entry.missing ? '文件已删除 · 有可恢复草稿' : '本地 Markdown 文件'}
                      </small>
                    </div>
                    {workspace.active?.path === entry.path && <span>当前</span>}
                  </button>
                ))}
              </div>
              {workspace.permission === 'granted' && !workspace.entries.length && (
                <p>此文件夹还没有 Markdown 简历。可以保存当前简历或新建。</p>
              )}
              <button
                className="button quiet"
                onClick={() => perform(async () => setRecovery(await workspace.recoveries()))}
              >
                查看冲突恢复副本
              </button>
              {recovery && (
                <div className="recovery-list">
                  {recovery.length === 0 && <p>暂无恢复副本。</p>}
                  {recovery.map((copy, index) => (
                    <div key={index}>
                      <small>
                        {copy.path} · {new Date(copy.savedAt).toLocaleString('zh-CN')}
                      </small>
                      <button
                        className="button quiet"
                        onClick={() =>
                          downloadFile(copy.web, `网页恢复-${copy.path.split('/').at(-1)}`)
                        }
                      >
                        下载网页版本
                      </button>
                      <button
                        className="button quiet"
                        onClick={() =>
                          downloadFile(copy.disk, `磁盘恢复-${copy.path.split('/').at(-1)}`)
                        }
                      >
                        下载磁盘版本
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
      {workspace.message && (
        <p className="workspace-warning" role="alert">
          {workspace.message}
        </p>
      )}
      {workspace.warnings.map((warning) => (
        <p className="workspace-warning" key={warning}>
          {warning}
        </p>
      ))}
    </section>
  );
}
