import { connectToDatabase } from "../db.js";
import { User } from "../models/User.js";
import { TrainerProfile } from "../models/TrainerProfile.js";
import { env } from "../config/env.js";
import bcrypt from "bcryptjs";

async function main() {
  await connectToDatabase();
  
  const passwordHash = await bcrypt.hash("password123", 10);

  // Delete existing data (optional - comment out if you want to keep existing)
  await User.deleteMany({});
  await TrainerProfile.deleteMany({});

  // Create Admin
  const admin = await User.create({
    email: "admin@wiiFit.si",
    passwordHash,
    fullName: "Admin Administrator",
    firstName: "Admin",
    lastName: "Administrator",
    address: "Fitnes centra 1, Ljubljana",
    role: "admin"
  });
  console.log("Created admin:", admin.email);

  // Create Trainers (7 total)
  const trainers = [
    { email: "ana.kovac@wiifit.si", firstName: "Ana", lastName: "Kovač", address: "Fitness ulica 2, Maribor", type: "both" },
    { email: "marko.novak@wiifit.si", firstName: "Marko", lastName: "Novak", address: "Sportna 5, Celje", type: "personal" },
    { email: "luka.horvat@wiifit.si", firstName: "Luka", lastName: "Horvat", address: "Fitnes cesta 10, Koper", type: "group" },
    { email: "sara.petek@wiifit.si", firstName: "Sara", lastName: "Petek", address: "Vadbeni trg 3, Novo Mesto", type: "both" },
    { email: "tomaz.zupan@wiifit.si", firstName: "Tomaž", lastName: "Zupan", address: "Fitnes pot 7, Kranj", type: "personal" },
    { email: "maja.znidarsic@wiifit.si", firstName: "Maja", lastName: "Žnidaršič", address: "Aktivna ulica 12, Velenje", type: "group" },
    { email: "rok.breznik@wiifit.si", firstName: "Rok", lastName: "Breznik", address: "Fitnes cesta 8, Ptuj", type: "both" }
  ];

  const trainerUsers = [];
  for (const t of trainers) {
    const user = await User.create({
      email: t.email,
      passwordHash,
      fullName: `${t.firstName} ${t.lastName}`,
      firstName: t.firstName,
      lastName: t.lastName,
      address: t.address,
      role: "trainer"
    });
    trainerUsers.push({ user, type: t.type });
    console.log(`Created trainer: ${user.email}`);
  }

  // Create Trainer Profiles
  const hourlyRates = [35, 40, 45, 50, 42, 38, 48];
  for (let i = 0; i < trainerUsers.length; i++) {
    const { user, type } = trainerUsers[i];
    await TrainerProfile.create({
      userId: user._id,
      trainerType: type as "personal" | "group" | "both",
      hourlyRate: hourlyRates[i],
      groupClassesLed: []
    });
    console.log(`Created trainer profile for ${user.email} (${type}, ${hourlyRates[i]}€/h)`);
  }

  // Create Members (many users)
  const firstNames = [
    "Miha", "Jure", "Petra", "Nina", "David", "Tina", "Gregor", "Andreja", "Bojan", "Eva",
    "Rok", "Katarina", "Dejan", "Mojca", "Simon", "Nataša", "Aleš", "Maja", "Luka", "Ana",
    "Jan", "Tjaša", "Blaž", "Urška", "Nejc", "Pia", "Matej", "Tanja", "Tine", "Sonja",
    "Gašper", "Nuša", "Jani", "Vesna", "Anže", "Anja", "Žiga", "Metka", "Matija", "Sara",
    "Matic", "Barbara", "Aljaž", "Martina", "Jaka", "Marina", "Sebastjan", "Karmen", "Marko", "Polona"
  ];
  const lastNames = [
    "Novak", "Horvat", "Kovačič", "Krajnc", "Zupan", "Pirc", "Vidmar", "Kos", "Golob", "Mlakar",
    "Kokalj", "Žnidaršič", "Petek", "Koren", "Korošec", "Krajnik", "Šmid", "Lah", "Lesjak", "Jerman",
    "Medved", "Bajc", "Zorman", "Božič", "Pečnik", "Rozman", "Štrukelj", "Gorenc", "Vidic", "Janežič",
    "Javornik", "Jeršek", "Hribar", "Erjavac", "Hribar", "Ferjančič", "Kavčič", "Miklavčič", "Zemljič", "Močnik"
  ];

  const addresses = [
    "Ljubljana, Trubarjeva 12", "Maribor, Glavni trg 5", "Celje, Trg celjskih knezov 8",
    "Kranj, Glavni trg 3", "Koper, Titov trg 1", "Novo Mesto, Glavni trg 2",
    "Velenje, Titova 1", "Ptuj, Slomškov trg 25", "Murska Sobota, Glavna 10",
    "Nova Gorica, Bevkov trg 1"
  ];

  const memberUsers = [];
  for (let i = 0; i < 50; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const address = addresses[Math.floor(Math.random() * addresses.length)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
    
    const user = await User.create({
      email,
      passwordHash,
      fullName: `${firstName} ${lastName}`,
      firstName,
      lastName,
      address,
      role: "member"
    });
    memberUsers.push(user);
  }
  console.log(`Created ${memberUsers.length} member users`);

  console.log(`\nSeed complete!`);
  console.log(`- 1 admin`);
  console.log(`- ${trainerUsers.length} trainers`);
  console.log(`- ${memberUsers.length} members`);
  console.log(`Total users: ${1 + trainerUsers.length + memberUsers.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

