const mysql = require("mysql2/promise")

let mysqlPool = null
let mysqlReady = false

// 确保使用MySQL
function shouldUseMySQL() {
  return Boolean(process.env.DATABASE_URL || (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME))
}

function nowISO() {
  return new Date().toISOString()
}

function generateId() {
  return "id_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11)
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const R = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

async function initMySQL() {
  if (!shouldUseMySQL() || mysqlReady) return

  try {
    if (process.env.DATABASE_URL) {
      // 使用DATABASE_URL连接字符串
      mysqlPool = mysql.createPool(process.env.DATABASE_URL)
    } else {
      // 使用传统的连接参数
      mysqlPool = mysql.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME,
        connectionLimit: 8,
        waitForConnections: true,
        charset: "utf8mb4",
      })
    }

    // 测试连接
    const connection = await mysqlPool.getConnection()
    await connection.ping()
    connection.release()

    // 创建表结构
    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        username VARCHAR(64) NULL,
        avatar_url VARCHAR(512) NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'user',
        status VARCHAR(32) NOT NULL DEFAULT 'active',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS landmarks (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        city VARCHAR(128) NOT NULL,
        latitude DECIMAL(10,7) NOT NULL,
        longitude DECIMAL(10,7) NOT NULL,
        description TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        checkin_radius INT NOT NULL,
        level INT NOT NULL,
        guardian VARCHAR(128) NOT NULL,
        influence_score INT NOT NULL,
        influence_progress INT NOT NULL,
        status VARCHAR(32) NOT NULL,
        tags VARCHAR(255) NULL,
        amap_poi_id VARCHAR(64) NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS checkin_records (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        landmark_id VARCHAR(64) NOT NULL,
        checkin_time DATETIME NOT NULL,
        duration INT NOT NULL DEFAULT 0,
        is_valid TINYINT(1) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_checkin_user FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT fk_checkin_landmark FOREIGN KEY (landmark_id) REFERENCES landmarks(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS landmark_influence (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        landmark_id VARCHAR(64) NOT NULL,
        score INT NOT NULL DEFAULT 0,
        level INT NOT NULL DEFAULT 1,
        ranking INT NOT NULL DEFAULT 0,
        is_guardian TINYINT(1) NOT NULL DEFAULT 0,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_influence_user FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT fk_influence_landmark FOREIGN KEY (landmark_id) REFERENCES landmarks(id),
        CONSTRAINT uk_influence_user_landmark UNIQUE (user_id, landmark_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS landmark_ai_intro (
        id VARCHAR(64) PRIMARY KEY,
        landmark_id VARCHAR(64) NOT NULL,
        language VARCHAR(8) NOT NULL,
        intro_text TEXT NOT NULL,
        audio_url VARCHAR(512) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_ai_landmark FOREIGN KEY (landmark_id) REFERENCES landmarks(id),
        CONSTRAINT uk_ai_landmark_lang UNIQUE (landmark_id, language)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    // 添加必要的索引
    try {
      await mysqlPool.query("CREATE UNIQUE INDEX uk_users_username ON users(username)")
    } catch (error) {
      // 忽略索引已存在的错误
      if (!error.message.includes('Duplicate key name')) {
        throw error
      }
    }

    mysqlReady = true
    console.log("MySQL数据库初始化成功")
  } catch (error) {
    console.error("MySQL数据库初始化失败:", error)
    throw error
  }
}



function mapLandmarkRow(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    description: row.description,
    createdAt: row.createdAt || row.created_at,
    checkinRadius: Number(row.checkinRadius ?? row.checkin_radius),
    amapPoiId: row.amapPoiId ?? row.amap_poi_id,
    level: Number(row.level),
    guardian: row.guardian,
    influenceScore: Number(row.influenceScore ?? row.influence_score),
    influenceProgress: Number(row.influenceProgress ?? row.influence_progress),
    status: row.status,
    tags: row.tags,
  }
}

async function getAllLandmarks() {
  try {
    await initMySQL()
    const [rows] = await mysqlPool.query(`
      SELECT id, name, city, latitude, longitude, description,
             created_at AS createdAt, checkin_radius AS checkinRadius,
             amap_poi_id AS amapPoiId, level, guardian,
             influence_score AS influenceScore, influence_progress AS influenceProgress,
             status, tags
      FROM landmarks
    `)
    return rows.map(mapLandmarkRow)
  } catch (error) {
    console.error("查询地标失败:", error)
    throw error // 抛出错误，不使用兜底逻辑
  }
}

async function getLandmarkById(id) {
  try {
    await initMySQL()
    const [rows] = await mysqlPool.query(
      `
      SELECT id, name, city, latitude, longitude, description,
             created_at AS createdAt, checkin_radius AS checkinRadius,
             amap_poi_id AS amapPoiId, level, guardian,
             influence_score AS influenceScore, influence_progress AS influenceProgress,
             status, tags
      FROM landmarks
      WHERE id = ?
    `,
      [id]
    )
    return mapLandmarkRow(rows[0] || null)
  } catch (error) {
    console.error("按ID查询地标失败:", error)
    throw error // 抛出错误，不使用兜底逻辑
  }
}

async function getNearestLandmarks(lat, lng, limit = 10) {
  const landmarks = await getAllLandmarks()
  return landmarks
    .map((landmark) => ({
      ...landmark,
      distance: calculateDistance(lat, lng, landmark.latitude, landmark.longitude),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
}

async function getUserById(id) {
  try {
    await initMySQL()
    const [rows] = await mysqlPool.query("SELECT * FROM users WHERE id = ?", [id])
    return rows[0] || null
  } catch (error) {
    console.error("查询用户失败:", error)
    throw error // 抛出错误，不使用兜底逻辑
  }
}

async function getUserByEmail(email) {
  try {
    await initMySQL()
    const [rows] = await mysqlPool.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email])
    if (!rows[0]) return null
    return { ...rows[0], avatarUrl: rows[0].avatar_url }
  } catch (error) {
    console.error("按邮箱查询用户失败:", error)
    throw error // 抛出错误，不使用兜底逻辑
  }
}

async function getUserByUsername(username) {
  try {
    await initMySQL()
    const [rows] = await mysqlPool.query("SELECT * FROM users WHERE username = ? LIMIT 1", [username])
    return rows[0] || null
  } catch (error) {
    console.error("按用户名查询用户失败:", error)
    throw error // 抛出错误，不使用兜底逻辑
  }
}

async function updateUserProfile(userId, { username }) {
  try {
    await initMySQL()
    await mysqlPool.query("UPDATE users SET username = ?, updated_at = NOW() WHERE id = ?", [username, userId])
    const [rows] = await mysqlPool.query("SELECT id,email,username,avatar_url,role FROM users WHERE id = ? LIMIT 1", [
      userId,
    ])
    return rows[0] ? { ...rows[0], avatarUrl: rows[0].avatar_url } : null
  } catch (error) {
    console.error("更新用户资料失败:", error)
    throw error // 抛出错误，不使用兜底逻辑
  }
}

async function updateUserAvatar(userId, avatarUrl) {
  try {
    await initMySQL()
    await mysqlPool.query("UPDATE users SET avatar_url = ?, updated_at = NOW() WHERE id = ?", [avatarUrl, userId])
    return true
  } catch (error) {
    console.error("更新头像失败:", error)
    throw error // 抛出错误，不使用兜底逻辑
  }
}

async function createUser({ email, username, passwordHash, role = "user" }) {
  try {
    const id = generateId()
    await initMySQL()
    await mysqlPool.query(
      `
      INSERT INTO users (id, email, username, avatar_url, password_hash, role, status, created_at, updated_at)
      VALUES (?, ?, ?, NULL, ?, ?, 'active', NOW(), NOW())
    `,
      [id, email, username, passwordHash, role]
    )
    return { id, email, username, avatarUrl: null, role, status: "active" }
  } catch (error) {
    console.error("创建用户失败:", error)
    throw error // 抛出错误，不使用兜底逻辑
  }
}

async function checkDuplicateCheckin(user_id, landmark_id) {
  try {
    await initMySQL()
    const [rows] = await mysqlPool.query(
      `
      SELECT * FROM checkin_records
      WHERE user_id = ? AND landmark_id = ?
        AND checkin_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      LIMIT 1
    `,
      [user_id, landmark_id]
    )
    return rows[0] || null
  } catch (error) {
    console.error("检查重复打卡失败:", error)
    throw error // 抛出错误，不使用兜底逻辑
  }
}

async function createCheckinRecord(user_id, landmark_id, duration, is_valid) {
  try {
    const id = generateId()
    const time = nowISO().slice(0, 19).replace("T", " ")

    await initMySQL()
    await mysqlPool.query(
      `
      INSERT INTO checkin_records (id, user_id, landmark_id, checkin_time, duration, is_valid, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [id, user_id, landmark_id, time, duration, is_valid ? 1 : 0, time]
    )
    return id
  } catch (error) {
    console.error("创建打卡记录失败:", error)
    throw error // 抛出错误，不使用兜底逻辑
  }
}

async function updateInfluenceScore(user_id, landmark_id, points) {
  try {
    await initMySQL()
    const [rows] = await mysqlPool.query(
      "SELECT * FROM landmark_influence WHERE user_id = ? AND landmark_id = ? LIMIT 1",
      [user_id, landmark_id]
    )
    if (rows[0]) {
      const newScore = Number(rows[0].score) + points
      const newLevel = Math.floor(newScore / 1000) + 1
      await mysqlPool.query(
        "UPDATE landmark_influence SET score = ?, level = ?, updated_at = NOW() WHERE id = ?",
        [newScore, newLevel, rows[0].id]
      )
      return { score: newScore, level: newLevel }
    }

    const id = generateId()
    const score = points
    const level = Math.floor(score / 1000) + 1
    await mysqlPool.query(
      `
      INSERT INTO landmark_influence (id, user_id, landmark_id, score, level, ranking, is_guardian, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, 0, NOW())
    `,
      [id, user_id, landmark_id, score, level]
    )
    return { score, level }
  } catch (error) {
    console.error("更新影响力失败:", error)
    throw error // 抛出错误，不使用兜底逻辑
  }
}

async function updateGuardian(landmark_id) {
  try {
    await initMySQL()
    const [users] = await mysqlPool.query(
      "SELECT user_id, score FROM landmark_influence WHERE landmark_id = ? ORDER BY score DESC",
      [landmark_id]
    )
    if (!users.length) return null

    await mysqlPool.query(
      "UPDATE landmark_influence SET is_guardian = 0, ranking = 0 WHERE landmark_id = ?",
      [landmark_id]
    )
    for (let i = 0; i < users.length; i++) {
      await mysqlPool.query(
        "UPDATE landmark_influence SET ranking = ?, is_guardian = ? WHERE user_id = ? AND landmark_id = ?",
        [i + 1, i === 0 ? 1 : 0, users[i].user_id, landmark_id]
      )
    }
    await mysqlPool.query("UPDATE landmarks SET guardian = ? WHERE id = ?", [users[0].user_id, landmark_id])
    return users[0].user_id
  } catch (error) {
    console.error("更新守护者失败:", error)
    throw error // 抛出错误，不使用兜底逻辑
  }
}

async function getLandmarkAiIntro(landmark_id, language) {
  try {
    await initMySQL()
    const [rows] = await mysqlPool.query(
      "SELECT intro_text FROM landmark_ai_intro WHERE landmark_id = ? AND language = ? LIMIT 1",
      [landmark_id, language]
    )
    return rows[0] || null
  } catch (error) {
    console.error("查询 AI 解说失败:", error)
    throw error // 抛出错误，不使用兜底逻辑
  }
}

async function saveLandmarkAiIntro(landmark_id, language, intro_text) {
  try {
    await initMySQL()
    const [rows] = await mysqlPool.query(
      "SELECT id FROM landmark_ai_intro WHERE landmark_id = ? AND language = ? LIMIT 1",
      [landmark_id, language]
    )
    if (rows[0]) {
      await mysqlPool.query(
        "UPDATE landmark_ai_intro SET intro_text = ?, updated_at = NOW() WHERE landmark_id = ? AND language = ?",
        [intro_text, landmark_id, language]
      )
    } else {
      await mysqlPool.query(
        `
        INSERT INTO landmark_ai_intro (id, landmark_id, language, intro_text, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `,
        [generateId(), landmark_id, language, intro_text]
      )
    }
    return true
  } catch (error) {
    console.error("保存 AI 解说失败:", error)
    throw error // 抛出错误，不使用兜底逻辑
  }
}

module.exports = {
  getAllLandmarks,
  getLandmarkById,
  getNearestLandmarks,
  getUserById,
  getUserByEmail,
  getUserByUsername,
  createUser,
  updateUserProfile,
  updateUserAvatar,
  checkDuplicateCheckin,
  createCheckinRecord,
  updateInfluenceScore,
  updateGuardian,
  calculateDistance,
  getLandmarkAiIntro,
  saveLandmarkAiIntro,
}
