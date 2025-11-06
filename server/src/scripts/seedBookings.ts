import { connectToDatabase } from "../db.js";
import { Booking } from "../models/Booking.js";
import { User } from "../models/User.js";
import { GroupClass } from "../models/GroupClass.js";

async function main() {
  await connectToDatabase();

  // Izbriši obstoječe rezervacije
  await Booking.deleteMany({});

  // Pridobi nekatere člane in trenerje
  const members = await User.find({ role: "member" }).limit(10);
  const trainers = await User.find({ role: "trainer" }).limit(3);
  const groupClasses = await GroupClass.find().limit(3);

  if (members.length === 0) {
    console.log("Ni najdenih članov. Najprej zaženi seedUsers.ts");
    return;
  }

  const bookings = [];

  // Ustvari nekaj skupinskih treningov za naslednje 2 tedna
  for (let i = 0; i < 15; i++) {
    const member = members[Math.floor(Math.random() * members.length)];
    const groupClass = groupClasses[Math.floor(Math.random() * groupClasses.length)];
    
    if (!groupClass) continue;

    const daysFromNow = Math.floor(Math.random() * 14); // naslednji 2 tedna
    const classDate = new Date();
    classDate.setDate(classDate.getDate() + daysFromNow);
    classDate.setHours(10, 0, 0, 0);

    const booking = await Booking.create({
      userId: member._id,
      type: "group_class",
      status: daysFromNow < 0 ? "completed" : "confirmed",
      groupClassId: groupClass._id,
      classDate: classDate
    });
    bookings.push(booking);
  }

  // Ustvari nekaj osebnih treningov
  for (let i = 0; i < 20; i++) {
    const member = members[Math.floor(Math.random() * members.length)];
    const trainer = trainers[Math.floor(Math.random() * trainers.length)];
    
    if (!trainer) continue;

    const daysFromNow = Math.floor(Math.random() * 21) - 7; // od -7 do +14 dni
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + daysFromNow);
    startTime.setHours(9 + Math.floor(Math.random() * 10), 0, 0, 0); // med 9:00 in 19:00
    
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1); // 1 ura trajanje

    const booking = await Booking.create({
      userId: member._id,
      type: "personal_training",
      status: daysFromNow < 0 ? "completed" : "confirmed",
      trainerId: trainer._id,
      startTime: startTime,
      endTime: endTime,
      notes: Math.random() > 0.5 ? "Fokus na moč" : undefined
    });
    bookings.push(booking);
  }

  console.log(`Ustvarjenih ${bookings.length} rezervacij`);
  console.log(`- Skupinski treningi: ${bookings.filter(b => b.type === "group_class").length}`);
  console.log(`- Osebni treningi: ${bookings.filter(b => b.type === "personal_training").length}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
