import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhoto, readPhoto } from '../src/photo';
import { photoDefaults } from '../src/data';

test('existing resumes without photos remain compatible', () => {
  assert.equal(normalizePhoto(undefined), undefined);
  assert.equal(normalizePhoto(null), undefined);
});
test('only local raster data URLs are accepted as stored photos', () => {
  for (const source of [
    'https://example.com/photo.jpg',
    'javascript:alert(1)',
    'data:image/svg+xml;base64,PHN2Zz4=',
  ]) {
    assert.equal(normalizePhoto({ source }), undefined);
  }
  assert.ok(normalizePhoto({ source: 'data:image/jpeg;base64,YWJj' }));
});
test('photo layout data is bounded and legacy/missing values receive defaults', () => {
  const photo = normalizePhoto({
    source: 'data:image/png;base64,YWJj',
    width: 100000,
    zoom: -1,
    x: NaN,
    y: -20,
  });
  assert.equal(photo?.width, 144);
  assert.equal(photo?.zoom, 1);
  assert.equal(photo?.x, 50);
  assert.equal(photo?.y, 0);
  assert.equal(photo?.position, photoDefaults.position);
  assert.equal(photo?.shape, photoDefaults.shape);
});
test('hidden photo data remains available to show again', () => {
  const source = 'data:image/jpeg;base64,YWJj';
  const photo = normalizePhoto({ source, enabled: false });
  assert.equal(photo?.enabled, false);
  assert.equal(photo?.source, source);
});
test('non-image and oversized photo files fail before image decoding', async () => {
  await assert.rejects(
    readPhoto(new File(['not a photo'], 'resume.txt', { type: 'text/plain' })),
    /JPG、PNG 或 WebP/
  );
  await assert.rejects(
    readPhoto(
      new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.jpg', { type: 'image/jpeg' })
    ),
    /10 MB/
  );
});
