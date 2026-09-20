const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.join(__dirname, '..', 'pulseroom');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const videos = [...html.matchAll(/<video\s+([^>]+)>/g)];
assert.equal(videos.length, 2);
for (const [, attributes] of videos) {
  for (const required of ['controls', 'playsinline', 'preload="metadata"', 'aria-label=']) {
    assert.ok(attributes.includes(required));
  }
  assert.ok(!attributes.includes('autoplay'));
}
for (const [, asset] of html.matchAll(/(?:src|poster|href)="([^"?#]+)(?:\?[^"#]*)?"/g)) {
  if (/^https?:/.test(asset)) continue;
  assert.ok(fs.existsSync(path.join(root, asset)), asset);
}
const films = [0, 1].map(() => ({
  paused: true,
  handlers: {},
  addEventListener(name, callback) { this.handlers[name] = callback; },
  pause() { this.paused = true; },
  play() { this.paused = false; this.handlers.play(); },
}));
vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], {
  document: { querySelectorAll: selector => { assert.equal(selector, 'video'); return films; } },
});
films[0].play();
assert.equal(films[0].paused, false);
assert.equal(films[1].paused, true);
films[1].play();
assert.equal(films[0].paused, true);
assert.equal(films[1].paused, false);
films[0].play();
assert.equal(films[1].paused, true);
assert.ok(html.includes('flashing lights'));
console.log('PASS: two accessible, non-autoplay players; local media links; mutually exclusive soundtracks in both directions.');
