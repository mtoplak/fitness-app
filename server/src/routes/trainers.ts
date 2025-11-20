import { Router } from "express";
import { User } from "../models/User.js";
import { TrainerProfile } from "../models/TrainerProfile.js";
import { Booking } from "../models/Booking.js";
import { authenticateJwt, AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const trainerProfiles = await TrainerProfile.find({
      trainerType: { $in: ["personal", "both"] }
    })
      .populate("userId", "firstName lastName fullName email")
      .lean();

    const trainers = trainerProfiles.map((profile: any) => ({
      id: profile.userId._id,
      firstName: profile.userId.firstName,
      lastName: profile.userId.lastName,
      fullName: profile.userId.fullName,
      email: profile.userId.email,
      hourlyRate: profile.hourlyRate,
      trainerType: profile.trainerType
    }));

    return res.json(trainers);
  } catch (err) {
    console.error("Napaka pri pridobivanju trenerjev:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/:trainerId/availability", async (req, res) => {
  try {
    const { trainerId } = req.params;
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
      return res.status(400).json({ message: "Datum je obvezen parameter (YYYY-MM-DD)" });
    }

    const trainer = await User.findById(trainerId);
    if (!trainer || trainer.role !== "trainer") {
      return res.status(404).json({ message: "Trener ni najden" });
    }

    const trainerProfile = await TrainerProfile.findOne({ userId: trainerId });
    if (!trainerProfile || !["personal", "both"].includes(trainerProfile.trainerType)) {
      return res.status(404).json({ message: "Trener ne nudi osebnih treningov" });
    }

    const [year, month, day] = date.split('-').map(Number);
    const selectedDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const nextDay = new Date(selectedDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const existingBookings = await Booking.find({
      trainerId,
      type: "personal_training",
      status: "confirmed",
      startTime: { $gte: selectedDate, $lt: nextDay }
    })
      .sort({ startTime: 1 })
      .lean();

    const availableSlots = [];
    const occupiedSlots = existingBookings.map((booking: any) => ({
      start: new Date(booking.startTime),
      end: new Date(booking.endTime)
    }));

    for (let hour = 8; hour < 20; hour++) {
      const slotStart = new Date(selectedDate);
      slotStart.setUTCHours(hour, 0, 0, 0);
      
      const slotEnd = new Date(slotStart);
      slotEnd.setUTCHours(hour + 1, 0, 0, 0);

      // Preveri ali je slot zaseden
      const isOccupied = occupiedSlots.some(occupied => {
        return (slotStart < occupied.end && slotEnd > occupied.start);
      });

      availableSlots.push({
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        available: !isOccupied,
        displayTime: `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`
      });
    }

    return res.json({
      trainerId,
      trainerName: trainer.fullName || `${trainer.firstName} ${trainer.lastName}`,
      date,
      hourlyRate: trainerProfile.hourlyRate,
      slots: availableSlots
    });
  } catch (err) {
    console.error("Napaka pri pridobivanju razpoložljivosti:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/:trainerId/book", authenticateJwt, async (req: AuthRequest, res) => {
  try {
    const { trainerId } = req.params;
    const { startTime, endTime, notes } = req.body;
    const userId = req.user!._id;
    const user = req.user!;

    if (user.role !== "member") {
      return res.status(403).json({ message: "Samo člani lahko rezervirajo osebne treninge" });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({ message: "Začetni in končni čas sta obvezna" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Neveljaven format datuma" });
    }

    if (start >= end) {
      return res.status(400).json({ message: "Končni čas mora biti po začetnem času" });
    }

    if (start < new Date()) {
      return res.status(400).json({ message: "Ne morete rezervirati termina v preteklosti" });
    }

    const trainer = await User.findById(trainerId);
    if (!trainer || trainer.role !== "trainer") {
      return res.status(404).json({ message: "Trener ni najden" });
    }

    const trainerProfile = await TrainerProfile.findOne({ userId: trainerId });
    if (!trainerProfile || !["personal", "both"].includes(trainerProfile.trainerType)) {
      return res.status(404).json({ message: "Trener ne nudi osebnih treningov" });
    }

    const userConflict = await Booking.findOne({
      userId,
      type: "personal_training",
      status: "confirmed",
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } }
      ]
    });

    if (userConflict) {
      return res.status(400).json({ message: "Že imate rezervacijo v tem časovnem obdobju" });
    }

    const trainerConflict = await Booking.findOne({
      trainerId,
      type: "personal_training",
      status: "confirmed",
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } }
      ]
    });

    if (trainerConflict) {
      return res.status(400).json({ message: "Trener je v tem času že zaseden" });
    }

    const booking = await Booking.create({
      userId,
      type: "personal_training",
      status: "confirmed",
      trainerId,
      startTime: start,
      endTime: end,
      notes: notes || ""
    });

    console.log("Personal training booking created:", booking._id);

    return res.status(201).json({
      message: "Osebni trening uspešno rezerviran",
      booking: {
        id: booking._id,
        trainerId,
        trainerName: trainer.fullName || `${trainer.firstName} ${trainer.lastName}`,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        hourlyRate: trainerProfile.hourlyRate
      }
    });
  } catch (err) {
    console.error("Napaka pri rezervaciji osebnega treninga:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/my-bookings", authenticateJwt, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    if (user.role !== "trainer") {
      return res.status(403).json({ message: "Samo trenerji lahko dostopajo do tega endpointa" });
    }

    const { upcoming } = req.query;

    const query: any = {
      trainerId: user._id,
      type: "personal_training",
      status: "confirmed"
    };

    if (upcoming === "true") {
      query.startTime = { $gte: new Date() };
    }

    const bookings = await Booking.find(query)
      .populate("userId", "firstName lastName fullName email")
      .sort({ startTime: 1 })
      .lean();

    const formattedBookings = bookings.map((booking: any) => ({
      id: booking._id,
      client: {
        id: booking.userId._id,
        firstName: booking.userId.firstName,
        lastName: booking.userId.lastName,
        fullName: booking.userId.fullName,
        email: booking.userId.email
      },
      startTime: booking.startTime,
      endTime: booking.endTime,
      notes: booking.notes || "",
      status: booking.status,
      createdAt: booking.createdAt
    }));

    return res.json({ bookings: formattedBookings });
  } catch (err) {
    console.error("Napaka pri pridobivanju treningov:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
