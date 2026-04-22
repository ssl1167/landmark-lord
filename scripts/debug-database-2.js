const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../prisma/dev.db'));

// 检查所有可能有问题的字段
const fieldsToCheck = ['name', 'city', 'description', 'guardian', 'status', 'tags', 'amap_poi_id'];

console.log('=== 检查所有文本字段 ===');

fieldsToCheck.forEach(field => {
  console.log(`\n检查 ${field} 字段:`);
  try {
    const rows = db.prepare(`SELECT id, ${field} FROM landmarks WHERE ${field} IS NOT NULL LIMIT 20`).all();
    
    let problemCount = 0;
    rows.forEach(row => {
      const value = row[field];
      if (value && typeof value === 'string') {
        // 检查是否包含无效字符
        for (let i = 0; i < value.length; i++) {
          const charCode = value.charCodeAt(i);
          if (charCode < 32 || (charCode > 126 && charCode < 160)) {
            console.log(`  发现问题 ${row.id}: ${field} 包含无效字符: ${value}`);
            problemCount++;
            break;
          }
        }
      }
    });
    
    if (problemCount === 0) {
      console.log(`  未发现 ${field} 字段有问题`);
    } else {
      console.log(`  发现 ${problemCount} 条记录有问题`);
    }
    
  } catch (error) {
    console.error(`  检查 ${field} 时出错:`, error.message);
  }
});

// 尝试使用更简单的查询
console.log('\n=== 尝试简单查询 ===');
try {
  const simpleQuery = db.prepare('SELECT id, name FROM landmarks LIMIT 5').all();
  console.log('简单查询成功:');
  simpleQuery.forEach(row => {
    console.log(`  ${row.id}: ${row.name}`);
  });
} catch (error) {
  console.error('简单查询失败:', error.message);
}

db.close();