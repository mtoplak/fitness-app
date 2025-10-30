import { connectToDatabase } from "../db.js";
import { GroupClass } from "../models/GroupClass.js";
import { env } from "../config/env.js";

async function main() {
  await connectToDatabase();

  const sample = [
    {
      name: "Jutranji HIIT",
      capacity: 16,
      schedule: [
        { dayOfWeek: 1, startTime: "07:00", endTime: "07:45" }, // Pon
        { dayOfWeek: 3, startTime: "07:00", endTime: "07:45" }  // Sre
      ]
    },
    {
      name: "Joga za začetnike",
      capacity: 20,
      schedule: [
        { dayOfWeek: 2, startTime: "18:00", endTime: "19:00" }, // Tor
        { dayOfWeek: 4, startTime: "18:00", endTime: "19:00" }  // Čet
      ]
    },
    {
      name: "Krožni trening",
      capacity: 12,
      schedule: [
        { dayOfWeek: 5, startTime: "17:30", endTime: "18:15" }, // Pet
        { dayOfWeek: 6, startTime: "10:00", endTime: "10:45" }  // Sob
      ]
    },
    {
      name: "Pilates",
      capacity: 14,
      schedule: [
        { dayOfWeek: 1, startTime: "19:00", endTime: "20:00" }, // Pon
        { dayOfWeek: 3, startTime: "19:00", endTime: "20:00" }  // Sre
      ]
    },
    {
      name: "Zumba",
      capacity: 22,
      schedule: [
        { dayOfWeek: 2, startTime: "19:15", endTime: "20:00" }, // Tor
        { dayOfWeek: 5, startTime: "19:00", endTime: "19:45" }  // Pet
      ]
    },
    {
      name: "Spinning",
      capacity: 18,
      schedule: [
        { dayOfWeek: 1, startTime: "06:30", endTime: "07:15" }, // Pon
        { dayOfWeek: 4, startTime: "06:30", endTime: "07:15" }  // Čet
      ]
    },
    {
      name: "Boks kondicija",
      capacity: 16,
      schedule: [
        { dayOfWeek: 2, startTime: "20:15", endTime: "21:15" }, // Tor
        { dayOfWeek: 4, startTime: "20:15", endTime: "21:15" }  // Čet
      ]
    },
    {
      name: "Mobility & Stretch",
      capacity: 20,
      schedule: [
        { dayOfWeek: 0, startTime: "17:00", endTime: "17:45" }, // Ned
        { dayOfWeek: 6, startTime: "11:00", endTime: "11:45" }  // Sob
      ]
    },
    {
      name: "Core Blast",
      capacity: 15,
      schedule: [
        { dayOfWeek: 3, startTime: "12:15", endTime: "12:45" }, // Sre
        { dayOfWeek: 5, startTime: "12:15", endTime: "12:45" }  // Pet
      ]
    },
    {
      name: "Dance Cardio",
      capacity: 24,
      schedule: [
        { dayOfWeek: 6, startTime: "18:00", endTime: "19:00" }  // Sob
      ]
    },
    {
      name: "CrossFit Intro",
      capacity: 12,
      schedule: [
        { dayOfWeek: 1, startTime: "17:00", endTime: "18:00" }, // Pon
        { dayOfWeek: 3, startTime: "17:00", endTime: "18:00" }, // Sre
        { dayOfWeek: 5, startTime: "09:00", endTime: "10:00" }  // Pet
      ]
    }
  ];

  // Optional: clear existing classes first
  await GroupClass.deleteMany({});
  await GroupClass.insertMany(sample);

  console.log(`Seeded ${sample.length} group classes to ${env.mongoUri}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });


