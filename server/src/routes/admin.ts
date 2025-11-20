import { Router } from "express";
import { User } from "../models/User.js";
import { Membership } from "../models/Membership.js";
import { Booking } from "../models/Booking.js";
import { authenticateJwt, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Middleware za preverjanje admin role
const requireAdmin = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Dostop zavrnjen - potrebne so admin pravice" });
  }
  next();
};

// GET /admin/members - seznam vseh članov s podrobnostmi
router.get("/members", authenticateJwt, requireAdmin, async (req: AuthRequest, res) => {
  try {
    // Pridobi vse uporabnike z role 'member' ali 'trainer'
    const members = await User.find({ role: { $in: ["member", "trainer"] } })
      .populate({
        path: "membershipId",
        populate: { path: "packageId" }
      })
      .lean()
      .sort({ createdAt: -1 });

    // Za vsakega člana pridobi dodatne podatke
    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        // Pridobi število rezervacij
        const bookingsCount = await Booking.countDocuments({ userId: member._id });
        
        // Pridobi število prihodnjih rezervacij
        const upcomingBookings = await Booking.countDocuments({
          userId: member._id,
          classDate: { $gte: new Date() }
        });

        // Pridobi vse članarine (zgodovino)
        const membershipHistory = await Membership.find({ userId: member._id })
          .populate("packageId")
          .sort({ startDate: -1 })
          .lean();

        return {
          id: member._id,
          email: member.email,
          fullName: member.fullName,
          firstName: member.firstName,
          lastName: member.lastName,
          address: member.address,
          role: member.role,
          createdAt: member.createdAt,
          currentMembership: member.membershipId,
          membershipHistory: membershipHistory,
          bookingsCount,
          upcomingBookings
        };
      })
    );

    // Izračunaj statistiko
    const totalMembers = members.length;
    const activeMembers = members.filter(m => {
      const membership = m.membershipId as any;
      return membership && membership.status === "active";
    }).length;

    // Izračunaj povprečno dobo članstva
    const now = new Date();
    const membershipDurations = members
      .filter(m => m.createdAt)
      .map(m => {
        const created = new Date(m.createdAt);
        return (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // dni
      });
    
    const averageMembershipDays = membershipDurations.length > 0
      ? membershipDurations.reduce((a, b) => a + b, 0) / membershipDurations.length
      : 0;

    // Novi člani v zadnjih 30 dneh
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newMembers = members.filter(m => new Date(m.createdAt) >= thirtyDaysAgo).length;

    return res.json({
      members: membersWithDetails,
      statistics: {
        totalMembers,
        activeMembers,
        inactiveMembers: totalMembers - activeMembers,
        averageMembershipDays: Math.round(averageMembershipDays),
        newMembersLast30Days: newMembers,
        newMembersPercentage: totalMembers > 0 ? Math.round((newMembers / totalMembers) * 100) : 0
      }
    });
  } catch (err) {
    console.error("Napaka pri pridobivanju članov:", err);
    return res.status(500).json({ message: "Napaka strežnika" });
  }
});

// GET /admin/members/:id - podrobnosti posameznega člana
router.get("/members/:id", authenticateJwt, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const member = await User.findById(id)
      .populate({
        path: "membershipId",
        populate: { path: "packageId" }
      })
      .lean();

    if (!member) {
      return res.status(404).json({ message: "Član ni najden" });
    }

    // Pridobi vse članarine
    const membershipHistory = await Membership.find({ userId: id })
      .populate("packageId")
      .populate("nextPackageId")
      .sort({ startDate: -1 })
      .lean();

    // Pridobi vse rezervacije
    const bookings = await Booking.find({ userId: id })
      .populate("groupClassId", "name")
      .sort({ classDate: -1 })
      .limit(50)
      .lean();

    return res.json({
      member: {
        id: member._id,
        email: member.email,
        fullName: member.fullName,
        firstName: member.firstName,
        lastName: member.lastName,
        address: member.address,
        role: member.role,
        createdAt: member.createdAt,
        currentMembership: member.membershipId
      },
      membershipHistory,
      bookings,
      statistics: {
        totalBookings: bookings.length,
        upcomingBookings: bookings.filter(b => b.classDate && new Date(b.classDate) >= new Date()).length
      }
    });
  } catch (err) {
    console.error("Napaka pri pridobivanju podatkov člana:", err);
    return res.status(500).json({ message: "Napaka strežnika" });
  }
});

export default router;
