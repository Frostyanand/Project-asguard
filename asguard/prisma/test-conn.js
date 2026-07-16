require('dotenv').config({ path: '../.env' });
const { Pool, neonConfig } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { PrismaClient } = require('@prisma/client');
const ws = require('ws');
neonConfig.webSocketConstructor = ws;

async function test1() {
  try {
    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
    const prisma = new PrismaClient({ adapter });
    await prisma.$connect();
    console.log('Test 1 { connectionString } success');
    await prisma.$disconnect();
  } catch (e) { console.error('Test 1 failed', e.message); }
}

async function test2() {
  try {
    const adapter = new PrismaNeon({ url: process.env.DATABASE_URL });
    const prisma = new PrismaClient({ adapter });
    await prisma.$connect();
    console.log('Test 2 { url } success');
    await prisma.$disconnect();
  } catch (e) { console.error('Test 2 failed', e.message); }
}

async function test3() {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaNeon(pool);
    const prisma = new PrismaClient({ adapter });
    const users = await prisma.user.findMany();
    console.log('Test 3 (pool) query success! found', users.length);
    await prisma.$disconnect();
  } catch (e) { console.error('Test 3 failed', e); }
}

async function test4() {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL.replace('postgres://', 'postgresql://') });
    const adapter = new PrismaNeon(pool);
    const prisma = new PrismaClient({ adapter });
    await prisma.$connect();
    console.log('Test 4 (postgresql://) success');
    await prisma.$disconnect();
  } catch (e) { console.error('Test 4 failed', e.message); }
}

async function run() {
  await test1();
  await test2();
  await test3();
  await test4();
}
run();
