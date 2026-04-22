import type { Bottle, FeedItem, Landmark, MessageItem, RankingItem, Task, UserProfile } from './types'

export const currentUser: UserProfile = {
  id: 'u-1',
  username: 'Explorer_Alex',
  level: 24,
  exp: 2450,
  nextLevelExp: 3000,
  avatarInitials: 'LL',
  totalCheckins: 156,
  totalInfluence: 2450,
  city: '胡志明市',
}

export const landmarks: Landmark[] = [
  {
    id: '1',
    name: '中央车站',
    city: '胡志明市',
    latitude: 10.7769,
    longitude: 106.7009,
    radius: 120,
    createdAt: '2026-01-05T08:00:00+08:00',
    level: 3,
    guardian: 'Explorer_Alex',
    description: '建于1892年的历史铁路枢纽，是城市探索任务的热门起点。',
    influenceScore: 2450,
    influenceProgress: 85,
    status: 'active',
    tags: ['历史', '交通', '热门'],
  },
  {
    id: '2',
    name: '城市博物馆',
    city: '胡志明市',
    latitude: 10.7804,
    longitude: 106.6992,
    radius: 100,
    createdAt: '2026-01-10T09:30:00+08:00',
    level: 2,
    guardian: 'HistoryBuff',
    description: '收藏古代文物与现代艺术，适合历史类任务与文化解说。',
    influenceScore: 1890,
    influenceProgress: 62,
    status: 'active',
    tags: ['博物馆', '文化'],
  },
  {
    id: '3',
    name: '海港观景台',
    city: '胡志明市',
    latitude: 10.7697,
    longitude: 106.7063,
    radius: 150,
    createdAt: '2026-01-15T17:45:00+08:00',
    level: 1,
    guardian: 'SeaLover',
    description: '俯瞰海湾的绝佳点位，适合日落打卡与漂流瓶互动。',
    influenceScore: 720,
    influenceProgress: 35,
    status: 'active',
    tags: ['观景', '日落'],
  },
  {
    id: '4',
    name: '胜利广场',
    city: '胡志明市',
    latitude: 10.7741,
    longitude: 106.6949,
    radius: 120,
    createdAt: '2026-02-01T14:20:00+08:00',
    level: 2,
    guardian: 'CityWalker',
    description: '纪念历史胜利的城市中心广场，适合活动与任务触发。',
    influenceScore: 2100,
    influenceProgress: 78,
    status: 'active',
    tags: ['广场', '任务'],
  },
  {
    id: '5',
    name: '古老教堂',
    city: '胡志明市',
    latitude: 10.7798,
    longitude: 106.6991,
    radius: 120,
    createdAt: '2026-02-10T11:15:00+08:00',
    level: 1,
    guardian: 'Pilgrim42',
    description: '15世纪风格的地标建筑，适合文化地标探索。',
    influenceScore: 950,
    influenceProgress: 45,
    status: 'active',
    tags: ['建筑', '宗教'],
  },
  {
    id: '6',
    name: '科技中心',
    city: '胡志明市',
    latitude: 10.7825,
    longitude: 106.7083,
    radius: 90,
    createdAt: '2026-03-01T16:40:00+08:00',
    level: 3,
    guardian: 'TechNomad',
    description: '城市创新中心，可触发科技主题探索任务。',
    influenceScore: 3200,
    influenceProgress: 92,
    status: 'active',
    tags: ['科技', '创新'],
  },
]

export const bottles: Bottle[] = [
  { id: 'b1', landmarkId: '1', author: 'SunsetChaser', content: '这里的日落景色是全城最美的！推荐傍晚6点来。', likes: 24, comments: 5, hasImage: true, createdAt: '2026-03-30T10:20:00+08:00' },
  { id: 'b2', landmarkId: '1', author: 'CoffeeLover', content: '隔壁的咖啡店很适合休息，适合任务路线中的中转站。', likes: 18, comments: 3, createdAt: '2026-03-30T15:20:00+08:00' },
  { id: 'b3', landmarkId: '3', author: 'SecretFinder', content: '主建筑后面有个隐藏花园，值得一去。', likes: 42, comments: 12, hasImage: true, createdAt: '2026-03-29T15:20:00+08:00' },
]

export const tasks: Task[] = [
  { id: 1, title: '探索历史遗迹', description: '访问3个历史类地标', progress: 2, maxProgress: 3, reward: '150 经验', rewardType: 'exp', category: 'daily', status: 'active' },
  { id: 2, title: '签到连续7天', description: '保持连续签到记录', progress: 5, maxProgress: 7, reward: '皇冠徽章', rewardType: 'badge', category: 'weekly', status: 'active' },
  { id: 3, title: '投递漂流瓶', description: '在地标留下5个漂流瓶', progress: 5, maxProgress: 5, reward: '50 经验', rewardType: 'exp', category: 'achievement', status: 'completed' },
]

export const ranking: RankingItem[] = [
  { userId: 'u-1', username: 'Explorer_Alex', score: 2450, rank: 1, isGuardian: true },
  { userId: 'u-2', username: 'HistoryBuff', score: 2280, rank: 2 },
  { userId: 'u-3', username: 'CityWalker', score: 2100, rank: 3 },
  { userId: 'u-4', username: 'SeaLover', score: 1790, rank: 4 },
]

export const feed: FeedItem[] = [
  { id: 'f1', user: 'HistoryBuff', action: '完成了任务', target: '探索历史遗迹', createdAt: '2小时前' },
  { id: 'f2', user: 'Explorer_Alex', action: '成功守护', target: '中央车站', createdAt: '5小时前' },
  { id: 'f3', user: 'SeaLover', action: '发布了漂流瓶', target: '海港观景台', createdAt: '昨天' },
]

export const messages: MessageItem[] = [
  { id: 'm1', title: '打卡成功', content: '你在中央车站的打卡已被系统记录，影响力 +50。', type: 'system', read: false, time: '刚刚' },
  { id: 'm2', title: '任务进度更新', content: '探索历史遗迹任务已完成 2/3。', type: 'task', read: false, time: '10分钟前' },
  { id: 'm3', title: '好友互动', content: 'HistoryBuff 点赞了你的漂流瓶。', type: 'social', read: true, time: '2小时前' },
]

export function findLandmark(id: string) {
  return landmarks.find((item) => item.id === id)
}

export function calcDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const R = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}
