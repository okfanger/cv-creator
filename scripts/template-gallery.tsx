/** Development-only screenshot surface; renders the real Preview component. */
import React from 'react';
import { createRoot } from 'react-dom/client';
import Preview from '../src/Preview';
import { templates } from '../src/data';
import { parseResumeFile } from '../src/resumeFile';
import source from '../examples/developer-resume.md?raw';
import '../src/styles.css';
import '../src/aiTemplate.css';
import './template-gallery.css';

const sample = parseResumeFile(source);
const ignorePageCount = () => {};
createRoot(document.getElementById('root')!).render(
  <main className="gallery">
    <header>
      <img src="../assets/logo.svg" width="36" height="36" alt="" />
      <div>
        <h1>Qingjian · 轻简</h1>
        <p>Seven templates. One Markdown file. / 同一份内容，七种表达。</p>
      </div>
    </header>
    <div className="gallery-grid">
      {templates.map((template) => (
        <section key={template.id} aria-label={template.name}>
          <h2>{template.name}</h2>
          <Preview
            content={sample.content}
            settings={{
              ...sample.settings,
              template: template.id,
              color: template.color,
              font: template.font,
            }}
            zoom={0.285}
            onPageCount={ignorePageCount}
          />
        </section>
      ))}
    </div>
    <p className="gallery-note">
      Real preview renderer · Fictional demo resume · Local fonts / 实际预览组件 · 虚构示例 ·
      本机字体
    </p>
  </main>
);
