/**
 * Import `data/landmarks_cleaned.json` into MySQL `landmarks` table.
 *
 * Usage:
 *   node scripts/import-landmarks-mysql.js --reset --radius=100
 *
 * Notes:
 * - Reads DB config from `.env.local` / `.env` (DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME)
 * - Uses UPSERT by primary key `id`
 */

const fs = require("fs")
const path = require("path")
const dotenv = require("dotenv")
const mysql = require("mysql2/promise")

dotenv.config({ path: path.join(process.cwd(), ".env.local") })
dotenv.config({ path: path.join(process.cwd(), ".env") })

function arg(name) {
  const hit = process.argv.find((v) => v === `--${name}` || v.startsWith(`--${name}=`))
  if (!hit) return null
  if (hit === `--${name}`) return "true"
  return hit.split("=").slice(1).join("=") || ""
}

const RESET = arg("reset") === "true"
const RADIUS_OVERRIDE = arg("radius") ? Number(arg("radius")) : null

const DB_HOST = process.env.DB_HOST
const DB_PORT = Number(process.env.DB_PORT || 3306)
const DB_USER = process.env.DB_USER
const DB_PASSWORD = process.env.DB_PASSWORD || ""
const DB_NAME = process.env.DB_NAME

if (!DB_HOST || !DB_USER || !DB_NAME) {
  console.error("缺少 MySQL 配置：DB_HOST / DB_USER / DB_NAME（请在 .env.local 中配置）")
  process.exit(1)
}

const jsonPath = path.join(process.cwd(), "data", "landmarks_cleaned.json")
if (!fs.existsSync(jsonPath)) {
  console.error("未找到数据文件:", jsonPath)
  process.exit(1)
}

function clampInt(n, min, max) {
  const x = Number(n)
  if (!Number.isFinite(x)) return min
  return Math.min(max, Math.max(min, Math.floor(x)))
}

function deriveLevel(score) {
  const s = Number(score) || 0
  if (s >= 28) return 3
  if (s >= 22) return 2
  return 1
}

function deriveInfluenceScore(score) {
  const s = Number(score) || 0
  return clampInt(s * 100, 0, 999999999)
}

function deriveInfluenceProgress(score) {
  const s = Number(score) || 0
  return clampInt(s * 3, 0, 100)
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"))
  if (!Array.isArray(raw)) {
    throw new Error("landmarks_cleaned.json 必须是数组")
  }

  const pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    connectionLimit: 8,
    waitForConnections: true,
    charset: "utf8mb4",
  })

  const conn = await pool.getConnection()
  try {
    await conn.query("SET NAMES utf8mb4")

    if (RESET) {
      // 按依赖顺序清理（避免外键约束失败）
      await conn.query("SET FOREIGN_KEY_CHECKS=0")
      await conn.query("TRUNCATE TABLE landmark_ai_intro")
      await conn.query("TRUNCATE TABLE checkin_records")
      await conn.query("TRUNCATE TABLE landmark_influence")
      await conn.query("TRUNCATE TABLE landmarks")
      await conn.query("SET FOREIGN_KEY_CHECKS=1")
    }

    const sql = `
      INSERT INTO landmarks (
        id, name, city, latitude, longitude, description, created_at,
        checkin_radius, level, guardian, influence_score, influence_progress, status, tags, amap_poi_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name=VALUES(name),
        city=VALUES(city),
        latitude=VALUES(latitude),
        longitude=VALUES(longitude),
        description=VALUES(description),
        checkin_radius=VALUES(checkin_radius),
        level=VALUES(level),
        influence_score=VALUES(influence_score),
        influence_progress=VALUES(influence_progress),
        status=VALUES(status),
        tags=VALUES(tags),
        amap_poi_id=VALUES(amap_poi_id)
    `

    let okCount = 0
    for (const item of raw) {
      const id = String(item?.id || "").trim()
      const name = String(item?.name || "").trim()
      const city = String(item?.city || "北京").trim() || "北京"
      const latitude = Number(item?.latitude)
      const longitude = Number(item?.longitude)
      if (!id || !name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) continue

      const description = String(item?.description || "").trim() || name
      const createdAt = item?.created_at ? new Date(item.created_at) : new Date()
      const createdAtMysql = createdAt.toISOString().slice(0, 19).replace("T", " ")

      const checkinRadius = Number.isFinite(RADIUS_OVERRIDE)
        ? RADIUS_OVERRIDE
        : clampInt(item?.checkin_radius ?? 100, 1, 10000)

      const score = Number(item?.score) || 0
      const level = deriveLevel(score)
      const influenceScore = deriveInfluenceScore(score)
      const influenceProgress = deriveInfluenceProgress(score)

      const guardian = ""
      const status = "active"
      const tags = null
      const amapPoiId = item?.amap_poi_id ? String(item.amap_poi_id) : null

      await conn.execute(sql, [
        id,
        name,
        city,
        latitude,
        longitude,
        description,
        createdAtMysql,
        checkinRadius,
        level,
        guardian,
        influenceScore,
        influenceProgress,
        status,
        tags,
        amapPoiId,
      ])
      okCount++
    }

    const [rows] = await conn.query("SELECT COUNT(*) AS cnt FROM landmarks")
    const total = Number(rows?.[0]?.cnt || 0)
    console.log(`导入完成：本次写入/更新 ${okCount} 条，当前 landmarks 总数 ${total} 条。`)
  } finally {
    conn.release()
    await pool.end()
  }
}

main().catch((e) => {
  console.error("导入失败：", e)
  process.exit(1)
})

