const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const projectRoot = process.cwd();
const dbPath = path.join(projectRoot, 'dev.db');

console.log('数据库路径:', dbPath);
console.log('数据库文件是否存在:', fs.existsSync(dbPath));

if (!fs.existsSync(dbPath)) {
  console.error('数据库文件不存在！');
  process.exit(1);
}

const db = new Database(dbPath);

// 检查 landmarks 表结构
console.log('检查 landmarks 表结构...');
const schema = db.prepare("PRAGMA table_info(landmarks)").all();
console.log('表结构:');
schema.forEach(column => {
  console.log(`- ${column.name} (${column.type}) ${column.notnull ? 'NOT NULL' : ''} ${column.dflt_value ? 'DEFAULT ' + column.dflt_value : ''}`);
});

// 检查中国传媒大学是否已存在
const existingLandmark = db.prepare("SELECT * FROM landmarks WHERE id = ?").get('beijing_006');
if (existingLandmark) {
  console.log('中国传媒大学已经存在于数据库中！');
  db.close();
  process.exit(0);
}

// 插入中国传媒大学数据
const insertStmt = db.prepare(`
  INSERT INTO landmarks (
    id, name, city, latitude, longitude, description, 
    created_at, updated_at, checkin_radius, level, guardian, 
    influence_score, influence_progress, status, tags, amap_poi_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const now = new Date().toISOString();
const ccmuLandmark = [
  'beijing_006', 
  '中国传媒大学', 
  '北京', 
  39.9487, 
  116.4818, 
  '中国传媒大学是中国著名的传媒类高等学府，位于北京市朝阳区定福庄东街1号', 
  now, 
  now, 
  200, 
  2, 
  'MediaStudent', 
  1500, 
  50, 
  'active', 
  '教育,大学', 
  'B000A7J5J9'
];

const result = insertStmt.run(...ccmuLandmark);

if (result.changes > 0) {
  console.log('中国传媒大学数据添加成功！');
  
  // 验证添加结果
  const addedLandmark = db.prepare("SELECT * FROM landmarks WHERE id = ?").get('beijing_006');
  if (addedLandmark) {
    console.log('验证成功，地标信息：');
    console.log('- 名称:', addedLandmark.name);
    console.log('- 城市:', addedLandmark.city);
    console.log('- 坐标:', addedLandmark.latitude, ',', addedLandmark.longitude);
  }
} else {
  console.error('添加失败！');
}

// 检查总地标数量
const count = db.prepare("SELECT COUNT(*) as total FROM landmarks").get();
console.log('当前数据库中的地标总数:', count.total);

db.close();
console.log('数据库连接已关闭');