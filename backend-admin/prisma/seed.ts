import 'dotenv/config';
import { PrismaClient, UserRole, AuthType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

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

async function main() {
  console.log('🌱 Seeding database...\n');

  for (const u of users) {
    const password_hash = await bcrypt.hash(u.password, HASH_ROUNDS);

    const existing = await prisma.user.findFirst({ where: { email: u.email } });
    if (existing) {
      console.log(`⏭  Skipping ${u.role} — ${u.email} already exists`);
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
    console.log(`✅ Currency: ${c.currency_code} — ${c.currency_name}`);
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
