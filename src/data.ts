import { defaultHeadings, type HeadingSettings } from './headings';
import type { IconLibrary } from './icons';

export type Settings = {
  template: 'minimal' | 'classic' | 'modern';
  color: string;
  fontSize: number;
  lineHeight: number;
  margin: number;
  font: 'sans' | 'serif' | 'heiti' | 'kaiti' | 'mono';
  onePage: boolean;
  headings: HeadingSettings;
};
export type Resume = {
  id: string;
  title: string;
  content: string;
  settings: Settings;
  photo?: ResumePhoto;
  iconLibrary?: IconLibrary;
  updatedAt: number;
};
export type ResumePhoto = {
  source: string;
  name: string;
  enabled: boolean;
  position: 'left' | 'right';
  shape: 'portrait' | 'square' | 'circle';
  width: number;
  zoom: number;
  x: number;
  y: number;
};
export const photoDefaults = {
  enabled: true,
  position: 'right' as const,
  shape: 'portrait' as const,
  width: 96,
  zoom: 1,
  x: 50,
  y: 50,
};
export const fonts = [
  {
    id: 'sans',
    name: '现代黑体 · 苹方 / 微软雅黑',
    family: '"PingFang SC", "Microsoft YaHei", sans-serif',
  },
  { id: 'heiti', name: '传统黑体 · 黑体', family: '"Heiti SC", "SimHei", "STHeiti", sans-serif' },
  {
    id: 'serif',
    name: '经典宋体 · 宋体',
    family: '"Songti SC", "Noto Serif CJK SC", "SimSun", serif',
  },
  { id: 'kaiti', name: '书写楷体 · 楷体', family: '"Kaiti SC", "STKaiti", "KaiTi", serif' },
  {
    id: 'mono',
    name: '技术等宽 · Menlo / Consolas',
    family: 'Menlo, Consolas, "PingFang SC", monospace',
  },
] as const;
export const defaults: Settings = {
  template: 'minimal',
  color: '#2c584b',
  fontSize: 13,
  lineHeight: 1.7,
  margin: 48,
  font: 'sans',
  onePage: false,
  headings: defaultHeadings(),
};
export const sample = `# 林知夏
前端开发工程师 · 用代码连接设计与体验

杭州 · 138 0000 0000 · hello@example.com
[GitHub](https://github.com) · [个人作品集](https://example.com)

## 关于我
3 年前端开发经验，专注于构建清晰、高效且有温度的用户体验。擅长 React 技术栈与工程化实践，重视产品细节，善于将复杂需求转化为简洁的解决方案。

## 工作经历
::: left
### 山海科技
前端开发工程师 · 产品研发部
:::
::: right
2023.07 — 至今
杭州
:::

- 负责企业协作平台核心模块开发，服务 **20,000+** 企业用户。
- 主导组件库建设，沉淀 30+ 通用组件，团队开发效率提升 **35%**。
- 优化首屏加载与资源策略，页面加载时间从 3.2s 降至 **1.4s**。

::: left
### 星河数字
前端开发实习生
:::
::: right
2022.06 — 2023.06
上海
:::

- 参与数据可视化平台建设，基于 ECharts 实现多维度业务报表。
- 协同设计团队打磨交互细节，完成移动端适配与无障碍优化。

## 项目经历
::: left
### 轻舟 · 团队知识库
React / TypeScript / Vite / Node.js
:::
::: right
2024.03 — 2024.08
核心开发者
:::

- 从零搭建 Markdown 协同知识库，支持全文检索、权限管理与版本历史。
- 设计模块化编辑器架构，接入实时协作，文档同步延迟低于 **200ms**。

## 教育背景
::: left
### 浙江工业大学
计算机科学与技术 · 本科
:::
::: right
2019.09 — 2023.06
GPA 3.8 / 4.0
:::

## 专业技能
- **前端开发**：JavaScript、TypeScript、React、Vue、HTML5 / CSS3
- **工程实践**：Vite、Webpack、Git、自动化测试、性能优化
- **设计协作**：Figma、设计系统、响应式布局、交互设计
`;
export const createResume = (title = '林知夏 · 前端开发工程师'): Resume => ({
  id: crypto.randomUUID(),
  title,
  content: sample,
  settings: { ...defaults, headings: defaultHeadings() },
  updatedAt: Date.now(),
});
export const templates = [
  {
    id: 'minimal' as const,
    name: '自然简约',
    description: '清晰层次，让内容自己说话',
    tag: '当前推荐',
    color: '#2c584b',
  },
  {
    id: 'classic' as const,
    name: '经典书页',
    description: '沉稳衬线，适合专业与学术',
    tag: '经典',
    color: '#373b45',
  },
  {
    id: 'modern' as const,
    name: '现代蓝调',
    description: '鲜明标题，突出你的专业度',
    tag: '现代',
    color: '#3b64a3',
  },
];
