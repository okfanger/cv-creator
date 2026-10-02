import MarkdownIt from 'markdown-it';
import { resolveIcon, iconMarkup, type IconMap } from './icons';

const md = new MarkdownIt({ html: false, breaks: true, linkify: true });

// A block rule keeps layout directives inside code fences literal. Columns
// advance left -> center (optional) -> right; a restart begins a new row.
// Blank lines are not tokens, so adjacency alone cannot identify row boundaries.
md.block.ruler.before('fence', 'resume_column', (state, start, end, silent) => {
  const line = state.src.slice(state.bMarks[start] + state.tShift[start], state.eMarks[start]);
  const match = /^::: ?(left|center|right)\s*$/.exec(line);
  if (!match) return false;
  let close = start + 1;
  while (
    close < end &&
    state.src.slice(state.bMarks[close] + state.tShift[close], state.eMarks[close]).trim() !== ':::'
  )
    close++;
  if (close === end) return false;
  if (silent) return true;
  const token = state.push('resume_column', 'div', 0);
  token.info = match[1];
  token.content = state.getLines(start + 1, close, state.blkIndent, false);
  token.map = [start, close + 1];
  state.line = close + 1;
  return true;
});
const columnOrder: Record<string, number> = { left: 0, center: 1, right: 2 };
function sharesRow(
  previous: { type: string; info: string } | undefined,
  next: { type: string; info: string } | undefined
) {
  return (
    previous?.type === 'resume_column' &&
    next?.type === 'resume_column' &&
    columnOrder[previous.info] < columnOrder[next.info]
  );
}
md.renderer.rules.resume_column = (tokens, i, _options, env) => {
  const before = sharesRow(tokens[i - 1], tokens[i]);
  const after = sharesRow(tokens[i], tokens[i + 1]);
  return `${before ? '' : '<div class="resume-row">'}<div class="resume-column column-${tokens[i].info}">${md.render(tokens[i].content, env)}</div>${after ? '' : '</div>'}`;
};
md.block.ruler.before('resume_column', 'page_break', (state, start, _end, silent) => {
  const line = state.src
    .slice(state.bMarks[start] + state.tShift[start], state.eMarks[start])
    .trim();
  if (line !== '::: pagebreak') return false;
  if (silent) return true;
  state.push('page_break', 'div', 0);
  state.line = start + 1;
  return true;
});
md.renderer.rules.page_break = () => '<div data-page-break="true"></div>';

// Work on parsed text before escape/entity tokens are joined. Code spans,
// fenced code and link destinations never enter this rule.
md.core.ruler.before('text_join', 'resume_icons', (state) => {
  for (const block of state.tokens) {
    if (!block.children) continue;
    const children = [];
    let autolink = false;
    for (const token of block.children) {
      if (token.type === 'link_open')
        autolink = token.markup === 'autolink' || token.info === 'auto';
      if (token.type === 'link_close') autolink = false;
      if (token.type !== 'text' || autolink) {
        children.push(token);
        continue;
      }
      let cursor = 0;
      const pattern = /(^|[^A-Za-z0-9_/:\\-])icon:([a-zA-Z][\w-]*)(?![\w-])/g;
      for (const match of token.content.matchAll(pattern)) {
        const icon = resolveIcon(match[2], state.env.icons as IconMap);
        if (!icon) continue;
        const start = match.index! + match[1].length;
        if (start > cursor) {
          const text = new state.Token('text', '', 0);
          text.content = token.content.slice(cursor, start);
          children.push(text);
        }
        const node = new state.Token('resume_icon', 'svg', 0);
        node.content = iconMarkup(icon);
        children.push(node);
        cursor = start + 'icon:'.length + match[2].length;
      }
      if (cursor < token.content.length) {
        const text = new state.Token('text', '', 0);
        text.content = token.content.slice(cursor);
        children.push(text);
      }
    }
    block.children = children;
  }
});
md.renderer.rules.resume_icon = (tokens, i) => tokens[i].content;
export function renderMarkdown(source: string, icons: IconMap = {}) {
  return md.render(source, { icons });
}
