import { connectToDatabase } from "../db.js";
import { User } from "../models/User.js";
import { TrainerProfile } from "../models/TrainerProfile.js";

async function seedTrainerProfiles() {
  console.log("🌱 Seeding trainer profiles...\n");

  try {
    await connectToDatabase();

    // Najdi vse trenerje
    const trainers = await User.find({ role: "trainer" });

    if (trainers.length === 0) {
      console.log("⚠️  No trainers found. Run seed:users first.");
      process.exit(0);
    }

    console.log(`Found ${trainers.length} trainers\n`);

    // Trener profile podatki
    const profilesData = [
      { hourlyRate: 35, trainerType: "both" as const },      // Prvi trener - oba tipa
      { hourlyRate: 40, trainerType: "personal" as const },  // Drugi trener - samo osebni
      { hourlyRate: 30, trainerType: "group" as const },     // Tretji trener - samo skupinski
      { hourlyRate: 45, trainerType: "both" as const },      // Četrti trener - oba tipa
    ];

    // Ustvari ali posodobi profile
    for (let i = 0; i < trainers.length && i < profilesData.length; i++) {
      const trainer = trainers[i];
      const profileData = profilesData[i];

      const existingProfile = await TrainerProfile.findOne({ userId: trainer._id });

      if (existingProfile) {
        // Posodobi obstoječi profil
        existingProfile.hourlyRate = profileData.hourlyRate;
        existingProfile.trainerType = profileData.trainerType;
        await existingProfile.save();
        
        console.log(`✅ Updated profile for ${trainer.fullName}`);
        console.log(`   Type: ${profileData.trainerType}, Rate: ${profileData.hourlyRate}€/h\n`);
      } else {
        // Ustvari nov profil
        const profile = await TrainerProfile.create({
          userId: trainer._id,
          hourlyRate: profileData.hourlyRate,
          trainerType: profileData.trainerType,
          groupClassesLed: []
        });

        console.log(`✅ Created profile for ${trainer.fullName}`);
        console.log(`   Type: ${profileData.trainerType}, Rate: ${profileData.hourlyRate}€/h\n`);
      }
    }

    console.log("✅ Trainer profiles seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding trainer profiles:", error);
    process.exit(1);
  }
}

seedTrainerProfiles();
