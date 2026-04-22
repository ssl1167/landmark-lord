const Database = require("better-sqlite3")
const mysql = require("mysql2/promise")
const path = require("path")
const fs = require("fs")

const projectRoot = process.cwd()
const dbPath = path.join(projectRoot, "dev.db")

const useMySQL = Boolean(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME)
let mysqlPool = null
let mysqlReady = false
let sqliteDb = null

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
  if (!useMySQL || mysqlReady) return

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

  async function ensureColumn(tableName, columnName, alterSql) {
    const [rows] = await mysqlPool.query(
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
      await mysqlPool.query(alterSql)
    }
  }

  async function ensureUniqueIndex(tableName, indexName, createSql) {
    const [rows] = await mysqlPool.query(
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
      await mysqlPool.query(createSql)
    }
  }

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

  // upgrade existing schema (safe for older MySQL versions)
  await ensureColumn("users", "username", "ALTER TABLE users ADD COLUMN username VARCHAR(64) NULL")
  await ensureColumn("users", "avatar_url", "ALTER TABLE users ADD COLUMN avatar_url VARCHAR(512) NULL")
  await ensureUniqueIndex("users", "uk_users_username", "CREATE UNIQUE INDEX uk_users_username ON users(username)")
  await mysqlPool.query(`
    UPDATE users
    SET username = SUBSTRING_INDEX(email, '@', 1)
    WHERE (username IS NULL OR username = '')
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

  const [countRows] = await mysqlPool.query("SELECT COUNT(*) AS cnt FROM landmarks")
  const landmarkCount = Number(countRows?.[0]?.cnt || 0)
  if (landmarkCount === 0) {
    await mysqlPool.query(`
      INSERT INTO landmarks (
        id, name, city, latitude, longitude, description, created_at,
        checkin_radius, level, guardian, influence_score, influence_progress, status, tags, amap_poi_id
      ) VALUES
      ('beijing_001','故宫博物院','北京',39.916345,116.397155,'故宫博物院是北京著名的博物馆，位于北京市东城区景山前街4号',NOW(),100,3,'Explorer_Alex',2450,85,'active','博物馆,历史','B000A7J5J4'),
      ('beijing_002','天安门广场','北京',39.905527,116.397628,'天安门广场是北京著名的广场，位于北京市东城区东长安街',NOW(),150,2,'HistoryBuff',1890,62,'active','广场,历史','B000A7J5J5'),
      ('beijing_003','颐和园','北京',39.999912,116.275555,'颐和园是北京著名的公园，位于北京市海淀区新建宫门路19号',NOW(),200,2,'SeaLover',720,35,'active','公园,历史','B000A7J5J6'),
      ('beijing_004','天坛公园','北京',39.882222,116.406667,'天坛公园是北京著名的公园，位于北京市东城区天坛路甲1号',NOW(),150,1,'CityWalker',2100,78,'active','公园,历史','B000A7J5J7'),
      ('beijing_005','北海公园','北京',39.925000,116.388889,'北海公园是北京著名的公园，位于北京市西城区文津街1号',NOW(),150,1,'Pilgrim42',950,45,'active','公园,历史','B000A7J5J8'),
      ('beijing_006','中国传媒大学','北京',39.948700,116.481800,'中国传媒大学是中国著名的传媒类高等学府，位于北京市朝阳区定福庄东街1号',NOW(),200,2,'MediaStudent',1500,50,'active','教育,大学','B000A7J5J9')
    `)
  }

  mysqlReady = true
  console.log("MySQL 连接成功并完成表初始化")
}

function initSqlite() {
  if (sqliteDb) return sqliteDb
  console.log("项目根目录:", projectRoot)
  console.log("SQLite 路径:", dbPath)
  console.log("SQLite 文件是否存在:", fs.existsSync(dbPath))
  sqliteDb = new Database(dbPath)
  return sqliteDb
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
    if (useMySQL) {
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
    }

    const db = initSqlite()
    const stmt = db.prepare(`
      SELECT id, name, city, latitude, longitude, description,
             created_at AS createdAt, checkin_radius AS checkinRadius,
             amap_poi_id AS amapPoiId, level, guardian,
             influence_score AS influenceScore, influence_progress AS influenceProgress,
             status, tags
      FROM landmarks
    `)
    return stmt.all().map(mapLandmarkRow)
  } catch (error) {
    console.error("查询地标失败:", error)
    return []
  }
}

async function getLandmarkById(id) {
  try {
    if (useMySQL) {
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
    }

    const db = initSqlite()
    const stmt = db.prepare(`
      SELECT id, name, city, latitude, longitude, description,
             created_at AS createdAt, checkin_radius AS checkinRadius,
             amap_poi_id AS amapPoiId, level, guardian,
             influence_score AS influenceScore, influence_progress AS influenceProgress,
             status, tags
      FROM landmarks
      WHERE id = ?
    `)
    return mapLandmarkRow(stmt.get(id))
  } catch (error) {
    console.error("按ID查询地标失败:", error)
    return null
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
    if (useMySQL) {
      await initMySQL()
      const [rows] = await mysqlPool.query("SELECT * FROM users WHERE id = ?", [id])
      return rows[0] || null
    }
    const db = initSqlite()
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id)
  } catch (error) {
    console.error("查询用户失败:", error)
    return null
  }
}

async function getUserByEmail(email) {
  try {
    if (useMySQL) {
      await initMySQL()
      const [rows] = await mysqlPool.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email])
      if (!rows[0]) return null
      return { ...rows[0], avatarUrl: rows[0].avatar_url }
    }
    const db = initSqlite()
    return db.prepare("SELECT * FROM users WHERE email = ?").get(email)
  } catch (error) {
    console.error("按邮箱查询用户失败:", error)
    return null
  }
}

async function getUserByUsername(username) {
  try {
    if (useMySQL) {
      await initMySQL()
      const [rows] = await mysqlPool.query("SELECT * FROM users WHERE username = ? LIMIT 1", [username])
      return rows[0] || null
    }
    const db = initSqlite()
    return db.prepare("SELECT * FROM users WHERE username = ?").get(username)
  } catch (error) {
    console.error("按用户名查询用户失败:", error)
    return null
  }
}

async function updateUserProfile(userId, { username }) {
  try {
    if (useMySQL) {
      await initMySQL()
      await mysqlPool.query("UPDATE users SET username = ?, updated_at = NOW() WHERE id = ?", [username, userId])
      const [rows] = await mysqlPool.query("SELECT id,email,username,avatar_url,role FROM users WHERE id = ? LIMIT 1", [
        userId,
      ])
      return rows[0] ? { ...rows[0], avatarUrl: rows[0].avatar_url } : null
    }
    const db = initSqlite()
    db.prepare("UPDATE users SET username = ?, updated_at = ? WHERE id = ?").run(username, nowISO(), userId)
    return db.prepare("SELECT id,email,username,avatar_url,role FROM users WHERE id = ?").get(userId)
  } catch (error) {
    console.error("更新用户资料失败:", error)
    return null
  }
}

async function updateUserAvatar(userId, avatarUrl) {
  try {
    if (useMySQL) {
      await initMySQL()
      await mysqlPool.query("UPDATE users SET avatar_url = ?, updated_at = NOW() WHERE id = ?", [avatarUrl, userId])
      return true
    }
    const db = initSqlite()
    db.prepare("UPDATE users SET avatar_url = ?, updated_at = ? WHERE id = ?").run(avatarUrl, nowISO(), userId)
    return true
  } catch (error) {
    console.error("更新头像失败:", error)
    return false
  }
}

async function createUser({ email, username, passwordHash, role = "user" }) {
  try {
    const id = generateId()
    if (useMySQL) {
      await initMySQL()
      await mysqlPool.query(
        `
        INSERT INTO users (id, email, username, avatar_url, password_hash, role, status, created_at, updated_at)
        VALUES (?, ?, ?, NULL, ?, ?, 'active', NOW(), NOW())
      `,
        [id, email, username, passwordHash, role]
      )
      return { id, email, username, avatarUrl: null, role, status: "active" }
    }
    const db = initSqlite()
    db.prepare(`
      INSERT INTO users (id, email, username, avatar_url, password_hash, role, status, created_at, updated_at)
      VALUES (?, ?, ?, NULL, ?, ?, 'active', ?, ?)
    `).run(id, email, username, passwordHash, role, nowISO(), nowISO())
    return { id, email, username, avatarUrl: null, role, status: "active" }
  } catch (error) {
    console.error("创建用户失败:", error)
    return null
  }
}

async function checkDuplicateCheckin(user_id, landmark_id) {
  try {
    if (useMySQL) {
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
    }

    const db = initSqlite()
    return db
      .prepare(`
        SELECT * FROM checkin_records
        WHERE user_id = ? AND landmark_id = ?
          AND checkin_time >= datetime('now', '-24 hours')
      `)
      .get(user_id, landmark_id)
  } catch (error) {
    console.error("检查重复打卡失败:", error)
    return null
  }
}

async function createCheckinRecord(user_id, landmark_id, duration, is_valid) {
  try {
    const id = generateId()
    const time = nowISO().slice(0, 19).replace("T", " ")

    if (useMySQL) {
      await initMySQL()
      await mysqlPool.query(
        `
        INSERT INTO checkin_records (id, user_id, landmark_id, checkin_time, duration, is_valid, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        [id, user_id, landmark_id, time, duration, is_valid ? 1 : 0, time]
      )
      return id
    }

    const db = initSqlite()
    db.prepare(`
      INSERT INTO checkin_records (id, user_id, landmark_id, checkin_time, duration, is_valid, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, user_id, landmark_id, nowISO(), duration, is_valid ? 1 : 0, nowISO())
    return id
  } catch (error) {
    console.error("创建打卡记录失败:", error)
    return null
  }
}

async function updateInfluenceScore(user_id, landmark_id, points) {
  try {
    if (useMySQL) {
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
    }

    const db = initSqlite()
    const existing = db
      .prepare("SELECT * FROM landmark_influence WHERE user_id = ? AND landmark_id = ?")
      .get(user_id, landmark_id)
    if (existing) {
      const newScore = existing.score + points
      const newLevel = Math.floor(newScore / 1000) + 1
      db.prepare("UPDATE landmark_influence SET score = ?, level = ?, updated_at = ? WHERE id = ?").run(
        newScore,
        newLevel,
        nowISO(),
        existing.id
      )
      return { score: newScore, level: newLevel }
    }
    const id = generateId()
    const score = points
    const level = Math.floor(score / 1000) + 1
    db.prepare(`
      INSERT INTO landmark_influence (id, user_id, landmark_id, score, level, ranking, is_guardian, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, 0, ?)
    `).run(id, user_id, landmark_id, score, level, nowISO())
    return { score, level }
  } catch (error) {
    console.error("更新影响力失败:", error)
    return null
  }
}

async function updateGuardian(landmark_id) {
  try {
    if (useMySQL) {
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
    }

    const db = initSqlite()
    const users = db
      .prepare("SELECT user_id, score FROM landmark_influence WHERE landmark_id = ? ORDER BY score DESC")
      .all(landmark_id)
    if (!users.length) return null
    db.prepare("UPDATE landmark_influence SET is_guardian = 0, ranking = 0 WHERE landmark_id = ?").run(landmark_id)
    users.forEach((user, index) => {
      db.prepare(
        "UPDATE landmark_influence SET ranking = ?, is_guardian = ? WHERE user_id = ? AND landmark_id = ?"
      ).run(index + 1, index === 0 ? 1 : 0, user.user_id, landmark_id)
    })
    db.prepare("UPDATE landmarks SET guardian = ? WHERE id = ?").run(users[0].user_id, landmark_id)
    return users[0].user_id
  } catch (error) {
    console.error("更新守护者失败:", error)
    return null
  }
}

async function getLandmarkAiIntro(landmark_id, language) {
  try {
    if (useMySQL) {
      await initMySQL()
      const [rows] = await mysqlPool.query(
        "SELECT intro_text FROM landmark_ai_intro WHERE landmark_id = ? AND language = ? LIMIT 1",
        [landmark_id, language]
      )
      return rows[0] || null
    }
    const db = initSqlite()
    return db
      .prepare("SELECT intro_text FROM landmark_ai_intro WHERE landmark_id = ? AND language = ?")
      .get(landmark_id, language)
  } catch (error) {
    console.error("查询 AI 解说失败:", error)
    return null
  }
}

async function saveLandmarkAiIntro(landmark_id, language, intro_text) {
  try {
    if (useMySQL) {
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
    }

    const db = initSqlite()
    const existing = db
      .prepare("SELECT id FROM landmark_ai_intro WHERE landmark_id = ? AND language = ?")
      .get(landmark_id, language)
    if (existing) {
      db.prepare(
        "UPDATE landmark_ai_intro SET intro_text = ?, updated_at = ? WHERE landmark_id = ? AND language = ?"
      ).run(intro_text, nowISO(), landmark_id, language)
    } else {
      db.prepare(
        "INSERT INTO landmark_ai_intro (id, landmark_id, language, intro_text, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(generateId(), landmark_id, language, intro_text, nowISO(), nowISO())
    }
    return true
  } catch (error) {
    console.error("保存 AI 解说失败:", error)
    return false
  }
}

module.exports = {
  db: sqliteDb,
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
