const assert = require('node:assert/strict');
const dict = require('../assets/js/translations.json');
for (const [source, text] of Object.entries(dict)) {
  assert.equal(typeof text.en, 'string');assert.equal(typeof text.ml, 'string');
  assert.ok(text.en.trim() && text.ml.trim(), source);
  assert.ok(!/\$\{|escapeHtml|document\.querySelector|\.textContent=/.test(source + text.en + text.ml), 'Embedded code in locale: ' + source);
}
// Wording corrections must not alter the clinical quantities in existing guidance.
for (const source of [
  'Generally 18–65; first-time donors should not be over 60.',
  'At least 45 kg for 350 ml; over 55 kg for 450 ml. Staff decide the suitable collection volume.',
  'Men: at least 90 days. Women: at least 120 days.'
]) {
  assert.deepEqual(dict[source].ml.match(/\d+/g).sort(), dict[source].en.match(/\d+/g).sort(), 'Changed guidance quantities: ' + source);
}
console.log('Passed Malayalam catalogue validation and clinical quantity preservation.');
