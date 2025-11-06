import { Router } from "express";
import { GroupClass } from "../models/GroupClass.js";
import { Booking } from "../models/Booking.js";
import { User } from "../models/User.js";
import { authenticateJwt, AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /classes -> list all group classes with trainer info
router.get("/", async (_req, res) => {
  try {
    const classes = await GroupClass.find({})
      .populate("trainerUserId", "firstName lastName fullName email")
      .lean();
    return res.json(classes);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /classes/:id -> get single class with details
router.get("/:id", async (req, res) => {
  try {
    const groupClass = await GroupClass.findById(req.params.id)
      .populate("trainerUserId", "firstName lastName fullName email");
    
    if (!groupClass) {
      return res.status(404).json({ message: "Vadba ni najdena" });
    }

    return res.json(groupClass);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /classes/:id/availability/:date -> preveri prosta mesta za določen datum
router.get("/:id/availability/:date", async (req, res) => {
  try {
    const { id, date } = req.params;
    
    const groupClass = await GroupClass.findById(id);
    if (!groupClass) {
      return res.status(404).json({ message: "Vadba ni najdena" });
    }

    // Pretvori datum v Date objekt
    const classDate = new Date(date);
    classDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(classDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Preštej obstoječe rezervacije za ta datum
    const bookingsCount = await Booking.countDocuments({
      groupClassId: id,
      classDate: { $gte: classDate, $lt: nextDay },
      status: { $in: ["confirmed"] } // samo potrjene rezervacije
    });

    const capacity = groupClass.capacity || 0;
    const available = capacity - bookingsCount;

    return res.json({
      capacity,
      booked: bookingsCount,
      available: Math.max(0, available),
      isFull: available <= 0
    });
  } catch (err) {
    console.error("Napaka pri preverjanju razpoložljivosti:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /classes/:id/book -> rezerviraj vadbo
router.post("/:id/book", authenticateJwt, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { classDate } = req.body;
    const userId = req.user!._id;
    const user = req.user!;

    // Samo člani lahko rezervirajo
    if (user.role !== "member") {
      return res.status(403).json({ message: "Samo člani lahko rezervirajo vadbe" });
    }

    const groupClass = await GroupClass.findById(id);
    if (!groupClass) {
      return res.status(404).json({ message: "Vadba ni najdena" });
    }

    // Preveri datum
    const bookingDate = new Date(classDate);
    bookingDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(bookingDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Preveri, ali uporabnik že ima rezervacijo za ta datum in vadbo
    const existingBooking = await Booking.findOne({
      userId,
      groupClassId: id,
      classDate: { $gte: bookingDate, $lt: nextDay },
      status: { $in: ["confirmed"] }
    });

    if (existingBooking) {
      return res.status(400).json({ message: "Že imate rezervacijo za to vadbo na ta dan" });
    }

    // Preveri prosta mesta
    const bookingsCount = await Booking.countDocuments({
      groupClassId: id,
      classDate: { $gte: bookingDate, $lt: nextDay },
      status: { $in: ["confirmed"] }
    });

    const capacity = groupClass.capacity || 0;
    if (bookingsCount >= capacity) {
      return res.status(400).json({ message: "Ni več prostih mest za to vadbo" });
    }

    // Ustvari rezervacijo
    const booking = await Booking.create({
      userId,
      type: "group_class",
      status: "confirmed",
      groupClassId: id,
      classDate: bookingDate
    });

    return res.status(201).json({
      message: "Vadba uspešno rezervirana",
      booking: {
        id: booking._id,
        classDate: booking.classDate,
        status: booking.status
      }
    });
  } catch (err) {
    console.error("Napaka pri rezervaciji:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;

