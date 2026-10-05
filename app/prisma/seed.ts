/**
 * Prisma Seed — 8 categories + 9 cities for Metro Cardz Deals Platform
 * Run: npx prisma db seed
 * Or:  npx ts-node prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Water Parks',          slug: 'waterparks',          icon: '🌊' },
  { name: 'Gaming & Entertainment', slug: 'gaming',            icon: '🎮' },
  { name: 'Movies',               slug: 'movies',               icon: '🎬' },
  { name: 'Fine Dining',          slug: 'dining',               icon: '🍽️' },
  { name: 'Cafés & Bakeries',     slug: 'cafes',                icon: '☕' },
  { name: 'Events & Nightlife',   slug: 'events',               icon: '🎵' },
  { name: 'Resorts & Stays',      slug: 'resorts',              icon: '🏨' },
  { name: 'Hill Stations',        slug: 'hill-stations',        icon: '⛰️' },
];

const CITIES = [
  { name: 'Mumbai',        slug: 'mumbai' },
  { name: 'Thane',         slug: 'thane' },
  { name: 'Navi Mumbai',   slug: 'navi-mumbai' },
  { name: 'Lonavala',      slug: 'lonavala' },
  { name: 'Matheran',      slug: 'matheran' },
  { name: 'Mahabaleshwar', slug: 'mahabaleshwar' },
  { name: 'Panchgani',     slug: 'panchgani' },
  { name: 'Alibaug',       slug: 'alibaug' },
  { name: 'Igatpuri',      slug: 'igatpuri' },
];

async function main() {
  console.log('🌱 Seeding Metro Cardz Deals Platform...');

  // ── Categories ──────────────────────────────────────────────────────────────
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where:  { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon },
      create: { name: cat.name, slug: cat.slug, icon: cat.icon },
    });
    console.log(`  ✓ Category: ${cat.name}`);
  }

  // ── Cities ───────────────────────────────────────────────────────────────────
  for (const city of CITIES) {
    await prisma.city.upsert({
      where:  { slug: city.slug },
      update: { name: city.name },
      create: { name: city.name, slug: city.slug },
    });
    console.log(`  ✓ City: ${city.name}`);
  }

  // ── Admin User (default — change password immediately after seeding!) ────────
  const defaultAdminEmail = process.env.DEALS_ADMIN_EMAIL ?? 'admin@metrocardz.in';
  const defaultAdminPass  = process.env.DEALS_ADMIN_INITIAL_PASSWORD ?? 'ChangeMe123!';

  const existing = await prisma.adminUser.findUnique({ where: { email: defaultAdminEmail } });
  if (!existing) {
    const hash = await bcrypt.hash(defaultAdminPass, 12);
    await prisma.adminUser.create({
      data: { email: defaultAdminEmail, passwordHash: hash, role: 'admin' },
    });
    console.log(`  ✓ Admin user: ${defaultAdminEmail} (CHANGE PASSWORD IMMEDIATELY)`);
  } else {
    console.log(`  → Admin user already exists: ${defaultAdminEmail}`);
  }

  console.log('✅ Seeding complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
