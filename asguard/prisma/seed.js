const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Pool, neonConfig } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { PrismaClient } = require('@prisma/client');
const ws = require('ws');
neonConfig.webSocketConstructor = ws;

const csvFilePath = path.join(__dirname, '../../database/processed/energy_usage_clean.csv');

async function main() {
  console.log('Starting seed process...');
  
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set!');
  }
  // Strip any accidental quotes
  if (dbUrl.startsWith('"')) dbUrl = dbUrl.slice(1, -1);
  if (dbUrl.startsWith("'")) dbUrl = dbUrl.slice(1, -1);
  
  const adapter = new PrismaNeon({ connectionString: dbUrl });
  const prisma = new PrismaClient({ adapter });

  const housesMap = new Map();
  const roomsMap = new Map();
  const appliancesMap = new Map();
  const logs = [];

  // Create a default user as owner of the houses since Firebase sync isn't here yet
  const defaultUserId = "DEFAULT_USER_001";
  
  await prisma.user.upsert({
    where: { id: defaultUserId },
    update: {},
    create: {
      id: defaultUserId,
      email: "demo@asguard.ai",
      name: "Demo User",
    }
  });

  console.log(`Created/Ensured default user: ${defaultUserId}`);

  console.log(`Reading CSV from: ${csvFilePath}`);
  let count = 0;

  // We read the entire CSV into memory first
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        // Extract House
        if (!housesMap.has(row.house_id)) {
          housesMap.set(row.house_id, {
            id: row.house_id,
            ownerId: defaultUserId,
            name: "Smart Villa Chennai", // Default mock data
            location: "Chennai, Tamil Nadu, India",
            climate: "Hot and Humid Tropical",
          });
        }

        // Extract Room
        if (!roomsMap.has(row.room_id)) {
          roomsMap.set(row.room_id, {
            id: row.room_id,
            houseId: row.house_id,
            name: row.room_name,
            type: row.room_type,
          });
        }

        // Extract Appliance
        if (!appliancesMap.has(row.appliance_id)) {
          appliancesMap.set(row.appliance_id, {
            id: row.appliance_id,
            roomId: row.room_id,
            name: row.appliance_name,
            type: row.appliance_type,
            manufacturer: row.manufacturer,
            ratedPower: parseFloat(row.rated_power_watts) || 0,
          });
        }

        // Extract Log
        logs.push({
          timestamp: new Date(row.timestamp),
          date: row.date,
          hour: parseInt(row.hour),
          dayOfWeek: row.day_of_week,
          isWeekend: row.is_weekend === 'True',
          
          houseId: row.house_id,
          roomId: row.room_id,
          applianceId: row.appliance_id,

          status: row.status,
          runtimeMinutes: parseInt(row.runtime_minutes) || 0,
          powerConsumptionWh: parseFloat(row.power_consumption_wh) || 0,
          energyKwh: parseFloat(row.energy_kwh) || 0,
          electricityCost: parseFloat(row.electricity_cost) || 0,

          occupancy: row.occupancy === 'True',
          ambientTemperature: parseFloat(row.ambient_temperature) || 0,
          weather: row.weather,
          tariffType: row.tariff_type,
          dailyLimitKwh: parseFloat(row.daily_limit_kwh) || 0,
          thresholdExceeded: row.threshold_exceeded === 'True',
          aiFlag: row.ai_flag,
        });

        count++;
        if (count % 5000 === 0) console.log(`Parsed ${count} rows...`);
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Finished parsing ${logs.length} rows.`);

  // 1. Insert Houses
  console.log(`Inserting ${housesMap.size} houses...`);
  for (const house of housesMap.values()) {
    await prisma.house.upsert({
      where: { id: house.id },
      update: house,
      create: house,
    });
  }

  // 2. Insert Rooms
  console.log(`Inserting ${roomsMap.size} rooms...`);
  for (const room of roomsMap.values()) {
    await prisma.room.upsert({
      where: { id: room.id },
      update: room,
      create: room,
    });
  }

  // 3. Insert Appliances
  console.log(`Inserting ${appliancesMap.size} appliances...`);
  for (const app of appliancesMap.values()) {
    await prisma.appliance.upsert({
      where: { id: app.id },
      update: app,
      create: app,
    });
  }

  // 4. Insert Logs in Batches
  console.log(`Clearing existing logs...`);
  await prisma.energyLog.deleteMany({});

  console.log(`Inserting ${logs.length} energy logs in batches...`);
  const BATCH_SIZE = 5000;
  for (let i = 0; i < logs.length; i += BATCH_SIZE) {
    const batch = logs.slice(i, i + BATCH_SIZE);
    await prisma.energyLog.createMany({
      data: batch,
      skipDuplicates: true, 
    });
    console.log(`Inserted batch ${i} to ${i + batch.length}`);
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Wait for prisma disconnect if needed
    process.exit(0);
  });
