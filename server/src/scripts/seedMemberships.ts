import { connectToDatabase } from "../db.js";
import { MembershipPackage, Membership } from "../models/Membership.js";
import { User } from "../models/User.js";
import { env } from "../config/env.js";

async function main() {
  await connectToDatabase();

  // Delete existing (optional)
  await Membership.deleteMany({});
  await MembershipPackage.deleteMany({});

  // Create 3 Membership Packages
  const packages = [
    { name: "Začetni Paket", price: 29 },
    { name: "Premium Paket", price: 49 },
    { name: "Elite Paket", price: 55 }
  ];

  const createdPackages = [];
  for (const pkg of packages) {
    const p = await MembershipPackage.create(pkg);
    createdPackages.push(p);
    console.log(`Created package: ${p.name} - ${p.price}€/mesec`);
  }

  // Get all member users
  const members = await User.find({ role: "member" }).lean();

  if (members.length === 0) {
    console.log("No members found. Run seed:users first!");
    return;
  }

  // Create actual memberships for members
  const now = new Date();
  let membershipCount = 0;

  for (const member of members) {
    // Random package assignment (weighted towards cheaper packages)
    const rand = Math.random();
    let packageIdx = 0;
    if (rand < 0.5) packageIdx = 0; // 50% Začetni
    else if (rand < 0.85) packageIdx = 1; // 35% Premium
    else packageIdx = 2; // 15% Elite

    const pkg = createdPackages[packageIdx];

    // Random start date (within last 3 months)
    const startOffset = Math.floor(Math.random() * 90); // days
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - startOffset);

    // End date: 1 year from start (most common) or shorter (20% chance)
    let months = 12;
    if (Math.random() < 0.2) {
      months = Math.random() < 0.5 ? 6 : 3; // 6 or 3 months
    }
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);

    const membership = await Membership.create({
      userId: member._id,
      packageId: pkg._id,
      startDate,
      endDate
    });

    // Update user's membershipId reference
    await User.updateOne({ _id: member._id }, { membershipId: membership._id });

    membershipCount++;
  }

  console.log(`\nCreated ${membershipCount} memberships for members`);
  console.log(`\nMembership distribution:`);
  const stats = await Membership.aggregate([
    { $group: { _id: "$packageId", count: { $sum: 1 } } },
    { $lookup: { from: "membershippackages", localField: "_id", foreignField: "_id", as: "pkg" } },
    { $unwind: "$pkg" },
    { $project: { name: "$pkg.name", count: 1 } }
  ]);
  for (const stat of stats) {
    console.log(`  ${stat.name}: ${stat.count} members`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

