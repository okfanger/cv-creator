import test from 'node:test';
import assert from 'node:assert/strict';
import { extractSvg } from '../src/iconfont';

test('extracts Iconfont SVG data without executing surrounding JavaScript', () => {
  const source = `throw new Error('must never execute'); var sprite = '<svg><symbol id="icon-mail" viewBox="0 0 24 24"><path d="M1 1h10"/></symbol></svg>';`;
  assert.equal(
    extractSvg(source),
    '<svg><symbol id="icon-mail" viewBox="0 0 24 24"><path d="M1 1h10"/></symbol></svg>'
  );
});
test('accepts escaped SVG attributes and rejects missing or oversized data', () => {
  assert.equal(
    extractSvg(String.raw`var sprite="<svg viewBox=\"0 0 24 24\"></svg>";`),
    '<svg viewBox="0 0 24 24"></svg>'
  );
  assert.throws(() => extractSvg('console.log("no SVG")'), /未找到 SVG/);
  assert.throws(() => extractSvg('x'.repeat(2_000_001)), /2 MB/);
});
