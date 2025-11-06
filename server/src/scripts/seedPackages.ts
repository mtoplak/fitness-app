import { connectToDatabase } from "../db.js";
import { MembershipPackage } from "../models/Membership.js";

async function seedPackages() {
  await connectToDatabase();

  const packages = [
    {
      name: "Začetni Paket",
      price: 29
    },
    {
      name: "Premium Paket",
      price: 49
    },
    {
      name: "Elite Paket",
      price: 55
    }
  ];

  for (const pkg of packages) {
    const existing = await MembershipPackage.findOne({ name: pkg.name });
    if (!existing) {
      await MembershipPackage.create(pkg);
      console.log(`✓ Ustvarjen paket: ${pkg.name}`);
    } else {
      console.log(`- Paket ${pkg.name} že obstaja`);
    }
  }

  console.log("Seed paketov končan!");
  process.exit(0);
}

seedPackages().catch((err) => {
  console.error("Napaka pri seed-u paketov:", err);
  process.exit(1);
});
