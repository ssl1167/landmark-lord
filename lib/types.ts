export interface UserProfile {
  id: string
  username: string
  level: number
  exp: number
  nextLevelExp: number
  avatarInitials: string
  totalCheckins: number
  totalInfluence: number
  city: string
}

export interface Landmark {
  id: string
  name: string
  city: string
  latitude: number
  longitude: number
  radius: number
  createdAt: string
  level: 1 | 2 | 3
  guardian: string
  description: string
  influenceScore: number
  influenceProgress: number
  status: "active" | "maintenance"
  tags: string[]
}

export interface Bottle {
  id: string
  landmarkId: string
  author: string
  content: string
  likes: number
  comments: number
  hasImage?: boolean
  createdAt: string
}

export interface Task {
  id: number
  title: string
  description: string
  progress: number
  maxProgress: number
  reward: string
  rewardType: "exp" | "badge" | "item"
  category: "daily" | "weekly" | "achievement"
  status: "active" | "completed"
}

export interface RankingItem {
  userId: string
  username: string
  score: number
  rank: number
  isGuardian?: boolean
}

export interface FeedItem {
  id: string
  user: string
  action: string
  target: string
  createdAt: string
}

export interface MessageItem {
  id: string
  title: string
  content: string
  type: "system" | "task" | "social" | "reward"
  read: boolean
  time: string
}
