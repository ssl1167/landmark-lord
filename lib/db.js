const mysql = require("mysql2/promise")

const globalForMysql = globalThis
let mysqlPool = globalForMysql.__landmarkLordMysqlPool || null
let mysqlReady = globalForMysql.__landmarkLordMysqlReady || false

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

function buildMysqlConfig() {
  const common = {
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 5),
    queueLimit: 0,
    charset: "utf8mb4",
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT || 15000),
    multipleStatements: false,
    timezone: "+00:00",
  }

  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL)
    if (!['mysql:', 'mysql2:'].includes(url.protocol)) {
      throw new Error('DATABASE_URL 必须是 mysql:// 或 mysql2:// 开头；请不要在生产环境使用 file:./dev.db。')
    }
    return {
      ...common,
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password || ""),
      database: url.pathname.replace(/^\//, ""),
    }
  }

  if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
    return {
      ...common,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME,
    }
  }

  throw new Error("缺少数据库配置：请在 Vercel 环境变量中配置 DATABASE_URL，或配置 DB_HOST/DB_USER/DB_PASSWORD/DB_NAME。")
}

function getMysqlPool() {
  if (!mysqlPool) {
    mysqlPool = mysql.createPool(buildMysqlConfig())
    globalForMysql.__landmarkLordMysqlPool = mysqlPool
  }
  return mysqlPool
}

async function ensureColumn(tableName, columnName, alterSql) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(
    `
    SELECT COUNT(*) AS cnt
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
  `,
    [tableName, columnName]
  )
  const cnt = Number(rows?.[0]?.cnt || 0)
  if (cnt === 0) {
    await pool.query(alterSql)
  }
}

async function ensureIndex(tableName, indexName, createSql) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(
    `
    SELECT COUNT(*) AS cnt
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND INDEX_NAME = ?
  `,
    [tableName, indexName]
  )
  const cnt = Number(rows?.[0]?.cnt || 0)
  if (cnt === 0) {
    await pool.query(createSql)
  }
}

async function initMySQL() {
  if (mysqlReady) return

  try {
    const pool = getMysqlPool()
    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'user',
        status VARCHAR(32) NOT NULL DEFAULT 'active',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        username VARCHAR(64) NULL,
        avatar_url VARCHAR(512) NULL,
        UNIQUE KEY uk_users_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await ensureColumn("users", "username", "ALTER TABLE users ADD COLUMN username VARCHAR(64) NULL")
    await ensureColumn("users", "avatar_url", "ALTER TABLE users ADD COLUMN avatar_url VARCHAR(512) NULL")
    await ensureIndex("users", "uk_users_username", "CREATE UNIQUE INDEX uk_users_username ON users(username)")

    await pool.query(`
      CREATE TABLE IF NOT EXISTS landmarks (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        city VARCHAR(128) NOT NULL,
        latitude DECIMAL(10,7) NOT NULL,
        longitude DECIMAL(10,7) NOT NULL,
        description TEXT NOT NULL,
        checkin_radius INT NOT NULL DEFAULT 100,
        level TINYINT NOT NULL DEFAULT 1,
        guardian VARCHAR(64) NOT NULL DEFAULT '',
        influence_score INT NOT NULL DEFAULT 0,
        influence_progress INT NOT NULL DEFAULT 0,
        status VARCHAR(32) NOT NULL DEFAULT 'active',
        tags VARCHAR(255) NULL,
        amap_poi_id VARCHAR(64) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_landmarks_city (city),
        KEY idx_landmarks_status_level (status, level),
        KEY idx_landmarks_amap_poi_id (amap_poi_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await ensureColumn("landmarks", "updated_at", "ALTER TABLE landmarks ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")

    await pool.query(`
      CREATE TABLE IF NOT EXISTS checkin_records (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        landmark_id VARCHAR(64) NOT NULL,
        checkin_time DATETIME NOT NULL,
        duration INT NOT NULL DEFAULT 0,
        is_valid TINYINT(1) NOT NULL,
        distance_m INT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_checkin_user_time (user_id, checkin_time DESC),
        KEY idx_checkin_landmark_time (landmark_id, checkin_time DESC),
        KEY idx_checkin_user_landmark_time (user_id, landmark_id, checkin_time DESC),
        CONSTRAINT fk_checkin_user FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT fk_checkin_landmark FOREIGN KEY (landmark_id) REFERENCES landmarks(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await ensureColumn("checkin_records", "distance_m", "ALTER TABLE checkin_records ADD COLUMN distance_m INT NULL")

    await pool.query(`
      CREATE TABLE IF NOT EXISTS landmark_influence (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        landmark_id VARCHAR(64) NOT NULL,
        score INT NOT NULL DEFAULT 0,
        level INT NOT NULL DEFAULT 1,
        ranking INT NOT NULL DEFAULT 0,
        is_guardian TINYINT(1) NOT NULL DEFAULT 0,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_influence_user_landmark (user_id, landmark_id),
        KEY idx_influence_landmark_score (landmark_id, score DESC),
        KEY idx_influence_user (user_id),
        KEY idx_influence_guardian (landmark_id, is_guardian),
        CONSTRAINT fk_influence_user FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT fk_influence_landmark FOREIGN KEY (landmark_id) REFERENCES landmarks(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS landmark_ai_intro (
        id VARCHAR(64) PRIMARY KEY,
        landmark_id VARCHAR(64) NOT NULL,
        language VARCHAR(8) NOT NULL,
        intro_text TEXT NOT NULL,
        audio_url VARCHAR(512) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_ai_landmark_lang (landmark_id, language),
        CONSTRAINT fk_ai_landmark FOREIGN KEY (landmark_id) REFERENCES landmarks(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bottles (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        landmark_id VARCHAR(64) NOT NULL,
        content TEXT NOT NULL,
        image_url VARCHAR(512) NULL,
        visibility VARCHAR(32) NOT NULL DEFAULT 'public',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_bottles_landmark_time (landmark_id, created_at DESC),
        KEY idx_bottles_user_time (user_id, created_at DESC),
        CONSTRAINT fk_bottle_user FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT fk_bottle_landmark FOREIGN KEY (landmark_id) REFERENCES landmarks(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bottle_comments (
        id VARCHAR(64) PRIMARY KEY,
        bottle_id VARCHAR(64) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_bottle_comments_bottle_time (bottle_id, created_at DESC),
        KEY fk_bottle_comment_user (user_id),
        CONSTRAINT fk_bottle_comment_bottle FOREIGN KEY (bottle_id) REFERENCES bottles(id),
        CONSTRAINT fk_bottle_comment_user FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bottle_likes (
        bottle_id VARCHAR(64) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (bottle_id, user_id),
        KEY fk_bottle_like_user (user_id),
        CONSTRAINT fk_bottle_like_bottle FOREIGN KEY (bottle_id) REFERENCES bottles(id),
        CONSTRAINT fk_bottle_like_user FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)



    await pool.query(`
      CREATE TABLE IF NOT EXISTS friendships (
        user_id VARCHAR(64) NOT NULL,
        friend_id VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, friend_id),
        KEY idx_friendships_friend (friend_id, status),
        CONSTRAINT fk_friend_user FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT fk_friend_friend FOREIGN KEY (friend_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    mysqlReady = true
    globalForMysql.__landmarkLordMysqlReady = true
    console.log("MySQL数据库初始化成功")
  } catch (error) {
    console.error("MySQL数据库初始化失败:", error)
    throw error
  }
}

async function getMysqlConnection() {
  await initMySQL()
  return getMysqlPool().getConnection()
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
    const [rows] = await getMysqlPool().query(`
      SELECT id, name, city, latitude, longitude, description,
             created_at AS createdAt, checkin_radius AS checkinRadius,
             amap_poi_id AS amapPoiId, level, guardian,
             influence_score AS influenceScore, influence_progress AS influenceProgress,
             status, tags
      FROM landmarks
      ORDER BY level DESC, created_at DESC
    `)
    return rows.map(mapLandmarkRow)
  } catch (error) {
    console.error("查询地标失败:", error)
    throw error
  }
}

async function getLandmarkById(id) {
  try {
    await initMySQL()
    const [rows] = await getMysqlPool().query(
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
    throw error
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
    const [rows] = await getMysqlPool().query("SELECT * FROM users WHERE id = ?", [id])
    return rows[0] || null
  } catch (error) {
    console.error("查询用户失败:", error)
    throw error
  }
}

async function getUserByEmail(email) {
  try {
    await initMySQL()
    const [rows] = await getMysqlPool().query("SELECT * FROM users WHERE email = ? LIMIT 1", [email])
    if (!rows[0]) return null
    return { ...rows[0], avatarUrl: rows[0].avatar_url }
  } catch (error) {
    console.error("按邮箱查询用户失败:", error)
    throw error
  }
}

async function getUserByUsername(username) {
  try {
    await initMySQL()
    const [rows] = await getMysqlPool().query("SELECT * FROM users WHERE username = ? LIMIT 1", [username])
    return rows[0] || null
  } catch (error) {
    console.error("按用户名查询用户失败:", error)
    throw error
  }
}

async function updateUserProfile(userId, { username }) {
  try {
    await initMySQL()
    await getMysqlPool().query("UPDATE users SET username = ?, updated_at = NOW() WHERE id = ?", [username, userId])
    const [rows] = await getMysqlPool().query("SELECT id,email,username,avatar_url,role FROM users WHERE id = ? LIMIT 1", [
      userId,
    ])
    return rows[0] ? { ...rows[0], avatarUrl: rows[0].avatar_url } : null
  } catch (error) {
    console.error("更新用户资料失败:", error)
    throw error
  }
}

async function updateUserAvatar(userId, avatarUrl) {
  try {
    await initMySQL()
    await getMysqlPool().query("UPDATE users SET avatar_url = ?, updated_at = NOW() WHERE id = ?", [avatarUrl, userId])
    return true
  } catch (error) {
    console.error("更新头像失败:", error)
    throw error
  }
}

async function createUser({ email, username, passwordHash, role = "user" }) {
  try {
    const id = generateId()
    await initMySQL()
    await getMysqlPool().query(
      `
      INSERT INTO users (id, email, password_hash, role, status, created_at, updated_at, username, avatar_url)
      VALUES (?, ?, ?, ?, 'active', NOW(), NOW(), ?, NULL)
    `,
      [id, email, passwordHash, role, username]
    )
    return { id, email, username, avatarUrl: null, role, status: "active" }
  } catch (error) {
    console.error("创建用户失败:", error)
    throw error
  }
}

async function checkDuplicateCheckin(user_id, landmark_id) {
  try {
    await initMySQL()
    const [rows] = await getMysqlPool().query(
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
    throw error
  }
}

async function createCheckinRecord(user_id, landmark_id, duration, is_valid, distance = null) {
  try {
    const id = generateId()
    const time = nowISO().slice(0, 19).replace("T", " ")

    await initMySQL()
    await getMysqlPool().query(
      `
      INSERT INTO checkin_records (id, user_id, landmark_id, checkin_time, duration, is_valid, distance_m, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [id, user_id, landmark_id, time, duration, is_valid ? 1 : 0, distance, time]
    )
    return id
  } catch (error) {
    console.error("创建打卡记录失败:", error)
    throw error
  }
}

async function updateInfluenceScore(user_id, landmark_id, points) {
  try {
    await initMySQL()
    const [rows] = await getMysqlPool().query(
      "SELECT * FROM landmark_influence WHERE user_id = ? AND landmark_id = ? LIMIT 1",
      [user_id, landmark_id]
    )
    if (rows[0]) {
      const newScore = Number(rows[0].score) + points
      const newLevel = Math.floor(newScore / 1000) + 1
      await getMysqlPool().query(
        "UPDATE landmark_influence SET score = ?, level = ?, updated_at = NOW() WHERE id = ?",
        [newScore, newLevel, rows[0].id]
      )
      return { score: newScore, level: newLevel, added: points }
    }

    const id = generateId()
    const score = points
    const level = Math.floor(score / 1000) + 1
    await getMysqlPool().query(
      `
      INSERT INTO landmark_influence (id, user_id, landmark_id, score, level, ranking, is_guardian, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, 0, NOW())
    `,
      [id, user_id, landmark_id, score, level]
    )
    return { score, level, added: points }
  } catch (error) {
    console.error("更新影响力失败:", error)
    throw error
  }
}

async function updateGuardian(landmark_id) {
  try {
    await initMySQL()
    const [users] = await getMysqlPool().query(
      "SELECT user_id, score FROM landmark_influence WHERE landmark_id = ? ORDER BY score DESC",
      [landmark_id]
    )
    if (!users.length) return null

    await getMysqlPool().query(
      "UPDATE landmark_influence SET is_guardian = 0, ranking = 0 WHERE landmark_id = ?",
      [landmark_id]
    )
    for (let i = 0; i < users.length; i++) {
      await getMysqlPool().query(
        "UPDATE landmark_influence SET ranking = ?, is_guardian = ? WHERE user_id = ? AND landmark_id = ?",
        [i + 1, i === 0 ? 1 : 0, users[i].user_id, landmark_id]
      )
    }
    await getMysqlPool().query("UPDATE landmarks SET guardian = ? WHERE id = ?", [users[0].user_id, landmark_id])
    return users[0].user_id
  } catch (error) {
    console.error("更新守护者失败:", error)
    throw error
  }
}

async function getLandmarkAiIntro(landmark_id, language) {
  try {
    await initMySQL()
    const [rows] = await getMysqlPool().query(
      "SELECT intro_text FROM landmark_ai_intro WHERE landmark_id = ? AND language = ? LIMIT 1",
      [landmark_id, language]
    )
    return rows[0] || null
  } catch (error) {
    console.error("查询 AI 解说失败:", error)
    throw error
  }
}

async function saveLandmarkAiIntro(landmark_id, language, intro_text) {
  try {
    await initMySQL()
    const [rows] = await getMysqlPool().query(
      "SELECT id FROM landmark_ai_intro WHERE landmark_id = ? AND language = ? LIMIT 1",
      [landmark_id, language]
    )
    if (rows[0]) {
      await getMysqlPool().query(
        "UPDATE landmark_ai_intro SET intro_text = ?, updated_at = NOW() WHERE landmark_id = ? AND language = ?",
        [intro_text, landmark_id, language]
      )
    } else {
      await getMysqlPool().query(
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
    throw error
  }
}

module.exports = {
  getMysqlPool,
  getMysqlConnection,
  initMySQL,
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
