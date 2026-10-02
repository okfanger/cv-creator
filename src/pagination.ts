export type Page = { html: string; scale: number };
type Block = {
  html: string;
  group?: number;
  open?: string;
  close?: string;
  break?: boolean;
  heading?: boolean;
};

// Split long lists/tables at semantic boundaries and measure assembled pages,
// including real collapsed margins. Oversized indivisible blocks are scaled
// rather than silently clipped by the fixed A4 page.
export function paginate(node: HTMLElement, available: number, onePage: boolean): Page[] {
  const blocks: Block[] = [];
  [...node.children].forEach((element, group) => {
    const child = element as HTMLElement;
    if (child.hasAttribute('data-page-break')) {
      blocks.push({ html: '', break: true });
      return;
    }
    if (child.tagName === 'UL' || child.tagName === 'OL') {
      [...child.children].forEach((li, i) =>
        blocks.push({
          html: li.outerHTML,
          group,
          open:
            child.tagName === 'OL'
              ? `<ol start="${Number(child.getAttribute('start') || 1) + i}">`
              : '<ul>',
          close: `</${child.tagName.toLowerCase()}>`,
        })
      );
    } else if (child.tagName === 'TABLE' && child.querySelector('tbody')) {
      const heading = child.querySelector('thead')?.outerHTML || '';
      [...child.querySelectorAll('tbody > tr')].forEach((row) =>
        blocks.push({
          html: row.outerHTML,
          group,
          open: `<table>${heading}<tbody>`,
          close: '</tbody></table>',
        })
      );
    } else blocks.push({ html: child.outerHTML, heading: /^H[1-6]$/.test(child.tagName) });
  });
  function assemble(items: Block[]) {
    let html = '';
    items.forEach((item, i) => {
      if (item.break) return;
      if (item.group === undefined) {
        html += item.html;
        return;
      }
      if (items[i - 1]?.group !== item.group) html += item.open;
      html += item.html;
      if (items[i + 1]?.group !== item.group) html += item.close;
    });
    return html;
  }
  const probe = node.cloneNode(false) as HTMLElement;
  probe.removeAttribute('aria-hidden');
  document.body.appendChild(probe);
  const measure = (items: Block[]) => {
    probe.innerHTML = assemble(items);
    return probe.scrollHeight;
  };
  const result: Page[] = [];
  let current: Block[] = [];
  const flush = () => {
    if (!current.length) return;
    const height = measure(current);
    result.push({ html: assemble(current), scale: Math.min(1, available / Math.max(1, height)) });
    current = [];
  };
  try {
    if (onePage) {
      current = blocks.filter((x) => !x.break);
      flush();
    } else
      blocks.forEach((block, i) => {
        if (block.break) {
          flush();
          return;
        }
        const lookahead =
          block.heading && blocks[i + 1] && !blocks[i + 1].break ? [blocks[i + 1]] : [];
        if (current.length && measure([...current, block, ...lookahead]) > available) flush();
        current.push(block);
      });
    flush();
  } finally {
    probe.remove();
  }
  return result.length ? result : [{ html: '', scale: 1 }];
}
