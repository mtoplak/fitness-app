import { Router } from "express";
import { authenticateJwt, AuthRequest } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { Membership, MembershipPackage } from "../models/Membership.js";
import { Booking } from "../models/Booking.js";
import { GroupClass } from "../models/GroupClass.js";

const router = Router();

// GET /profile - pridobi celoten profil uporabnika z naročnino
router.get("/profile", authenticateJwt, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    
    // Pridobi uporabnika
    const user = await User.findById(userId).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ message: "Uporabnik ni najden" });
    }

    // Pridobi naročnino samo za člane
    let membershipData = null;
    if (user.role === "member" && user.membershipId) {
      const membership = await Membership.findOne({ 
        userId: userId,
        endDate: { $gte: new Date() } // samo aktivne naročnine
      }).populate("packageId");
      
      if (membership) {
        const pkg = membership.packageId as any;
        membershipData = {
          package: pkg.name,
          price: pkg.price,
          startDate: membership.startDate,
          endDate: membership.endDate,
          isActive: new Date() <= membership.endDate
        };
      }
    }

    return res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        address: user.address,
        role: user.role
      },
      membership: membershipData
    });
  } catch (error) {
    console.error("Napaka pri pridobivanju profila:", error);
    return res.status(500).json({ message: "Napaka strežnika" });
  }
});

// GET /profile/bookings - pridobi vse rezervacije uporabnika (samo za člane)
router.get("/profile/bookings", authenticateJwt, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const user = req.user!;
    const { status, upcoming } = req.query;

    // Samo člani imajo rezervacije
    if (user.role !== "member") {
      return res.json({ bookings: [] });
    }

    // Pripravi filter
    const filter: any = { userId };
    
    if (status) {
      filter.status = status;
    }

    // Če želimo samo prihajajoče rezervacije
    if (upcoming === "true") {
      filter.$or = [
        { type: "group_class", classDate: { $gte: new Date() } },
        { type: "personal_training", startTime: { $gte: new Date() } }
      ];
    }

    const bookings = await Booking.find(filter)
      .populate("groupClassId")
      .populate("trainerId", "firstName lastName fullName email")
      .sort({ createdAt: -1 });

    const formattedBookings = bookings.map(booking => {
      const base = {
        id: booking._id,
        type: booking.type,
        status: booking.status,
        notes: booking.notes,
        createdAt: booking.createdAt
      };

      if (booking.type === "group_class" && booking.groupClassId) {
        const groupClass = booking.groupClassId as any;
        return {
          ...base,
          className: groupClass.name,
          classDate: booking.classDate,
          schedule: groupClass.schedule
        };
      } else if (booking.type === "personal_training" && booking.trainerId) {
        const trainer = booking.trainerId as any;
        return {
          ...base,
          trainer: {
            id: trainer._id,
            name: trainer.fullName,
            firstName: trainer.firstName,
            lastName: trainer.lastName,
            email: trainer.email
          },
          startTime: booking.startTime,
          endTime: booking.endTime,
          duration: booking.startTime && booking.endTime 
            ? Math.round((booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60)) 
            : null
        };
      }

      return base;
    });

    return res.json({ bookings: formattedBookings });
  } catch (error) {
    console.error("Napaka pri pridobivanju rezervacij:", error);
    return res.status(500).json({ message: "Napaka strežnika" });
  }
});

// GET /profile/bookings/:id - pridobi podrobnosti posamezne rezervacije (samo za člane)
router.get("/profile/bookings/:id", authenticateJwt, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const user = req.user!;
    const bookingId = req.params.id;

    // Samo člani imajo rezervacije
    if (user.role !== "member") {
      return res.status(404).json({ message: "Rezervacija ni najdena" });
    }

    const booking = await Booking.findOne({ _id: bookingId, userId })
      .populate("groupClassId")
      .populate("trainerId", "firstName lastName fullName email address");

    if (!booking) {
      return res.status(404).json({ message: "Rezervacija ni najdena" });
    }

    const details: any = {
      id: booking._id,
      type: booking.type,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    };

    if (booking.type === "group_class" && booking.groupClassId) {
      const groupClass = booking.groupClassId as any;
      details.groupClass = {
        id: groupClass._id,
        name: groupClass.name,
        schedule: groupClass.schedule,
        capacity: groupClass.capacity
      };
      details.classDate = booking.classDate;
      
      // Če je določen trener
      if (groupClass.trainerUserId) {
        const trainer = await User.findById(groupClass.trainerUserId).select("firstName lastName fullName email");
        if (trainer) {
          details.trainer = {
            id: trainer._id,
            name: trainer.fullName,
            firstName: trainer.firstName,
            lastName: trainer.lastName,
            email: trainer.email
          };
        }
      }
    } else if (booking.type === "personal_training" && booking.trainerId) {
      const trainer = booking.trainerId as any;
      details.trainer = {
        id: trainer._id,
        name: trainer.fullName,
        firstName: trainer.firstName,
        lastName: trainer.lastName,
        email: trainer.email,
        address: trainer.address
      };
      details.startTime = booking.startTime;
      details.endTime = booking.endTime;
      details.duration = booking.startTime && booking.endTime 
        ? Math.round((booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60)) 
        : null;
    }

    return res.json(details);
  } catch (error) {
    console.error("Napaka pri pridobivanju podrobnosti rezervacije:", error);
    return res.status(500).json({ message: "Napaka strežnika" });
  }
});

export default router;
