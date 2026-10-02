import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView, keymap } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { undo, redo } from '@codemirror/commands';
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  Bold,
  BookOpen,
  Check,
  CheckCheck,
  ChevronDown,
  Code2,
  Copy,
  FileText,
  HelpCircle,
  Italic,
  LayoutTemplate,
  Link,
  List,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  PanelLeft,
  Plus,
  Redo2,
  Settings2,
  Sparkles,
  Table2,
  Undo2,
  UserRound,
  X,
} from 'lucide-react';
import Preview from './Preview';
import PhotoControls from './PhotoControls';
import TypographyControls from './TypographyControls';
import HeadingControls from './HeadingControls';
import IconControls from './IconControls';
import { normalizeHeadings } from './headings';
import { normalizePhoto } from './photo';
import { createResume, defaults, templates, type Resume, type Settings } from './data';

const STORE = 'qingjian-resumes-v1';
const ACTIVE = 'qingjian-active-v1';
function load(): Resume[] {
  try {
    const data = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (Array.isArray(data)) {
      const valid = data.filter(
        (x) =>
          x &&
          typeof x.id === 'string' &&
          typeof x.title === 'string' &&
          typeof x.content === 'string' &&
          x.settings
      );
      if (valid.length)
        return valid.map((x) => ({
          ...x,
          settings: {
            ...defaults,
            ...x.settings,
            headings: normalizeHeadings(x.settings.headings),
          },
          iconLibrary:
            x.iconLibrary &&
            typeof x.iconLibrary.source === 'string' &&
            x.iconLibrary.source.length <= 2_000_000
              ? { name: String(x.iconLibrary.name || '图标集'), source: x.iconLibrary.source }
              : undefined,
          photo: normalizePhoto(x.photo),
        }));
    }
  } catch {
    /* Storage may be unavailable or contain an older format. */
  }
  return [createResume()];
}
const editorTheme = EditorView.theme({
  '&': { height: '100%', fontSize: '13px', backgroundColor: '#fff' },
  '.cm-scroller': {
    fontFamily: '"SFMono-Regular", Consolas, "PingFang SC", monospace',
    lineHeight: '1.95',
    overflow: 'auto',
  },
  '.cm-content': { padding: '22px 0 100px', caretColor: '#2c584b' },
  '.cm-line': { padding: '0 24px 0 12px' },
  '.cm-gutters': { background: '#fff', border: 'none', color: '#c4c7c4', minWidth: '42px' },
  '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: '#f5f7f3' },
  '.cm-selectionBackground': { background: '#dce8dd !important' },
  '&.cm-focused': { outline: 'none' },
});
const markdownColors = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.heading, color: '#365d4a', fontWeight: '600', textDecoration: 'none' },
    { tag: tags.processingInstruction, color: '#a5b29e' },
    { tag: tags.strong, color: '#586e46', fontWeight: '600' },
    { tag: tags.emphasis, color: '#7b8567', fontStyle: 'italic' },
    { tag: tags.link, color: '#708b66', textDecoration: 'none' },
    { tag: tags.url, color: '#98a78d' },
    { tag: tags.monospace, color: '#79816e' },
  ])
);

function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      aria-labelledby={titleId}
      className={`modal ${wide ? 'wide' : ''}`}
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-heading">
        <div>
          <h2 id={titleId}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button className="icon-button" onClick={onClose} aria-label="关闭弹窗">
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export default function App() {
  const [resumes, setResumes] = useState<Resume[]>(load);
  const [activeId, setActiveId] = useState(() => {
    try {
      const id = localStorage.getItem(ACTIVE);
      return resumes.some((x) => x.id === id) ? id! : resumes[0].id;
    } catch {
      return resumes[0].id;
    }
  });
  const resume = resumes.find((x) => x.id === activeId) || resumes[0];
  const [panel, setPanel] = useState<'content' | 'style'>('content');
  const [modal, setModal] = useState<'templates' | 'help' | 'documents' | 'export' | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [toast, setToast] = useState('');
  const [pageCount, setPageCount] = useState(1);
  const [zoomOption, setZoomOption] = useState('auto');
  const [autoZoom, setAutoZoom] = useState(0.7);
  const [focusPreview, setFocusPreview] = useState(false);
  const [mobileView, setMobileView] = useState('edit');
  const [sync, setSync] = useState(true);
  const editor = useRef<EditorView | null>(null);
  const previewArea = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const settings = resume.settings;
  const zoom = zoomOption === 'auto' ? autoZoom : Number(zoomOption);
  const update = useCallback(
    (patch: Partial<Resume>) => {
      setSaved(false);
      setResumes((items) =>
        items.map((x) => (x.id === activeId ? { ...x, ...patch, updatedAt: Date.now() } : x))
      );
    },
    [activeId]
  );
  const updateSettings = (patch: Partial<Settings>) =>
    update({ settings: { ...settings, ...patch } });
  const notify = (message: string) => setToast(message);
  const save = useCallback(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(resumes));
      localStorage.setItem(ACTIVE, activeId);
      setSaved(true);
      setSaveError(false);
    } catch {
      setSaveError(true);
      setSaved(false);
    }
  }, [resumes, activeId]);
  useEffect(() => {
    const timer = setTimeout(save, 400);
    return () => clearTimeout(timer);
  }, [save]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        save();
      }
    };
    const onLeave = () => {
      try {
        localStorage.setItem(STORE, JSON.stringify(resumes));
        localStorage.setItem(ACTIVE, activeId);
      } catch {
        /* The UI already exposes storage failure. */
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pagehide', onLeave);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pagehide', onLeave);
    };
  }, [save, resumes, activeId]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2800);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!previewArea.current) return;
    const observer = new ResizeObserver((entries) =>
      setAutoZoom(Math.max(0.25, Math.min(0.9, entries[0].contentRect.width / 794)))
    );
    observer.observe(previewArea.current);
    return () => observer.disconnect();
  }, []);
  const format = useCallback((before: string, after = '', placeholder = '文字') => {
    const view = editor.current;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const selected = view.state.sliceDoc(from, to) || placeholder;
    view.dispatch({
      changes: { from, to, insert: before + selected + after },
      selection: { anchor: from + before.length, head: from + before.length + selected.length },
    });
    view.focus();
  }, []);
  const insertBlock = (text: string) => {
    const view = editor.current;
    if (!view) return;
    const at = view.state.selection.main.to;
    view.dispatch({
      changes: { from: at, insert: `\n\n${text}\n` },
      selection: { anchor: at + text.length + 3 },
    });
    view.focus();
  };
  const scrollExtension = EditorView.domEventHandlers({
    scroll: (_event, view) => {
      if (sync && previewArea.current) {
        const range = view.scrollDOM.scrollHeight - view.scrollDOM.clientHeight;
        const target = previewArea.current;
        if (range > 0)
          target.scrollTop =
            (view.scrollDOM.scrollTop / range) * (target.scrollHeight - target.clientHeight);
      }
      return false;
    },
  });
  const exportMd = () => {
    const url = URL.createObjectURL(
      new Blob([resume.content], { type: 'text/markdown;charset=utf-8' })
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resume.title.replace(/[\\/:*?"<>|]/g, '-') || '简历'}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    setModal(null);
    notify('Markdown 已导出');
  };
  const importMd = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      notify('请选择小于 2 MB 的 Markdown 文件');
      return;
    }
    try {
      const content = await file.text();
      const item = { ...createResume(file.name.replace(/\.(md|markdown|txt)$/i, '')), content };
      setResumes((items) => [...items, item]);
      setActiveId(item.id);
      setPanel('content');
      setSaved(false);
      notify('已导入为一份新简历');
    } catch {
      notify('文件读取失败，请重试');
    }
  };
  const newDocument = (duplicate = false) => {
    const item = duplicate
      ? {
          ...resume,
          id: crypto.randomUUID(),
          title: `${resume.title} · 副本`,
          updatedAt: Date.now(),
        }
      : {
          ...createResume('我的新简历'),
          content:
            '# 你的姓名\n求职意向 · 所在城市\n\n邮箱 · 电话\n\n## 关于我\n介绍你的经验与优势。\n\n## 工作经历\n### 公司名称 · 职位\n- 用具体成果描述你的工作。\n\n## 教育背景\n学校名称 · 专业 · 学历\n',
        };
    setResumes((items) => [...items, item]);
    setActiveId(item.id);
    setModal(null);
    setPanel('content');
    setSaved(false);
    notify(duplicate ? '已创建简历副本' : '新简历已创建');
  };
  const currentTemplate = templates.find((x) => x.id === settings.template)!;
  const wordCount = resume.content.replace(/[#*`|:\[\]()>-]/g, '').replace(/\s/g, '').length;

  return (
    <div className={`app ${focusPreview ? 'preview-focus' : ''} mobile-${mobileView}`}>
      <header className="header">
        <button
          className="brand"
          onClick={() => setModal('documents')}
          aria-label="轻简 · 我的简历"
        >
          <span className="brand-mark">
            <i />
            <i />
            <i />
          </span>
          <strong>轻简</strong>
          <span className="brand-divider" />
          <span className="brand-en">RESUME</span>
        </button>
        <div className="document-info">
          <button
            className="icon-button back-button"
            title="我的简历"
            onClick={() => setModal('documents')}
          >
            <ArrowLeft size={17} />
          </button>
          <input
            aria-label="简历名称"
            value={resume.title}
            onChange={(e) => update({ title: e.target.value })}
          />
          <span className={`save-status ${saveError ? 'error' : ''}`}>
            <span />
            {saveError ? '保存失败，请导出备份' : saved ? '已保存到本地' : '保存中…'}
          </span>
        </div>
        <div className="header-actions">
          <button className="button quiet" onClick={() => setModal('templates')}>
            <LayoutTemplate size={16} />
            <span>模板中心</span>
          </button>
          <button className="button primary" onClick={() => setModal('export')}>
            <ArrowDownToLine size={16} />
            <span>导出简历</span>
            <ChevronDown size={14} />
          </button>
        </div>
      </header>
      <div className="workspace">
        <nav className="rail" aria-label="编辑器导航">
          <div className="rail-top">
            <button
              className={`rail-item ${panel === 'content' ? 'active' : ''}`}
              onClick={() => {
                setPanel('content');
                setFocusPreview(false);
                setMobileView('edit');
              }}
            >
              <FileText size={21} />
              <span>内容</span>
            </button>
            <button
              className={`rail-item ${panel === 'style' ? 'active' : ''}`}
              onClick={() => {
                setPanel('style');
                setFocusPreview(false);
                setMobileView('edit');
              }}
            >
              <Settings2 size={21} />
              <span>样式</span>
            </button>
            <button
              className="rail-item"
              onClick={() => {
                setPanel('style');
                setFocusPreview(false);
                setMobileView('edit');
                setTimeout(
                  () =>
                    document
                      .getElementById('photo-settings')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
                  0
                );
              }}
            >
              <UserRound size={21} />
              <span>证件照</span>
            </button>
            <button className="rail-item" onClick={() => setModal('templates')}>
              <LayoutTemplate size={21} />
              <span>模板</span>
            </button>
            <div className="rail-line" />
            <button className="rail-item" onClick={() => fileInput.current?.click()}>
              <ArrowUpFromLine size={20} />
              <span>导入</span>
            </button>
          </div>
          <div className="rail-bottom">
            <button className="rail-item" onClick={() => setModal('help')}>
              <HelpCircle size={20} />
              <span>指南</span>
            </button>
            <button className="avatar" onClick={() => setModal('documents')} aria-label="我的简历">
              L
            </button>
          </div>
        </nav>
        <section className="editor-pane" aria-label="编辑面板">
          <div className="pane-header">
            <div className="tabs">
              <button
                className={panel === 'content' ? 'selected' : ''}
                onClick={() => setPanel('content')}
              >
                内容编辑
              </button>
              <button
                className={panel === 'style' ? 'selected' : ''}
                onClick={() => setPanel('style')}
              >
                样式设置
              </button>
            </div>
            <span className="md-pill">
              <Code2 size={13} /> Markdown
            </span>
          </div>
          {panel === 'content' ? (
            <>
              <div className="format-bar" aria-label="格式工具栏">
                <button
                  onClick={() => format('## ', '', '模块标题')}
                  title="二级标题"
                  aria-label="插入标题"
                >
                  <span className="heading-icon">
                    H<span>2</span>
                  </span>
                </button>
                <button onClick={() => format('**', '**')} title="加粗 ⌘/Ctrl+B" aria-label="加粗">
                  <Bold size={16} />
                </button>
                <button onClick={() => format('*', '*')} title="斜体 ⌘/Ctrl+I" aria-label="斜体">
                  <Italic size={16} />
                </button>
                <span className="tool-divider" />
                <button
                  onClick={() => format('- ', '', '列表内容')}
                  title="无序列表"
                  aria-label="插入列表"
                >
                  <List size={17} />
                </button>
                <button
                  onClick={() => format('[', '](https://example.com)', '链接文字')}
                  title="插入链接"
                  aria-label="插入链接"
                >
                  <Link size={16} />
                </button>
                <button
                  onClick={() =>
                    insertBlock(
                      '::: left\n### 公司 / 项目名称\n职位 / 技术栈\n:::\n::: right\n2024.01 — 至今\n所在城市\n:::'
                    )
                  }
                  title="左右分栏"
                  aria-label="插入左右分栏"
                >
                  <PanelLeft size={16} />
                </button>
                <button
                  onClick={() =>
                    insertBlock('| 学校名称 | 专业 · 学历 | 2020 — 2024 |\n| :--- | :---: | ---: |')
                  }
                  title="三列表格"
                  aria-label="插入表格"
                >
                  <Table2 size={16} />
                </button>
                <span className="toolbar-spacer" />
                <button
                  onClick={() => {
                    if (editor.current) {
                      undo(editor.current);
                      editor.current.focus();
                    }
                  }}
                  title="撤销"
                  aria-label="撤销"
                >
                  <Undo2 size={16} />
                </button>
                <button
                  onClick={() => {
                    if (editor.current) {
                      redo(editor.current);
                      editor.current.focus();
                    }
                  }}
                  title="重做"
                  aria-label="重做"
                >
                  <Redo2 size={16} />
                </button>
                <button onClick={() => setModal('help')} title="语法指南" aria-label="语法指南">
                  <MoreHorizontal size={18} />
                </button>
              </div>
              <div className="editor-body">
                <CodeMirror
                  key={resume.id}
                  value={resume.content}
                  height="100%"
                  aria-label="Markdown 简历源码"
                  theme={editorTheme}
                  extensions={[
                    markdown(),
                    markdownColors,
                    EditorView.contentAttributes.of({ 'aria-label': 'Markdown 简历源码' }),
                    EditorView.lineWrapping,
                    scrollExtension,
                    keymap.of([
                      {
                        key: 'Mod-b',
                        run: () => {
                          format('**', '**');
                          return true;
                        },
                      },
                      {
                        key: 'Mod-i',
                        run: () => {
                          format('*', '*');
                          return true;
                        },
                      },
                    ]),
                  ]}
                  basicSetup={{
                    foldGutter: false,
                    highlightActiveLine: true,
                    autocompletion: false,
                  }}
                  onCreateEditor={(view) => {
                    editor.current = view;
                  }}
                  onChange={(content) => update({ content })}
                />
              </div>
              <div className="writing-tip">
                <span className="tip-icon">
                  <Sparkles size={16} />
                </span>
                <div>
                  <strong>好简历，从专注内容开始</strong>
                  <p>用具体的数字和成果，讲述你的价值。</p>
                </div>
                <button onClick={() => setModal('help')} aria-label="查看书写指南">
                  <BookOpen size={17} />
                </button>
              </div>
              <div className="editor-status">
                <span>
                  {wordCount.toLocaleString()} 字符<span className="status-dot">·</span>UTF-8
                </span>
                <label>
                  <input
                    type="checkbox"
                    checked={sync}
                    onChange={(e) => setSync(e.target.checked)}
                  />
                  同步滚动
                </label>
              </div>
            </>
          ) : (
            <div className="settings-body">
              <div className="settings-intro">
                <span>DESIGN YOUR RESUME</span>
                <h2>让表达，多一点个性。</h2>
                <p>调整每一个细节，找到适合你的样子。</p>
              </div>
              <div className="setting-group">
                <label>
                  简历主题
                  <button onClick={() => setModal('templates')}>
                    查看全部 <ChevronDown size={12} />
                  </button>
                </label>
                <button className="current-theme" onClick={() => setModal('templates')}>
                  <div className="theme-symbol" style={{ color: settings.color }}>
                    <FileText size={27} />
                  </div>
                  <div>
                    <strong>{currentTemplate.name}</strong>
                    <small>{currentTemplate.description}</small>
                  </div>
                  <ChevronDown size={16} />
                </button>
              </div>
              <div className="setting-group">
                <label>
                  主题颜色<span>{settings.color.toUpperCase()}</span>
                </label>
                <div className="colors">
                  {['#2c584b', '#373b45', '#3b64a3', '#8a5a46', '#79628c', '#a7803e'].map(
                    (color) => (
                      <button
                        key={color}
                        className={settings.color === color ? 'chosen' : ''}
                        style={{ backgroundColor: color }}
                        onClick={() => updateSettings({ color })}
                        aria-label={`主题颜色 ${color}`}
                      >
                        {settings.color === color && <Check size={16} />}
                      </button>
                    )
                  )}
                  <input
                    aria-label="自定义主题颜色"
                    type="color"
                    value={settings.color}
                    onChange={(e) => updateSettings({ color: e.target.value })}
                  />
                </div>
              </div>
              <TypographyControls settings={settings} onChange={updateSettings} />
              <HeadingControls settings={settings} onChange={updateSettings} />
              <IconControls
                key={resume.id}
                library={resume.iconLibrary}
                onChange={(iconLibrary) => update({ iconLibrary })}
                onInsert={(syntax) => {
                  const position = Math.min(
                    editor.current?.state.selection.main.to || 0,
                    resume.content.length
                  );
                  update({
                    content:
                      resume.content.slice(0, position) +
                      ` ${syntax} ` +
                      resume.content.slice(position),
                  });
                  setPanel('content');
                  notify(`已插入 ${syntax}`);
                }}
              />
              {(
                [
                  { key: 'fontSize', name: '正文字号', min: 10, max: 18, step: 1, unit: 'px' },
                  { key: 'margin', name: '页面边距', min: 24, max: 72, step: 4, unit: 'px' },
                ] as const
              ).map((item) => (
                <div className="setting-group" key={item.key}>
                  <label htmlFor={item.key}>
                    {item.name}
                    <span>
                      {settings[item.key]} {item.unit}
                    </span>
                  </label>
                  <input
                    id={item.key}
                    type="range"
                    min={item.min}
                    max={item.max}
                    step={item.step}
                    value={settings[item.key]}
                    onChange={(e) => updateSettings({ [item.key]: Number(e.target.value) })}
                  />
                </div>
              ))}
              <div id="photo-settings">
                <PhotoControls
                  key={resume.id}
                  photo={resume.photo}
                  onChange={(photo) => update({ photo })}
                  onToast={notify}
                />
              </div>
              <div className="one-page-card">
                <div>
                  <Sparkles size={18} />
                  <strong>智能一页</strong>
                  <span>自动缩放内容，收纳至一页</span>
                </div>
                <button
                  className={`switch ${settings.onePage ? 'on' : ''}`}
                  role="switch"
                  aria-checked={settings.onePage}
                  aria-label="智能一页"
                  onClick={() => updateSettings({ onePage: !settings.onePage })}
                >
                  <span />
                </button>
              </div>
              <button
                className="reset-button"
                onClick={() => {
                  updateSettings({ ...defaults });
                  notify('已恢复默认样式');
                }}
              >
                恢复默认样式
              </button>
            </div>
          )}
        </section>
        <section className="preview-pane" aria-label="预览面板">
          <div className="preview-toolbar">
            <span className="preview-title">
              实时预览
              <span className="live-dot" />
            </span>
            <div className="preview-tools">
              <span className="a4-label">A4</span>
              <span className="tool-divider" />
              <select
                aria-label="预览缩放"
                value={zoomOption}
                onChange={(e) => setZoomOption(e.target.value)}
              >
                <option value="auto">适应宽度</option>
                <option value="0.5">50%</option>
                <option value="0.75">75%</option>
                <option value="1">100%</option>
              </select>
              <button
                className="icon-button"
                onClick={() => setFocusPreview(!focusPreview)}
                aria-label={focusPreview ? '退出专注预览' : '专注预览'}
                title={focusPreview ? '退出专注预览' : '专注预览'}
              >
                {focusPreview ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              </button>
            </div>
          </div>
          <div className="preview-scroll" ref={previewArea}>
            <div className="paper-meta">
              <span>{currentTemplate.name}</span>
              <span>210 × 297 mm</span>
            </div>
            <Preview
              content={resume.content}
              settings={settings}
              photo={resume.photo}
              iconLibrary={resume.iconLibrary}
              zoom={zoom}
              onPageCount={setPageCount}
            />
            <div className="preview-footnote">
              <CheckCheck size={14} /> 你的每一次修改，都在这里实时呈现
            </div>
          </div>
          <div className="preview-status">
            <span>
              <span className="status-live" />
              预览已更新
            </span>
            <span>
              共 {pageCount} 页<span className="status-dot">·</span>
              {Math.round(zoom * 100)}%
            </span>
          </div>
        </section>
      </div>
      <div className="mobile-nav">
        <button
          className={mobileView === 'edit' ? 'active' : ''}
          onClick={() => setMobileView('edit')}
        >
          <Code2 size={16} />
          编辑
        </button>
        <button
          className={mobileView === 'preview' ? 'active' : ''}
          onClick={() => setMobileView('preview')}
        >
          <FileText size={16} />
          预览
        </button>
      </div>
      <input
        ref={fileInput}
        className="hidden"
        type="file"
        accept=".md,.markdown,.txt,text/markdown,text/plain"
        onChange={(e) => {
          void importMd(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
      {modal === 'templates' && (
        <Modal
          title="一份内容，多种表达。"
          subtitle="选择喜欢的主题，简历内容会完整保留。"
          onClose={() => setModal(null)}
          wide
        >
          <div className="template-grid">
            {templates.map((t) => (
              <button
                className={`template-card ${settings.template === t.id ? 'selected' : ''}`}
                key={t.id}
                onClick={() => {
                  updateSettings({
                    template: t.id,
                    color: t.color,
                    font: t.id === 'classic' ? 'serif' : 'sans',
                  });
                  setModal(null);
                  notify(`已应用「${t.name}」主题`);
                }}
              >
                <div
                  className={`mini-paper mini-${t.id}`}
                  style={{ '--mini-color': t.color } as CSSProperties}
                >
                  <strong>林知夏</strong>
                  <small>前端开发工程师</small>
                  <div className="mini-rule" />
                  <b>工作经历</b>
                  <i />
                  <i />
                  <i className="short" />
                  <b>项目经历</b>
                  <i />
                  <i />
                  <i className="short" />
                  <b>教育背景</b>
                  <i />
                  <i className="short" />
                </div>
                <div className="template-card-info">
                  <strong>{t.name}</strong>
                  {settings.template === t.id ? (
                    <span>
                      <Check size={12} /> 已选择
                    </span>
                  ) : (
                    <span>{t.tag}</span>
                  )}
                </div>
                <p>{t.description}</p>
              </button>
            ))}
          </div>
        </Modal>
      )}
      {modal === 'help' && (
        <Modal
          title="一点语法，很多可能。"
          subtitle="普通 Markdown，加上为简历准备的分栏语法。"
          onClose={() => setModal(null)}
        >
          <div className="help-content">
            <div className="syntax-row">
              <span>姓名 / 求职意向</span>
              <code># 你的姓名</code>
            </div>
            <div className="syntax-row">
              <span>模块标题</span>
              <code>## 工作经历</code>
            </div>
            <div className="syntax-row">
              <span>重点与列表</span>
              <code>- 效率提升 **35%**</code>
            </div>
            <div className="syntax-row">
              <span>个人链接</span>
              <code>[作品集](https://example.com)</code>
            </div>
            <h3>标题留白与图标</h3>
            <p>
              样式设置 → 标题格式，可分别调整 H1–H6
              的字号、行距、段前/段后和装饰留白；「全部标题紧凑」可一键压缩。
            </p>
            <pre>
              {'icon:phone 138 0000 0000 · icon:mail hello@example.com\n## icon:briefcase 工作经历'}
            </pre>
            <p>
              内置 phone、mail、location、github、education、work、award 等图标。在样式设置中导入
              Iconfont 的 iconfont.js，symbol 名称 icon-xxx 对应
              icon:xxx；代码块和转义语法保持原文。
            </p>
            <h3>左边写经历，右边写时间</h3>
            <pre>
              {'::: left\n### 公司名称\n前端开发工程师\n:::\n::: right\n2023.07 — 至今\n杭州\n:::'}
            </pre>
            <p>
              在两列中间加入 <code>::: center</code>{' '}
              区块即可使用三列布局。表格也支持左、中、右对齐。
            </p>
            <div className="syntax-row">
              <span>手动分页</span>
              <code>::: pagebreak</code>
            </div>
            <div className="help-note">
              ⌘ / Ctrl + B 加粗 · ⌘ / Ctrl + I 斜体 · ⌘ / Ctrl + S 保存
              <br />
              内容自动保存在当前浏览器。导出 Markdown 可以备份与迁移。
            </div>
          </div>
        </Modal>
      )}
      {modal === 'documents' && (
        <Modal
          title="我的简历"
          subtitle="每一份简历，都为下一次机会准备。"
          onClose={() => setModal(null)}
        >
          <div className="document-list">
            {resumes.map((x) => (
              <button
                key={x.id}
                onClick={() => {
                  setActiveId(x.id);
                  setModal(null);
                }}
              >
                <span className="document-icon">
                  <FileText size={22} />
                </span>
                <div>
                  <strong>{x.title || '未命名简历'}</strong>
                  <small>
                    {new Date(x.updatedAt).toLocaleDateString('zh-CN')} · 保存在此浏览器
                  </small>
                </div>
                {x.id === activeId && <Check size={18} />}
              </button>
            ))}
          </div>
          <div className="modal-actions">
            <button className="button primary" onClick={() => newDocument()}>
              <Plus size={16} />
              新建简历
            </button>
            <button className="button" onClick={() => newDocument(true)}>
              <Copy size={16} />
              复制当前简历
            </button>
          </div>
        </Modal>
      )}
      {modal === 'export' && (
        <Modal
          title="准备好，迎接下一个机会。"
          subtitle="选择格式，带走你的简历。"
          onClose={() => setModal(null)}
        >
          <div className="export-options">
            <button
              onClick={() => {
                setModal(null);
                document.title = resume.title || '简历';
                setTimeout(() => window.print(), 100);
              }}
            >
              <span className="export-icon">
                <FileText size={24} />
              </span>
              <div>
                <strong>
                  PDF 简历 <span>推荐投递</span>
                </strong>
                <p>打开打印窗口，选择「另存为 PDF」</p>
              </div>
              <ArrowDownToLine size={19} />
            </button>
            <button onClick={exportMd}>
              <span className="export-icon">
                <Code2 size={24} />
              </span>
              <div>
                <strong>Markdown 源文件</strong>
                <p>保存原始内容，随时继续编辑</p>
              </div>
              <ArrowDownToLine size={19} />
            </button>
          </div>
          <p className="export-note">
            PDF 使用 A4 纸张，包含照片与排版。建议关闭打印页眉页脚，并启用背景图形。Markdown
            仅导出文字，不包含照片与样式设置。
          </p>
        </Modal>
      )}
    </div>
  );
}
