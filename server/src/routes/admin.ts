import { Router } from "express";
import { User } from "../models/User.js";
import { Membership } from "../models/Membership.js";
import { Booking } from "../models/Booking.js";
import { GroupClass } from "../models/GroupClass.js";
import { authenticateJwt, AuthRequest } from "../middleware/auth.js";
import { sendClassStatusNotificationToTrainer } from "../services/emailService.js";

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

// GET /admin/classes - seznam vseh skupinskih vadb (vključno s pending)
router.get("/classes", authenticateJwt, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const classes = await GroupClass.find({})
      .populate("trainerUserId", "firstName lastName fullName email")
      .sort({ createdAt: -1 })
      .lean();

    // Pridobi število rezervacij za vsako vadbo
    const classesWithBookings = await Promise.all(
      classes.map(async (cls) => {
        const bookingsCount = await Booking.countDocuments({ groupClassId: cls._id });
        return {
          ...cls,
          totalBookings: bookingsCount
        };
      })
    );

    // Statistika
    const statistics = {
      totalClasses: classes.length,
      pendingClasses: classes.filter(c => c.status === "pending").length,
      approvedClasses: classes.filter(c => c.status === "approved").length,
      rejectedClasses: classes.filter(c => c.status === "rejected").length
    };

    return res.json({
      classes: classesWithBookings,
      statistics
    });
  } catch (err) {
    console.error("Napaka pri pridobivanju skupinskih vadb:", err);
    return res.status(500).json({ message: "Napaka strežnika" });
  }
});

// PUT /admin/classes/:id/approve - odobri skupinsko vadbo
router.put("/classes/:id/approve", authenticateJwt, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const groupClass = await GroupClass.findById(id).populate("trainerUserId", "email fullName");
    if (!groupClass) {
      return res.status(404).json({ message: "Vadba ni najdena" });
    }

    groupClass.status = "approved";
    await groupClass.save();

    // Pošlji email trenerju
    if (groupClass.trainerUserId) {
      const trainer = groupClass.trainerUserId as any;
      try {
        await sendClassStatusNotificationToTrainer(trainer.email, {
          className: groupClass.name,
          status: "approved",
          adminComment: comment
        });
        console.log("Email poslan trenerju o odobritvi vadbe");
      } catch (emailErr) {
        console.error("Napaka pri pošiljanju emaila:", emailErr);
      }
    }

    return res.json({
      message: "Vadba uspešno odobrena",
      class: groupClass
    });
  } catch (err) {
    console.error("Napaka pri odobravanju vadbe:", err);
    return res.status(500).json({ message: "Napaka strežnika" });
  }
});

// PUT /admin/classes/:id/reject - zavrni skupinsko vadbo
router.put("/classes/:id/reject", authenticateJwt, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const groupClass = await GroupClass.findById(id).populate("trainerUserId", "email fullName");
    if (!groupClass) {
      return res.status(404).json({ message: "Vadba ni najdena" });
    }

    groupClass.status = "rejected";
    await groupClass.save();

    // Pošlji email trenerju
    if (groupClass.trainerUserId) {
      const trainer = groupClass.trainerUserId as any;
      try {
        await sendClassStatusNotificationToTrainer(trainer.email, {
          className: groupClass.name,
          status: "rejected",
          adminComment: comment
        });
        console.log("Email poslan trenerju o zavrnitvi vadbe");
      } catch (emailErr) {
        console.error("Napaka pri pošiljanju emaila:", emailErr);
      }
    }

    return res.json({
      message: "Vadba zavrnjena",
      class: groupClass
    });
  } catch (err) {
    console.error("Napaka pri zavračanju vadbe:", err);
    return res.status(500).json({ message: "Napaka strežnika" });
  }
});

// PUT /admin/classes/:id - uredi skupinsko vadbo
router.put("/classes/:id", authenticateJwt, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, difficulty, duration, capacity, schedule, status } = req.body;

    const groupClass = await GroupClass.findById(id);
    if (!groupClass) {
      return res.status(404).json({ message: "Vadba ni najdena" });
    }

    // Posodobi polja
    if (name !== undefined) groupClass.name = name;
    if (description !== undefined) groupClass.description = description;
    if (difficulty !== undefined) groupClass.difficulty = difficulty;
    if (duration !== undefined) groupClass.duration = duration;
    if (capacity !== undefined) groupClass.capacity = capacity;
    if (schedule !== undefined) groupClass.schedule = schedule;
    if (status !== undefined) groupClass.status = status;

    await groupClass.save();

    return res.json({
      message: "Vadba uspešno posodobljena",
      class: groupClass
    });
  } catch (err) {
    console.error("Napaka pri posodabljanju vadbe:", err);
    return res.status(500).json({ message: "Napaka strežnika" });
  }
});

// DELETE /admin/classes/:id - izbriši skupinsko vadbo
router.delete("/classes/:id", authenticateJwt, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Preveri, ali obstajajo rezervacije za to vadbo
    const bookingsCount = await Booking.countDocuments({ groupClassId: id });
    
    if (bookingsCount > 0) {
      return res.status(400).json({ 
        message: `Ne morete izbrisati vadbe, ker ima ${bookingsCount} rezervacij. Prosimo, najprej preklicajte vse rezervacije.` 
      });
    }

    const groupClass = await GroupClass.findByIdAndDelete(id);
    if (!groupClass) {
      return res.status(404).json({ message: "Vadba ni najdena" });
    }

    return res.json({
      message: "Vadba uspešno izbrisana"
    });
  } catch (err) {
    console.error("Napaka pri brisanju vadbe:", err);
    return res.status(500).json({ message: "Napaka strežnika" });
  }
});

export default router;
