/**
 * 地图服务配置。
 * 这里默认按高德地图 WebJS + REST API 预留：
 * 1) NEXT_PUBLIC_AMAP_KEY: 前端 JS API Key
 * 2) AMAP_WEB_SERVICE_KEY: 后端 Web 服务 Key（如果你要做逆地理编码 / 周边搜索）
 *
 * 请把你自己的 key 填到 .env.local 中：
 * NEXT_PUBLIC_AMAP_KEY=你自己的高德前端key
 * AMAP_WEB_SERVICE_KEY=你自己的高德服务key
 */

export const MAP_VENDOR = 'amap'
export const AMAP_JS_URL = 'https://webapi.amap.com/maps?v=2.0'

export function getAmapJsUrl() {
  const key = process.env.NEXT_PUBLIC_AMAP_KEY
  return key ? `${AMAP_JS_URL}&key=${key}` : null
}
