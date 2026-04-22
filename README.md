# 地标探索应用

一个基于Next.js和MySQL的地标探索应用，用户可以发现附近的地标、投递漂流瓶、查看AI解说等功能。

## 技术栈

- **前端**：Next.js 16.2.0, React 19.2.4, TypeScript, Tailwind CSS
- **后端**：Node.js, Express风格API, MySQL2
- **数据库**：MySQL, SQLite (备用)
- **认证**：JWT
- **UI组件**：Radix UI, Lucide React

## 功能特性

- 📍 **地标探索**：发现附近的地标，查看详细信息
- 🏆 **影响力系统**：用户可以通过打卡、投递漂流瓶等行为提升对地标影响力
- 📝 **漂流瓶**：在地标处投递和查看漂流瓶，分享独特发现
- 🤖 **AI解说**：获取地标的AI智能解说，支持多语言
- 👥 **社交功能**：查看好友列表，互动交流
- 📊 **个人中心**：管理个人信息，查看成就和统计数据

## 快速开始

### 环境要求

- Node.js 18+
- MySQL 5.7+
- npm 9+

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd <project-directory>
```

2. **安装依赖**

```bash
npm install
```

3. **配置环境变量**

复制 `.env.local.example` 文件为 `.env.local`，并填写相应的配置信息：

```env
# MySQL 配置
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=landmarks

# JWT 配置
JWT_SECRET=your-secret-key
```

4. **初始化数据库**

- 创建名为 `landmarks` 的数据库
- 导入 `Dump20260421` 中的数据库文件

5. **启动开发服务器**

```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动。

## 项目结构

```
.
├── app/               # Next.js App Router
│   ├── api/           # API 接口
│   ├── page.tsx       # 首页
│   └── layout.tsx     # 布局
├── components/        # React 组件
│   └── landmark-lord/ # 地标相关组件
├── lib/               # 工具函数
│   ├── db.js          # 数据库连接
│   └── auth.ts        # 认证相关
├── public/            # 静态资源
├── scripts/           # 脚本文件
├── .env.local         # 环境变量
└── package.json       # 项目配置
```

## API 接口

### 地标相关

- `GET /api/landmarks/nearby` - 获取附近地标
- `GET /api/landmarks/:id` - 获取地标详情
- `GET /api/landmarks/:id/ai-intro` - 获取地标AI解说

### 漂流瓶相关

- `GET /api/bottles` - 获取漂流瓶列表
- `POST /api/bottles` - 创建漂流瓶
- `GET /api/bottles/:id/comments` - 获取漂流瓶评论
- `POST /api/bottles/:id/comments` - 发表漂流瓶评论

### 用户相关

- `GET /api/users/me` - 获取当前用户信息
- `PUT /api/users/me` - 更新用户信息
- `POST /api/users/me/avatar` - 上传用户头像
- `GET /api/users/me/landmarks` - 获取用户的地标
- `GET /api/users/me/bottles` - 获取用户的漂流瓶历史
- `GET /api/users/me/friends` - 获取用户的好友列表

### 打卡相关

- `POST /api/checkins` - 打卡地标

## 数据库表结构

### landmarks
- `id` - 地标ID
- `name` - 地标名称
- `city` - 城市
- `latitude` - 纬度
- `longitude` - 经度
- `radius` - 打卡半径
- `description` - 描述
- `created_at` - 创建时间

### landmark_influence
- `id` - 记录ID
- `landmark_id` - 地标ID
- `user_id` - 用户ID
- `score` - 影响力分数
- `level` - 影响力等级
- `is_guardian` - 是否为守护者

### bottles
- `id` - 漂流瓶ID
- `user_id` - 用户ID
- `landmark_id` - 地标ID
- `content` - 内容
- `image_url` - 图片URL
- `visibility` - 可见性
- `created_at` - 创建时间

### bottle_comments
- `id` - 评论ID
- `bottle_id` - 漂流瓶ID
- `user_id` - 用户ID
- `content` - 评论内容
- `created_at` - 创建时间

### users
- `id` - 用户ID
- `username` - 用户名
- `email` - 邮箱
- `password` - 密码（加密）
- `avatar_url` - 头像URL
- `created_at` - 创建时间

### friendships
- `id` - 关系ID
- `user_id` - 用户ID
- `friend_id` - 好友ID
- `status` - 关系状态
- `created_at` - 创建时间




