const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../prisma/dev.db'));

// 检查created_at字段的格式
console.log('=== 检查created_at字段格式 ===');

try {
  const rows = db.prepare('SELECT id, name, created_at, typeof(created_at) as type FROM landmarks').all();
  
  const timestampFormat = [];
  const stringFormat = [];
  const otherFormat = [];
  
  rows.forEach(row => {
    if (typeof row.created_at === 'number') {
      timestampFormat.push(row);
    } else if (typeof row.created_at === 'string') {
      stringFormat.push(row);
    } else {
      otherFormat.push(row);
    }
  });
  
  console.log(`时间戳格式: ${timestampFormat.length} 条`);
  console.log(`字符串格式: ${stringFormat.length} 条`);
  console.log(`其他格式: ${otherFormat.length} 条`);
  
  // 修复时间戳格式为ISO格式
  console.log('\n=== 修复created_at字段格式 ===');
  
  const updateStmt = db.prepare('UPDATE landmarks SET created_at = ? WHERE id = ?');
  let fixedCount = 0;
  
  timestampFormat.forEach(row => {
    try {
      const isoDate = new Date(row.created_at).toISOString();
      updateStmt.run(isoDate, row.id);
      fixedCount++;
    } catch (error) {
      console.error(`修复失败 ${row.id}:`, error.message);
    }
  });
  
  console.log(`修复了 ${fixedCount} 条记录`);
  
  // 再次检查
  console.log('\n=== 修复后检查 ===');
  const fixedRows = db.prepare('SELECT id, name, created_at, typeof(created_at) as type FROM landmarks LIMIT 10').all();
  fixedRows.forEach((row, index) => {
    console.log(`${index + 1}. ${row.id}: ${row.created_at} (${row.type})`);
  });
  
} catch (error) {
  console.error('错误:', error.message);
}

db.close();