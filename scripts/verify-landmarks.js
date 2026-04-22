const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../prisma/dev.db'));

const count = db.prepare('SELECT COUNT(*) as count FROM landmarks').get();
console.log('地标总数:', count.count);

const sample = db.prepare('SELECT id, name, city, latitude, longitude FROM landmarks LIMIT 5').all();
console.log('\n示例数据:');
sample.forEach(row => {
  console.log(`- ${row.id}: ${row.name} (${row.city}) [${row.latitude}, ${row.longitude}]`);
});

db.close();