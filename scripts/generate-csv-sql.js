const fs = require('fs');
const path = require('path');

const landmarks = require('../data/landmarks.json');

// 生成CSV文件
const csvPath = path.join(__dirname, '../data/landmarks.csv');
const csvHeader = 'id,name,city,latitude,longitude,description,created_at,checkin_radius,amap_poi_id\n';
const csvContent = landmarks.map(landmark => {
  return [
    landmark.id,
    `"${landmark.name.replace(/"/g, '""')}"`,
    `"${landmark.city}"`,
    landmark.latitude,
    landmark.longitude,
    `"${landmark.description.replace(/"/g, '""')}"`,
    landmark.created_at,
    landmark.checkin_radius,
    landmark.amap_poi_id
  ].join(',');
}).join('\n');
fs.writeFileSync(csvPath, csvHeader + csvContent);
console.log('CSV文件已生成:', csvPath);

// 生成SQL文件
const sqlPath = path.join(__dirname, '../data/landmarks.sql');
const sqlContent = landmarks.map(landmark => {
  return `INSERT INTO landmarks (id, name, city, latitude, longitude, description, created_at, checkin_radius, amap_poi_id) VALUES (
  '${landmark.id}',
  '${landmark.name.replace(/'/g, "''")}',
  '${landmark.city}',
  ${landmark.latitude},
  ${landmark.longitude},
  '${landmark.description.replace(/'/g, "''")}',
  '${landmark.created_at}',
  ${landmark.checkin_radius},
  '${landmark.amap_poi_id}'
);`;
}).join('\n\n');
fs.writeFileSync(sqlPath, sqlContent);
console.log('SQL文件已生成:', sqlPath);