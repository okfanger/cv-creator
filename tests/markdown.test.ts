import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderMarkdown } from '../src/markdown';

test('Muji-style columns render Markdown together in a single row', () => {
  const html = renderMarkdown(
    '::: left\n### 山海科技\n**工程师**\n:::\n\n::: center\nReact\n:::\n\n::: right\n2024 — 至今\n:::'
  );
  assert.equal((html.match(/class="resume-row"/g) || []).length, 1);
  assert.match(html, /column-left.*<h3>山海科技<\/h3>/s);
  assert.match(html, /<strong>工程师<\/strong>/);
  assert.match(html, /column-center/);
  assert.match(html, /column-right/);
});
test('ordinary content separates independent column rows', () => {
  const html = renderMarkdown(
    '::: left\n第一份工作\n:::\n\n- 工作成果\n\n::: left\n第二份工作\n:::'
  );
  assert.equal((html.match(/class="resume-row"/g) || []).length, 2);
});
test('consecutive award pairs each keep their title and award on a separate row', () => {
  const source = readFileSync(new URL('./fixtures/awards.md', import.meta.url), 'utf8');
  const html = renderMarkdown(source);
  const rows = html.split('<div class="resume-row">').slice(1);
  const awards = [
    ['2023 ACM-ICPC 西部赛', '银牌'],
    ['第十六届内蒙古自治区大学生程序设计竞赛 (CCPC)', '一等奖'],
    ['2023 中国大学生计算机设计大赛决赛（移动端开发赛道）', '二等奖'],
    ['2022 华北五省（市、自治区）及港澳台大学生计算机应用大赛决赛', '二等奖'],
    ['2022 高教社杯全国大学生数学建模大赛 国赛', '二等奖'],
    ['2023 第十四届蓝桥杯软件类 国赛（Java 软件开发 B 组）', '三等奖'],
    ['2023 七牛云第二届 1024 创作节之校园编程马拉松', '创作奖'],
  ];
  assert.equal(rows.length, awards.length);
  rows.forEach((row, i) => {
    assert.equal((row.match(/class="resume-column /g) || []).length, 2);
    assert.ok(row.includes(awards[i][0]));
    assert.ok(row.includes(`<strong>${awards[i][1]}</strong>`));
  });
  assert.match(
    html,
    /href="https:\/\/www\.qiniu\.com\/activity\/detail\/651297ed0d50912d3d53307b"/
  );
  assert.ok(html.endsWith('</div></div><h2>校</h2>\n'));
});
test('repeated three-column rows start again after the right column', () => {
  const source = ['left', 'center', 'right', 'left', 'center', 'right']
    .map((direction, i) => `::: ${direction}\n内容 ${i}\n:::`)
    .join('\n\n');
  const rows = renderMarkdown(source).split('<div class="resume-row">').slice(1);
  assert.equal(rows.length, 2);
  rows.forEach((row) => assert.equal((row.match(/class="resume-column /g) || []).length, 3));
});
test('a repeated column restarts an incomplete row without merging unrelated entries', () => {
  const source = ':::left\n独立内容\n:::\n\n:::left\n下一条内容\n:::\n:::right\n时间\n:::';
  const rows = renderMarkdown(source).split('<div class="resume-row">').slice(1);
  assert.equal(rows.length, 2);
  assert.equal((rows[0].match(/class="resume-column /g) || []).length, 1);
  assert.equal((rows[1].match(/class="resume-column /g) || []).length, 2);
});
test('directives in code fences stay literal and malformed blocks remain visible', () => {
  assert.doesNotMatch(renderMarkdown('```\n::: left\n示例\n:::\n```'), /class="resume-row"/);
  assert.match(renderMarkdown('::: left\n未闭合'), /::: left/);
});
test('three-column Markdown tables retain alignment', () => {
  const html = renderMarkdown(
    '| 公司 | 岗位 | 时间 |\n| :--- | :---: | ---: |\n| 山海 | 工程师 | 2024 |'
  );
  assert.match(html, /<table>/);
  assert.match(html, /text-align:center/);
  assert.match(html, /text-align:right/);
});
test('raw HTML and unsafe URLs cannot execute', () => {
  const html = renderMarkdown('<img src=x onerror=alert(1)>\n\n[危险链接](javascript:alert(1))');
  assert.doesNotMatch(html, /<img/);
  assert.doesNotMatch(html, /href="javascript:/);
});
test('pagebreak extension creates an explicit pagination marker', () => {
  assert.match(renderMarkdown('内容\n\n::: pagebreak\n\n下一页'), /data-page-break="true"/);
});

test('icons render in headings, links and adjacent punctuation with aliases', () => {
  const html = renderMarkdown(
    '## icon:work 工作经历\n\nicon:phone，icon:email 联系方式 · [icon:github GitHub](https://github.com)'
  );
  assert.equal((html.match(/class="resume-icon"/g) || []).length, 4);
  assert.match(html, /<h2><svg/);
  assert.match(html, /<a href="https:\/\/github.com"><svg/);
});
test('unknown names, escaped icons, code and URL text remain literal', () => {
  const html = renderMarkdown(
    'icon:unknown icon\\:phone `icon:mail`\n\n```\nicon:phone\n```\n\nhttps://example.com/icon:phone'
  );
  assert.doesNotMatch(html, /class="resume-icon"/);
  assert.match(html, /icon:unknown icon:phone/);
  assert.match(html, /<code>icon:mail<\/code>/);
  assert.match(html, /href="https:\/\/example.com\/icon:phone"/);
});
test('imported icons take priority and propagate into resume columns', () => {
  const custom = {
    phone: { viewBox: '0 0 10 10', body: '<circle cx="5" cy="5" r="4" fill="#ff0000" />' },
  };
  const html = renderMarkdown(
    ':::left\nicon:icon-phone 联系方式\n:::\n:::right\nicon:phone 电话\n:::',
    custom
  );
  assert.equal((html.match(/viewBox="0 0 10 10"/g) || []).length, 2);
  assert.equal((html.match(/class="resume-row"/g) || []).length, 1);
});

test('JavaScript object property names are unknown icons', () => {
  const html = renderMarkdown('icon:constructor icon:toString icon:__proto__');
  assert.doesNotMatch(html, /<svg/);
  assert.match(html, /icon:constructor/);
});
