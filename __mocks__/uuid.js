// CJS shim for uuid v14 (ESM-only) — used in Jest via moduleNameMapper.
// v4: delegates to Node built-in crypto.randomUUID().
// v5: standard RFC 4122 name-based UUID using SHA-1 (compatible with uuid library).
const crypto = require('crypto');

function v4() {
  return crypto.randomUUID();
}

function v5(name, namespace) {
  const nsBytes = Buffer.from(namespace.replace(/-/g, ''), 'hex');
  const hash = crypto.createHash('sha1')
    .update(nsBytes)
    .update(Buffer.from(name, 'utf8'))
    .digest();
  hash[6] = (hash[6] & 0x0f) | 0x50; // version 5
  hash[8] = (hash[8] & 0x3f) | 0x80; // variant RFC 4122
  const h = hash.slice(0, 16).toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

module.exports = { v4, v5 };
