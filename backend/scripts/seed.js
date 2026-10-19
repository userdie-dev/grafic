// Mock data: a demo "me" user, three friends with shifts and subscriptions.
// Usage: node scripts/seed.js   (backend must have run once so tables exist)
const Database = require('better-sqlite3');
const { createHash, randomUUID } = require('crypto');

const db = new Database(process.env.DB_PATH ?? 'grafic.sqlite');
const hash = (t) => createHash('sha256').update(t).digest('hex');
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const people = [
  { name: 'me', token: 'demo-token-me', code: 'DEMO22', pattern: [['09:00', '18:00', null], null, ['09:00', '18:00', null], null, null, null, null] },
  { name: 'Аня', token: 'demo-token-anya', code: 'ANYA22', pattern: [['08:00', '16:00', 'Утро'], ['08:00', '16:00', 'Утро'], null, null, ['14:00', '22:00', 'Вечер'], ['14:00', '22:00', 'Вечер'], null] },
  { name: 'Борис', token: 'demo-token-boris', code: 'BORS22', pattern: [null, ['10:00', '19:00', null], ['10:00', '19:00', null], ['10:00', '19:00', null], null, null, ['12:00', '20:00', 'Подработка']] },
  { name: 'Вика', token: 'demo-token-vika', code: 'VIKA22', pattern: [['22:00', '23:59', 'Ночная'], null, null, ['07:00', '15:00', null], ['07:00', '15:00', null], null, null] },
];

const delUser = db.prepare('DELETE FROM user WHERE tokenHash = ?');
const getUser = db.prepare('SELECT id FROM user WHERE tokenHash = ?');
const insUser = db.prepare('INSERT INTO user (id, tokenHash, shareCode) VALUES (?, ?, ?)');
const delShifts = db.prepare('DELETE FROM shift WHERE userId = ?');
const delSubs = db.prepare('DELETE FROM subscription WHERE subscriberId = ? OR ownerId = ?');
const insShift = db.prepare('INSERT INTO shift (id, userId, date, start, "end", note) VALUES (?, ?, ?, ?, ?, ?)');
const insSub = db.prepare('INSERT INTO subscription (id, subscriberId, ownerId) VALUES (?, ?, ?)');

const now = new Date();
const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const last = new Date(now.getFullYear(), now.getMonth() + 2, 0);

db.transaction(() => {
  const ids = {};
  for (const p of people) {
    const old = getUser.get(hash(p.token));
    if (old) {
      delShifts.run(old.id);
      delSubs.run(old.id, old.id);
      delUser.run(hash(p.token));
    }
    ids[p.name] = randomUUID();
    insUser.run(ids[p.name], hash(p.token), p.code);
    for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
      const slot = p.pattern[(d.getDay() + 6) % 7];
      if (slot) insShift.run(randomUUID(), ids[p.name], iso(d), slot[0], slot[1], slot[2]);
    }
  }
  for (const p of people.slice(1)) insSub.run(randomUUID(), ids.me, ids[p.name]);

  console.log('Seeded. Paste in the browser console, then reload:\n');
  console.log(
    `localStorage.setItem('grafic.store', JSON.stringify({device:{userId:'${ids.me}',token:'demo-token-me',shareCode:'DEMO22'},month:'${iso(now)}',labels:{${people
      .slice(1)
      .map((p) => `'${ids[p.name]}':'${p.name}'`)
      .join(',')}},hidden:[]}))`,
  );
})();
