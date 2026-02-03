/**
 * Prisma Database Seed Script
 * Creates initial test data for development
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Create test user
  const hashedPassword = await bcrypt.hash('Test1234!', 12);

  const user = await prisma.user.upsert({
    where: { email: 'test@mpikarakara.com' },
    update: {},
    create: {
      email: 'test@mpikarakara.com',
      password: hashedPassword,
      firstName: 'Jean',
      lastName: 'Dupont',
      profile: {
        create: {
          sleepHours: 8,
          wakeUpTime: '07:00',
          bedTime: '23:00',
          energyPeakTime: 'morning',
          preferredLanguage: 'fr',
          timezone: 'Europe/Paris',
          notificationsEnabled: true,
          reminderMinutes: 30,
          pauseReminders: true,
        },
      },
    },
  });

  console.log(`✓ Created user: ${user.email}`);

  // Create sample tasks
  const tasks = [
    {
      title: 'Préparer la présentation projet',
      description: 'Finaliser les slides pour la réunion de lundi',
      category: 'WORK',
      priority: 'HIGH',
      duration: 120,
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    },
    {
      title: 'Réviser le chapitre 5',
      description: 'Chapitre sur les algorithmes de tri',
      category: 'STUDY',
      priority: 'MEDIUM',
      duration: 90,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
    },
    {
      title: 'Course au supermarché',
      description: 'Acheter fruits, légumes et produits ménagers',
      category: 'HOUSEHOLD',
      priority: 'LOW',
      duration: 45,
    },
    {
      title: 'Séance de sport',
      description: '30 min cardio + 30 min musculation',
      category: 'SPORT',
      priority: 'MEDIUM',
      duration: 60,
      recurring: true,
      recurrence: 'DAILY',
    },
    {
      title: 'Appeler maman',
      description: 'Prendre des nouvelles',
      category: 'SOCIAL',
      priority: 'MEDIUM',
      duration: 30,
    },
    {
      title: 'Méditation du matin',
      description: '15 minutes de pleine conscience',
      category: 'REST',
      priority: 'LOW',
      duration: 15,
      recurring: true,
      recurrence: 'DAILY',
    },
    {
      title: 'Lire un chapitre de roman',
      description: 'Continuer "Le Petit Prince"',
      category: 'LEISURE',
      priority: 'LOW',
      duration: 30,
    },
    {
      title: 'Rapport mensuel urgent',
      description: 'Compléter et envoyer avant midi',
      category: 'WORK',
      priority: 'URGENT',
      duration: 90,
      deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
    },
  ];

  for (const taskData of tasks) {
    await prisma.task.create({
      data: {
        userId: user.id,
        ...taskData,
      },
    });
  }

  console.log(`✓ Created ${tasks.length} sample tasks`);

  // Create today's schedule
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const schedule = await prisma.schedule.create({
    data: {
      userId: user.id,
      date: today,
      optimized: true,
      mentalLoadScore: 5.5,
      items: {
        create: [
          {
            title: 'Méditation du matin',
            type: 'TASK',
            startTime: new Date(today.getTime() + 7 * 60 * 60 * 1000), // 7:00
            endTime: new Date(today.getTime() + 7.25 * 60 * 60 * 1000), // 7:15
          },
          {
            title: 'Rapport mensuel urgent',
            type: 'TASK',
            startTime: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8:00
            endTime: new Date(today.getTime() + 9.5 * 60 * 60 * 1000), // 9:30
          },
          {
            title: 'Pause',
            type: 'BREAK',
            startTime: new Date(today.getTime() + 9.5 * 60 * 60 * 1000), // 9:30
            endTime: new Date(today.getTime() + 9.75 * 60 * 60 * 1000), // 9:45
          },
          {
            title: 'Préparer la présentation',
            type: 'TASK',
            startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10:00
            endTime: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12:00
          },
          {
            title: 'Pause déjeuner',
            type: 'LUNCH',
            startTime: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12:00
            endTime: new Date(today.getTime() + 13 * 60 * 60 * 1000), // 13:00
          },
          {
            title: 'Réviser le chapitre 5',
            type: 'TASK',
            startTime: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 14:00
            endTime: new Date(today.getTime() + 15.5 * 60 * 60 * 1000), // 15:30
          },
          {
            title: 'Pause',
            type: 'BREAK',
            startTime: new Date(today.getTime() + 15.5 * 60 * 60 * 1000), // 15:30
            endTime: new Date(today.getTime() + 15.75 * 60 * 60 * 1000), // 15:45
          },
          {
            title: 'Séance de sport',
            type: 'TASK',
            startTime: new Date(today.getTime() + 17 * 60 * 60 * 1000), // 17:00
            endTime: new Date(today.getTime() + 18 * 60 * 60 * 1000), // 18:00
          },
          {
            title: 'Lire un chapitre de roman',
            type: 'TASK',
            startTime: new Date(today.getTime() + 20 * 60 * 60 * 1000), // 20:00
            endTime: new Date(today.getTime() + 20.5 * 60 * 60 * 1000), // 20:30
          },
        ],
      },
    },
  });

  console.log(`✓ Created sample schedule for today`);

  // Create sample analytics
  const analyticsData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    analyticsData.push({
      userId: user.id,
      date,
      tasksPlanned: Math.floor(Math.random() * 5) + 3,
      tasksCompleted: Math.floor(Math.random() * 4) + 1,
      workTime: Math.floor(Math.random() * 180) + 120,
      studyTime: Math.floor(Math.random() * 120) + 30,
      leisureTime: Math.floor(Math.random() * 60) + 30,
      sportTime: Math.floor(Math.random() * 60),
      socialTime: Math.floor(Math.random() * 60),
      restTime: Math.floor(Math.random() * 60) + 60,
      productivityScore: Math.random() * 30 + 60,
      mentalLoadScore: Math.random() * 4 + 3,
      balanceScore: Math.random() * 30 + 60,
    });
  }

  for (const data of analyticsData) {
    await prisma.analytics.upsert({
      where: {
        userId_date: {
          userId: data.userId,
          date: data.date,
        },
      },
      update: data,
      create: data,
    });
  }

  console.log(`✓ Created analytics for the last 7 days`);

  console.log('\n✅ Database seed completed successfully!\n');
  console.log('📧 Test account credentials:');
  console.log('   Email:    test@mpikarakara.com');
  console.log('   Password: Test1234!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
