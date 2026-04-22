const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  await prisma.landmark.deleteMany()

  await prisma.landmark.createMany({
    data: [
      {
        id: '1',
        name: '中央车站',
        city: '胡志明市',
        latitude: 10.7769,
        longitude: 106.7009,
        description: '建于1892年的历史铁路枢纽，是城市探索任务的热门起点。',
        createdAt: new Date('2026-01-05T08:00:00+08:00'),
        checkinRadius: 120,
        level: 3,
        guardian: 'Explorer_Alex',
        influenceScore: 2450,
        influenceProgress: 85,
        status: 'active',
        tags: '历史,交通,热门',
      },
      {
        id: '2',
        name: '城市博物馆',
        city: '胡志明市',
        latitude: 10.7804,
        longitude: 106.6992,
        description: '收藏古代文物与现代艺术，适合历史类任务与文化解说。',
        createdAt: new Date('2026-01-10T09:30:00+08:00'),
        checkinRadius: 100,
        level: 2,
        guardian: 'HistoryBuff',
        influenceScore: 1890,
        influenceProgress: 62,
        status: 'active',
        tags: '博物馆,文化',
      },
      {
        id: '3',
        name: '海港观景台',
        city: '胡志明市',
        latitude: 10.7697,
        longitude: 106.7063,
        description: '俯瞰海湾的绝佳点位，适合日落打卡与漂流瓶互动。',
        createdAt: new Date('2026-01-15T17:45:00+08:00'),
        checkinRadius: 150,
        level: 1,
        guardian: 'SeaLover',
        influenceScore: 720,
        influenceProgress: 35,
        status: 'active',
        tags: '观景,日落',
      },
      {
        id: '4',
        name: '胜利广场',
        city: '胡志明市',
        latitude: 10.7741,
        longitude: 106.6949,
        description: '纪念历史胜利的城市中心广场，适合活动与任务触发。',
        createdAt: new Date('2026-02-01T14:20:00+08:00'),
        checkinRadius: 120,
        level: 2,
        guardian: 'CityWalker',
        influenceScore: 2100,
        influenceProgress: 78,
        status: 'active',
        tags: '广场,任务',
      },
      {
        id: '5',
        name: '古老教堂',
        city: '胡志明市',
        latitude: 10.7798,
        longitude: 106.6991,
        description: '15世纪风格的地标建筑，适合文化地标探索。',
        createdAt: new Date('2026-02-10T11:15:00+08:00'),
        checkinRadius: 120,
        level: 1,
        guardian: 'Pilgrim42',
        influenceScore: 950,
        influenceProgress: 45,
        status: 'active',
        tags: '建筑,宗教',
      },
      {
        id: '6',
        name: '科技中心',
        city: '胡志明市',
        latitude: 10.7825,
        longitude: 106.7083,
        description: '城市创新中心，可触发科技主题探索任务。',
        createdAt: new Date('2026-03-01T16:40:00+08:00'),
        checkinRadius: 90,
        level: 3,
        guardian: 'TechNomad',
        influenceScore: 3200,
        influenceProgress: 92,
        status: 'active',
        tags: '科技,创新',
      },
    ],
    skipDuplicates: true,
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

