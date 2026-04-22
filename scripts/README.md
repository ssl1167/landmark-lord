# 地标数据采集脚本

## 采集方案说明

本脚本使用高德地图Web Service API的POI搜索接口，采集北京市的真实地标数据。具体步骤如下：

1. 使用高德地图POI搜索API，按类型采集地标数据
2. 采集类型包括：博物馆、广场、车站、教堂、科技馆、公园、纪念馆、历史建筑、观景台
3. 对采集到的数据进行清洗和整理
4. 输出为JSON、CSV和SQL三种格式，便于后续导入

## 环境要求

- Node.js 14+
- npm 6+
- 高德地图Web Service Key

## 安装依赖

```bash
npm install axios
```

## 配置环境变量

在项目根目录创建 `.env` 文件，添加以下内容：

```
AMAP_KEY=你的高德地图Web Service Key
```

## 运行脚本

```bash
# 在项目根目录运行
node scripts/collect-landmarks.js
```

## 输出文件

运行完成后，会在 `data` 目录生成以下文件：

- `landmarks.json` - JSON格式数据
- `landmarks.csv` - CSV格式数据
- `landmarks.sql` - SQL插入语句

## 数据字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 地标唯一标识 |
| name | string | 地标名称 |
| city | string | 所属城市 |
| latitude | number | 纬度 |
| longitude | number | 经度 |
| description | string | 地标描述 |
| created_at | string | 创建时间 |
| checkin_radius | number | 打卡半径 |
| amap_poi_id | string | 高德POI ID |

## 导入数据到数据库

### 方法1：使用SQL文件

直接执行生成的SQL文件：

```bash
mysql -u username -p database_name < data/landmarks.sql
```

### 方法2：使用CSV文件

使用数据库工具（如phpMyAdmin、Navicat等）导入CSV文件。

### 方法3：使用JSON文件

编写脚本读取JSON文件并插入数据库。