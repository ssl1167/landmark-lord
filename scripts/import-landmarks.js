const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../prisma/dev.db');
const sqlPath = path.join(__dirname, '../prisma/seed-landmarks.sql');

const Database = require('better-sqlite3');
const db = new Database(dbPath);

const sql = fs.readFileSync(sqlPath, 'utf8');

const statements = sql.split(';').filter(s => s.trim());

statements.forEach(statement => {
    try {
        db.exec(statement);
    } catch (error) {
        console.error('执行SQL失败:', error.message);
    }
});

db.close();
console.log('数据导入完成');