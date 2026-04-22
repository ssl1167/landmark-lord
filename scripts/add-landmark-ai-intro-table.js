const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const projectRoot = process.cwd();
const dbPath = path.join(projectRoot, 'prisma', 'dev.db');

console.log('数据库路径:', dbPath);
console.log('数据库文件是否存在:', fs.existsSync(dbPath));

if (!fs.existsSync(dbPath)) {
  console.error('数据库文件不存在！');
  process.exit(1);
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS landmark_ai_intro (
    id TEXT PRIMARY KEY,
    landmark_id TEXT NOT NULL,
    language TEXT NOT NULL,
    intro_text TEXT NOT NULL,
    audio_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (landmark_id) REFERENCES landmarks(id)
  );
`);

console.log('landmark_ai_intro 表已创建或已存在');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('当前数据库中的表:', tables.map(t => t.name).join(', '));

db.close();
console.log('数据库连接已关闭');