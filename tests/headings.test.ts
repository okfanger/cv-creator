import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compactHeadings,
  defaultHeadings,
  headingVariables,
  normalizeHeadings,
} from '../src/headings';

test('older resumes gain all heading levels and independent settings', () => {
  const a = normalizeHeadings(undefined);
  const b = defaultHeadings();
  a.h1.fontSize = 48;
  assert.equal(b.h1.fontSize, 32);
  assert.equal(Object.keys(a).length, 6);
  assert.equal(a.h2.before, 22);
});
test('zero spacing is preserved and invalid values cannot break layout', () => {
  const normalized = normalizeHeadings({
    h2: { before: 0, after: 0, padding: 0, fontSize: 999, lineHeight: NaN },
    h4: { before: -10 },
  });
  assert.deepEqual(normalized.h2, {
    before: 0,
    after: 0,
    padding: 0,
    fontSize: 48,
    lineHeight: 1.5,
  });
  assert.equal(normalized.h4.before, 0);
  assert.equal(normalized.h3.before, 8);
  const variables = headingVariables(normalized);
  assert.equal(variables['--h2-before'], '0px');
  assert.equal(variables['--h2-lineHeight'], 1.5);
});
test('compact preset retains chosen font sizes and removes decorative padding', () => {
  const settings = defaultHeadings();
  settings.h1.fontSize = 28;
  const compact = compactHeadings(settings);
  assert.equal(compact.h1.fontSize, 28);
  assert.equal(compact.h2.padding, 0);
  assert.equal(settings.h2.padding, 6);
});
