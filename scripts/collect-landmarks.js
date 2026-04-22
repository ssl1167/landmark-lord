const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 加载环境变量
const dotenvPath = path.join(__dirname, '../.env');
if (fs.existsSync(dotenvPath)) {
  const envContent = fs.readFileSync(dotenvPath, 'utf8');
  const envVars = envContent.split('\n');
  for (const line of envVars) {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  }
}

// 环境变量配置
const AMAP_KEY = process.env.AMAP_KEY;
if (!AMAP_KEY) {
  console.error('请设置环境变量 AMAP_KEY');
  process.exit(1);
}

// 采集配置
const CONFIG = {
  city: '北京',
  types: [
    { name: '博物馆', keywords: '故宫博物院,国家博物馆,首都博物馆,军事博物馆,自然博物馆,科技馆,天文馆', types: '180100' },
    { name: '广场', keywords: '天安门广场,王府井步行街,前门大街,西单商业街,东单商业街', types: '150500' },
    { name: '车站', keywords: '北京站,北京西站,北京南站,北京北站', types: '150100' },
    { name: '教堂', keywords: '西什库教堂,王府井教堂,宣武门教堂,缸瓦市教堂', types: '150800' },
    { name: '科技馆', keywords: '中国科技馆,北京天文馆,北京自然博物馆', types: '180600' },
    { name: '公园', keywords: '颐和园,天坛,北海公园,景山公园,圆明园,香山公园,北京动物园,北京植物园', types: '110100' },
    { name: '纪念馆', keywords: '中国人民抗日战争纪念馆,中国人民革命军事博物馆,中国国家博物馆', types: '180500' },
    { name: '历史建筑', keywords: '故宫,天安门,人民大会堂,毛主席纪念堂,国家大剧院,鸟巢,水立方', types: '150200' },
    { name: '观景台', keywords: '景山观景台,白塔观景台,中央电视塔观景台', types: '181500' }
  ],
  pageSize: 25,
  outputFormats: ['json', 'sql', 'csv'],
  outputDir: path.join(__dirname, '../data'),
  targetCount: 50
};

// 黑名单关键词 - 过滤掉不适合作为地标的POI
const BLACKLIST_KEYWORDS = [
  '道路附属设施',
  '警示信息',
  '违章停车',
  '红绿灯',
  '摄像头',
  '交通提示',
  '路段',
  '路口',
  '匝道',
  '立交',
  '高架',
  '隧道',
  '收费站',
  '服务区',
  '停车场',
  '加油站',
  '充电站',
  '维修站',
  '检查站',
  '卡口',
  '监控',
  '测速',
  '限速',
  '禁停',
  '禁行',
  '违停',
  '违建',
  '施工',
  '临时',
  '废弃',
  '拆迁',
  '拆除',
  '规划',
  '在建',
  '待建',
  '未开放',
  '已关闭',
  '已停业',
  '已拆除',
  '已废弃'
];

// 白名单关键词 - 优先保留的高质量地标
const WHITELIST_KEYWORDS = [
  '故宫',
  '天安门',
  '颐和园',
  '圆明园',
  '天坛',
  '北海公园',
  '景山公园',
  '国家博物馆',
  '首都博物馆',
  '军事博物馆',
  '自然博物馆',
  '科技馆',
  '天文馆',
  '动物园',
  '植物园',
  '海洋馆',
  '水族馆',
  '美术馆',
  '艺术馆',
  '展览馆',
  '图书馆',
  '大剧院',
  '音乐厅',
  '体育场',
  '体育馆',
  '广场',
  '纪念碑',
  '纪念馆',
  '塔',
  '楼',
  '阁',
  '殿',
  '宫',
  '寺',
  '庙',
  '观',
  '堂',
  '院',
  '园',
  '陵',
  '墓',
  '城',
  '门',
  '桥',
  '钟楼',
  '鼓楼',
  '角楼',
  '牌楼',
  '牌坊',
  '教堂',
  '清真寺',
  '佛寺',
  '道观',
  '车站',
  '机场',
  '码头',
  '港口',
  '观景台',
  '观景',
  '眺望',
  '瞭望',
  '观景塔',
  '电视塔',
  '观光塔',
  '摩天轮',
  '地标',
  '中心',
  '大厦',
  '大楼',
  '购物中心',
  '步行街',
  '商业街',
  '老街',
  '古街',
  '胡同',
  '巷',
  '弄',
  '里',
  '坊',
  '庄',
  '村',
  '镇',
  '区',
  '县',
  '市'
];

// 地标类型映射 - 用于生成更好的描述
const LANDMARK_TYPE_MAP = {
  '博物馆': '博物馆',
  '科技馆': '科技馆',
  '天文馆': '天文馆',
  '美术馆': '美术馆',
  '艺术馆': '艺术馆',
  '展览馆': '展览馆',
  '图书馆': '图书馆',
  '纪念馆': '纪念馆',
  '纪念碑': '纪念碑',
  '广场': '广场',
  '公园': '公园',
  '动物园': '动物园',
  '植物园': '植物园',
  '海洋馆': '海洋馆',
  '水族馆': '水族馆',
  '教堂': '教堂',
  '清真寺': '清真寺',
  '佛寺': '佛寺',
  '道观': '道观',
  '寺庙': '寺庙',
  '观景台': '观景台',
  '观景塔': '观景塔',
  '电视塔': '电视塔',
  '摩天轮': '摩天轮',
  '塔': '塔',
  '楼': '楼',
  '阁': '阁',
  '殿': '殿',
  '宫': '宫',
  '寺': '寺',
  '庙': '庙',
  '观': '观',
  '堂': '堂',
  '院': '院',
  '园': '园',
  '陵': '陵',
  '墓': '墓',
  '城': '城',
  '门': '门',
  '桥': '桥',
  '钟楼': '钟楼',
  '鼓楼': '鼓楼',
  '角楼': '角楼',
  '牌楼': '牌楼',
  '牌坊': '牌坊',
  '车站': '车站',
  '机场': '机场',
  '码头': '码头',
  '港口': '港口',
  '中心': '中心',
  '大厦': '大厦',
  '大楼': '大楼',
  '购物中心': '购物中心',
  '步行街': '步行街',
  '商业街': '商业街'
};

// 确保输出目录存在
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

// 高德POI搜索API
const searchPOI = async (keywords, types, page = 1) => {
  try {
    const response = await axios.get('https://restapi.amap.com/v3/place/text', {
      params: {
        key: AMAP_KEY,
        keywords,
        types,
        city: CONFIG.city,
        children: 1,
        page,
        offset: CONFIG.pageSize,
        extensions: 'base'
      }
    });
    return response.data;
  } catch (error) {
    console.error('API请求失败:', error.message);
    return { status: '0', info: error.message };
  }
};

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 检查POI是否应该被过滤掉
const shouldFilterPOI = (poi) => {
  const combinedText = `${poi.name} ${poi.type || ''} ${poi.address || ''}`.toLowerCase();

  // 检查黑名单关键词
  for (const keyword of BLACKLIST_KEYWORDS) {
    if (combinedText.includes(keyword.toLowerCase())) {
      console.log(`      过滤(黑名单): ${poi.name} - 包含"${keyword}"`);
      return true;
    }
  }

  // 检查是否包含分号（复合类型），但要检查是否包含我们想要的类型
  if (poi.type && poi.type.includes(';')) {
    // 分割复合类型
    const types = poi.type.split(';').map(t => t.trim());

    // 检查是否包含我们想要的类型
    const hasValidType = types.some(type => {
      // 检查是否在白名单关键词中
      return WHITELIST_KEYWORDS.some(keyword => type.includes(keyword));
    });

    if (!hasValidType) {
      console.log(`      过滤(复合类型无效): ${poi.name} - 类型: ${poi.type}`);
      return true;
    }
  }

  // 检查名称是否过于简单（如单个字或无意义字符）
  if (poi.name.length < 2) {
    console.log(`      过滤(名称过短): ${poi.name}`);
    return true;
  }

  // 检查名称是否为纯数字
  if (/^\d+$/.test(poi.name)) {
    console.log(`      过滤(纯数字): ${poi.name}`);
    return true;
  }

  // 检查是否为道路名称（通常包含"路"、"街"、"道"等，但不是地标）
  if (/^(.*路|.*街|.*道|.*胡同|.*巷|.*弄|.*里|.*坊)$/.test(poi.name) &&
    !WHITELIST_KEYWORDS.some(keyword => poi.name.includes(keyword))) {
    console.log(`      过滤(道路名称): ${poi.name}`);
    return true;
  }

  return false;
};

// 检查POI是否为高质量地标
const isHighQualityLandmark = (poi) => {
  const combinedText = `${poi.name} ${poi.type || ''}`.toLowerCase();

  // 检查白名单关键词
  for (const keyword of WHITELIST_KEYWORDS) {
    if (combinedText.includes(keyword.toLowerCase())) {
      return true;
    }
  }

  return false;
};

// 推断地标类型
const inferLandmarkType = (poi) => {
  const combinedText = `${poi.name} ${poi.type || ''}`;

  for (const [keyword, type] of Object.entries(LANDMARK_TYPE_MAP)) {
    if (combinedText.includes(keyword)) {
      return type;
    }
  }

  // 默认类型
  return '地标';
};

// 生成描述
const generateDescription = (poi) => {
  const landmarkType = inferLandmarkType(poi);
  let description = poi.name;

  // 添加类型信息
  if (landmarkType !== '地标') {
    description += `是${CONFIG.city}著名的${landmarkType}`;
  } else {
    description += `是${CONFIG.city}的重要地标`;
  }

  // 添加位置信息
  if (poi.address && typeof poi.address === 'string') {
    // 提取区县信息
    const districtMatch = poi.address.match(/(北京|上海|天津|重庆)(市|)(东城|西城|朝阳|海淀|丰台|石景山|门头沟|房山|通州|顺义|昌平|大兴|怀柔|平谷|密云|延庆|黄浦|徐汇|长宁|静安|普陀|虹口|杨浦|浦东|闵行|宝山|嘉定|金山|松江|青浦|奉贤|崇明)(区|)/);
    if (districtMatch) {
      description += `，位于${districtMatch[1]}市${districtMatch[3]}区`;
    } else {
      description += `，位于${poi.address}`;
    }
  }

  return description;
};

// 主采集函数
const collectLandmarks = async () => {
  console.log(`开始采集${CONFIG.city}地标数据...`);
  console.log(`目标采集数量: ${CONFIG.targetCount}个`);

  const landmarks = [];
  const processedPoiIds = new Set();
  let totalProcessed = 0;
  let totalFiltered = 0;

  for (const typeConfig of CONFIG.types) {
    console.log(`正在采集类型: ${typeConfig.name}`);

    // 分割关键词
    const keywords = typeConfig.keywords.split(',');

    for (const keyword of keywords) {
      if (landmarks.length >= CONFIG.targetCount) break;

      const trimmedKeyword = keyword.trim();
      console.log(`  正在搜索关键词: ${trimmedKeyword}`);

      let page = 1;
      let hasMore = true;
      let totalCollected = 0;

      while (hasMore && landmarks.length < CONFIG.targetCount) {
        console.log(`    正在请求第 ${page} 页`);
        const result = await searchPOI(trimmedKeyword, typeConfig.types, page);

        console.log(`    API响应状态: ${result.status}`);
        if (result.status === '0') {
          console.log(`    API错误信息: ${result.info}`);
        }

        if (result.status === '1' && result.pois && result.pois.length > 0) {
          console.log(`    本页获取 ${result.pois.length} 个POI`);

          for (const poi of result.pois) {
            totalProcessed++;

            // 检查是否应该过滤
            if (shouldFilterPOI(poi)) {
              totalFiltered++;
              continue;
            }

            // 去重
            if (processedPoiIds.has(poi.id)) continue;
            processedPoiIds.add(poi.id);

            // 解析经纬度
            const location = poi.location ? poi.location.split(',') : [0, 0];

            // 检查经纬度是否有效
            if (location[0] === '0' || location[1] === '0' ||
              location[0] === '' || location[1] === '') {
              continue;
            }

            const landmark = {
              id: generateId(),
              name: poi.name,
              city: CONFIG.city,
              latitude: parseFloat(location[1]),
              longitude: parseFloat(location[0]),
              description: generateDescription(poi),
              created_at: new Date().toISOString(),
              checkin_radius: 100,
              amap_poi_id: poi.id
            };

            landmarks.push(landmark);
            totalCollected++;

            console.log(`      采集到: ${poi.name}`);

            // 达到目标数量
            if (landmarks.length >= CONFIG.targetCount) {
              hasMore = false;
              break;
            }
          }

          // 检查是否还有更多数据
          const totalCount = parseInt(result.count) || 0;
          if (page * CONFIG.pageSize >= totalCount) {
            hasMore = false;
          } else {
            page++;
          }

          console.log(`    累计采集 ${totalCollected} 个${trimmedKeyword}`);
          // 模拟延迟，避免API限流
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          hasMore = false;
        }
      }

      console.log(`  关键词"${trimmedKeyword}"采集完成，累计 ${totalCollected} 个`);
    }

    // 达到目标数量
    if (landmarks.length >= CONFIG.targetCount) {
      break;
    }
  }

  console.log(`采集完成，共处理 ${totalProcessed} 个POI，过滤 ${totalFiltered} 个，获取 ${landmarks.length} 个地标`);

  // 输出结果
  await outputResults(landmarks);
};

// 输出结果
const outputResults = async (landmarks) => {
  // 输出JSON
  const jsonPath = path.join(CONFIG.outputDir, 'landmarks.json');
  fs.writeFileSync(jsonPath, JSON.stringify(landmarks, null, 2));
  console.log(`JSON文件已保存: ${jsonPath}`);

  // 输出CSV
  const csvPath = path.join(CONFIG.outputDir, 'landmarks.csv');
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
  console.log(`CSV文件已保存: ${csvPath}`);

  // 输出SQL
  const sqlPath = path.join(CONFIG.outputDir, 'landmarks.sql');
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
  console.log(`SQL文件已保存: ${sqlPath}`);
};

// 运行采集
if (require.main === module) {
  collectLandmarks().catch(console.error);
}

module.exports = { collectLandmarks };