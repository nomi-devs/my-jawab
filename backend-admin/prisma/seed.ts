import 'dotenv/config';
import { PrismaClient, UserRole, AuthType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import {
  POINTS_VALUES,
  POINTS_SETTING_GROUP,
  pointsSettingKey,
} from '../src/modules/points/points.constants';

const adapter = new PrismaPg(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

const HASH_ROUNDS = 10;

const users = [
  {
    username: 'admin',
    email: 'admin@jawab.com',
    password: 'Admin@123',
    role: UserRole.admin,
    profile: {
      full_name: 'Super Admin',
      tagline: 'Platform Administrator',
    },
  },
  {
    username: 'sub_admin',
    email: 'subadmin@jawab.com',
    password: 'SubAdmin@123',
    role: UserRole.sub_admin,
    profile: {
      full_name: 'Sub Administrator',
      tagline: 'Content Moderator',
    },
  },
  {
    username: 'pro_user',
    email: 'prouser@jawab.com',
    password: 'ProUser@123',
    role: UserRole.pro_user,
    profile: {
      full_name: 'Pro User',
      tagline: 'Premium Member',
      profile_bio: 'I am a pro user with access to premium features.',
    },
  },
  {
    username: 'regular_user',
    email: 'user@jawab.com',
    password: 'User@123',
    role: UserRole.user,
    profile: {
      full_name: 'Regular User',
      tagline: 'Community Member',
      profile_bio: 'Just a regular member of the Jawab community.',
    },
  },
];

const currencies = [
  { currency_name: 'US Dollar', currency_code: 'USD', currency_symbol: '$' },
  { currency_name: 'Kuwaiti Dinar', currency_code: 'KWD', currency_symbol: 'KD' },
  { currency_name: 'Saudi Riyal', currency_code: 'SAR', currency_symbol: '﷼' },
  { currency_name: 'Euro', currency_code: 'EUR', currency_symbol: '€' },
  { currency_name: 'British Pound', currency_code: 'GBP', currency_symbol: '£' },
];

// Image URLs verified live (Unsplash CDN) before adding here.
const topics = [
  {
    topic_slug: 'family',
    topic_name: 'Family',
    topic_description: 'Parenting, relationships, and everyday family life.',
    topic_image: 'https://plus.unsplash.com/premium_photo-1752978159363-87821e2584a8?w=800&h=800&fit=crop&q=80',
    children: [
      { name: 'Mothers', description: 'Motherhood experiences, advice, and support.' },
      { name: 'Pregnancy', description: 'Pregnancy journeys, tips, and questions.' },
      { name: 'Teenagers', description: 'Raising and understanding teenagers.' },
      { name: 'Kids schools', description: 'Choosing and navigating schools for kids.' },
      { name: 'Wifes', description: 'Discussions on married life from a wife\'s perspective.' },
      { name: 'Husbands', description: 'Discussions on married life from a husband\'s perspective.' },
      { name: 'Family Weekends', description: 'Ideas and stories for family time and weekends.' },
      { name: 'Entertainements for Kids', description: 'Activities and entertainment ideas for children.' },
    ],
  },
  {
    topic_slug: 'cars',
    topic_name: 'Cars',
    topic_description: 'Everything about cars — buying, selling, and maintenance.',
    topic_image: 'https://images.unsplash.com/photo-1633619946656-159bb0448e59?w=800&h=800&fit=crop&q=80',
    children: [
      { name: '4x4', description: 'Off-road and 4x4 vehicles.' },
      { name: 'SUV', description: 'SUV models, comparisons, and ownership.' },
      { name: 'Sport Cars', description: 'Sports cars and performance vehicles.' },
      { name: 'German Cars', description: 'German car brands and models.' },
      { name: 'Buy & Sell', description: 'Buying and selling cars.' },
      { name: 'Mechanics', description: 'Repairs, maintenance, and finding a good mechanic.' },
      { name: 'Electric Cars', description: 'Electric vehicles and EV charging.' },
    ],
  },
  {
    topic_slug: 'medicine',
    topic_name: 'Medicine',
    topic_description: 'Health, medication, and wellness advice.',
    topic_image: 'https://images.unsplash.com/photo-1573883429746-084be9b5cfca?w=800&h=800&fit=crop&q=80',
    children: [
      { name: 'Pharmacies', description: 'Pharmacies and where to find medication.' },
      { name: 'Advices Medicine', description: 'General medical advice and questions.' },
      { name: 'Placebo effect', description: 'Discussions on the placebo effect.' },
      { name: 'Side Effects', description: 'Medication side effects and reactions.' },
      { name: 'Heart', description: 'Heart health and cardiology.' },
      { name: 'Bloods Pressure', description: 'Blood pressure management and advice.' },
      { name: 'Pharma Industry', description: 'The pharmaceutical industry.' },
    ],
  },
  {
    topic_slug: 'business',
    topic_name: 'Business',
    topic_description: 'Entrepreneurship, investing, and business ideas.',
    topic_image: 'https://plus.unsplash.com/premium_photo-1678917318811-0b0e6fd6ca28?w=800&h=800&fit=crop&q=80',
    children: [
      { name: 'Open Business', description: 'Starting and opening a new business.' },
      { name: 'Associate', description: 'Business partnerships and associates.' },
      { name: 'Angels', description: 'Angel investors and early-stage funding.' },
      { name: 'Worth', description: 'Business and company valuation.' },
      { name: 'Locals', description: 'Local and small businesses.' },
      { name: 'Malls', description: 'Shopping malls and retail business.' },
      { name: 'Business Ideas', description: 'New business ideas and opportunities.' },
    ],
  },
  {
    topic_slug: 'travel',
    topic_name: 'Travel',
    topic_description: 'Destinations, travel tips, and hospitality.',
    topic_image: 'https://images.unsplash.com/photo-1763811939297-c62d890b987f?w=800&h=800&fit=crop&q=80',
    children: [
      { name: 'Asia', description: 'Traveling in Asia.' },
      { name: 'Europe', description: 'Traveling in Europe.' },
      { name: 'Africa', description: 'Traveling in Africa.' },
      { name: 'America', description: 'Traveling in the Americas.' },
      { name: 'Hospitality', description: 'Hospitality and guest experiences.' },
      { name: 'Hotels', description: 'Hotels and accommodation.' },
      { name: 'Travel Agencies', description: 'Travel agencies and booking services.' },
    ],
  },
];

const communities = [
  {
    community_slug: 'friends-of-kuwait',
    community_name: 'Friends of Kuwait',
    community_description: 'A community for people connected to Kuwait to share and connect.',
    community_image: 'https://images.unsplash.com/photo-1663000857411-b339585c938b?w=800&h=800&fit=crop&q=80',
  },
  {
    community_slug: 'arab-housewives',
    community_name: 'Arab housewives',
    community_description: 'A space for Arab housewives to share experiences and support each other.',
    community_image: 'https://plus.unsplash.com/premium_photo-1680111699826-a65396efe9e8?w=800&h=800&fit=crop&q=80',
  },
  {
    community_slug: 'khaliji',
    community_name: 'Khaliji',
    community_description: 'Discussions and culture from the Gulf (Khaliji) region.',
    community_image: 'https://images.unsplash.com/photo-1561756432-95ae6e06515e?w=800&h=800&fit=crop&q=80',
  },
  {
    community_slug: 'football',
    community_name: 'Football',
    community_description: 'For football fans to discuss matches, teams, and players.',
    community_image: 'https://images.unsplash.com/photo-1695438383563-4f83ad855bbd?w=800&h=800&fit=crop&q=80',
  },
  {
    community_slug: 'men-only',
    community_name: 'Men Only',
    community_description: 'A community space exclusively for men.',
    community_image: 'https://images.unsplash.com/photo-1762294049280-a6fc4962706a?w=800&h=800&fit=crop&q=80',
  },
];

async function main() {
  console.log('🌱 Seeding database...\n');

  for (const u of users) {
    const password_hash = await bcrypt.hash(u.password, HASH_ROUNDS);

    const existing = await prisma.user.findFirst({ where: { email: u.email } });
    if (existing) {
      console.log(`⏭  Skipping ${u.role} ${u.email} already exists`);
      continue;
    }

    const created = await prisma.user.create({
      data: {
        username: u.username,
        email: u.email,
        password_hash,
        role: u.role,
        auth_type: AuthType.email,
        is_active: true,
        is_verified: true,
        profile: {
          create: u.profile,
        },
      },
    });

    console.log(`✅ Created ${created.role.padEnd(10)} → ${created.email}  (password: ${u.password})`);
  }

  console.log('\n💱 Seeding currencies...\n');
  for (const c of currencies) {
    await prisma.currency.upsert({
      where: { currency_code: c.currency_code },
      update: {},
      create: { ...c, is_active: true },
    });
    console.log(`✅ Currency: ${c.currency_code} ${c.currency_name}`);
  }

  console.log('\n🏆 Seeding points settings (admin-configurable, App Settings > Points)...\n');
  for (const reason of Object.keys(POINTS_VALUES) as (keyof typeof POINTS_VALUES)[]) {
    const key = pointsSettingKey(reason);
    await prisma.appSetting.upsert({
      where: { setting_key: key },
      update: {},
      create: {
        setting_key: key,
        setting_value: String(POINTS_VALUES[reason]),
        setting_group: POINTS_SETTING_GROUP,
      },
    });
    console.log(`✅ Points setting: ${key} = ${POINTS_VALUES[reason]}`);
  }

  console.log('\n🏷️  Seeding topics...\n');
  for (const t of topics) {
    const parent = await prisma.topic.upsert({
      where: { topic_slug: t.topic_slug },
      update: { topic_image: t.topic_image, topic_description: t.topic_description },
      create: {
        topic_slug: t.topic_slug,
        topic_name: t.topic_name,
        topic_description: t.topic_description,
        topic_image: t.topic_image,
        parent_id: 0,
        is_active: true,
      },
    });
    console.log(`✅ Topic: ${parent.topic_name} (${t.children.length} subtopics)`);

    for (const child of t.children) {
      const childSlug = `${t.topic_slug}-${child.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
      await prisma.topic.upsert({
        where: { topic_slug: childSlug },
        update: { topic_description: child.description },
        create: {
          topic_slug: childSlug,
          topic_name: child.name,
          topic_description: child.description,
          parent_id: parent.id,
          is_active: true,
        },
      });
    }
  }

  console.log('\n👥 Seeding communities...\n');
  for (const c of communities) {
    await prisma.community.upsert({
      where: { community_slug: c.community_slug },
      update: { community_image: c.community_image, community_description: c.community_description },
      create: { ...c, is_active: true },
    });
    console.log(`✅ Community: ${c.community_name}`);
  }

  console.log('\n✨ Seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
