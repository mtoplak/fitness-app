import { Router } from "express";
import { GroupClass } from "../models/GroupClass.js";
import { Booking } from "../models/Booking.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { authenticateJwt, AuthRequest } from "../middleware/auth.js";
import { sendNewClassNotificationToAdmin, sendClassStatusNotificationToTrainer } from "../services/emailService.js";

const router = Router();

function checkScheduleOverlap(
  schedule1: Array<{ dayOfWeek: number; startTime: string; endTime: string }>,
  schedule2: Array<{ dayOfWeek: number; startTime: string; endTime: string }>
): boolean {
  for (const slot1 of schedule1) {
    for (const slot2 of schedule2) {
      if (slot1.dayOfWeek === slot2.dayOfWeek) {
        const start1 = timeToMinutes(slot1.startTime);
        const end1 = timeToMinutes(slot1.endTime);
        const start2 = timeToMinutes(slot2.startTime);
        const end2 = timeToMinutes(slot2.endTime);
        
        if (start1 < end2 && end1 > start2) {
          return true;
        }
      }
    }
  }
  return false;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

router.get("/", async (req, res) => {
  try {
    const filter = { status: "approved" };
    
    const classes = await GroupClass.find(filter)
      .populate("trainerUserId", "firstName lastName fullName email")
      .lean();
    return res.json(classes);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

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

router.get("/:id/availability/:date", async (req, res) => {
  try {
    const { id, date } = req.params;
    
    const groupClass = await GroupClass.findById(id);
    if (!groupClass) {
      return res.status(404).json({ message: "Vadba ni najdena" });
    }

    const [year, month, day] = date.split('-').map(Number);
    const classDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
    const nextDay = new Date(classDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const bookingsCount = await Booking.countDocuments({
      groupClassId: id,
      classDate: { $gte: classDate, $lt: nextDay },
      status: { $in: ["confirmed"] }
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

router.get("/:id/participants/:date", authenticateJwt, async (req: AuthRequest, res) => {
  try {
    const { id, date } = req.params;
    const user = req.user!;

    if (user.role !== "trainer" && user.role !== "admin") {
      return res.status(403).json({ message: "Samo trenerji lahko vidijo udeležence vadbe" });
    }

    const groupClass = await GroupClass.findById(id);
    if (!groupClass) {
      return res.status(404).json({ message: "Vadba ni najdena" });
    }

    const [year, month, day] = date.split('-').map(Number);
    const classDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
    const nextDay = new Date(classDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    console.log("Searching for bookings between:", classDate, "and", nextDay);

    const bookings = await Booking.find({
      groupClassId: id,
      classDate: { $gte: classDate, $lt: nextDay },
      status: "confirmed"
    })
    .populate("userId", "firstName lastName fullName email")
    .sort({ createdAt: 1 })
    .lean();

    console.log("Found bookings:", bookings.length);

    const participants = bookings.map((booking: any) => ({
      id: booking._id,
      user: {
        id: booking.userId._id,
        firstName: booking.userId.firstName,
        lastName: booking.userId.lastName,
        fullName: booking.userId.fullName,
        email: booking.userId.email
      },
      bookedAt: booking.createdAt
    }));

    const capacity = groupClass.capacity || 0;

    return res.json({
      className: groupClass.name,
      classDate: date,
      capacity,
      totalParticipants: participants.length,
      availableSpots: Math.max(0, capacity - participants.length),
      participants
    });
  } catch (err) {
    console.error("Napaka pri pridobivanju udeležencev:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/book", authenticateJwt, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { classDate } = req.body;
    const userId = req.user!._id;
    const user = req.user!;

    if (user.role !== "member") {
      return res.status(403).json({ message: "Samo člani lahko rezervirajo vadbe" });
    }

    const groupClass = await GroupClass.findById(id);
    if (!groupClass) {
      return res.status(404).json({ message: "Vadba ni najdena" });
    }

    console.log("Received classDate:", classDate, "Type:", typeof classDate);
    let bookingDate: Date;
    
    if (typeof classDate === 'string' && classDate.includes('-')) {
      const [year, month, day] = classDate.split('-').map(Number);
      bookingDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0)); // Uporabi poldne UTC
    } else {
      // Fallback če pride v drugem formatu
      bookingDate = new Date(classDate);
      bookingDate.setUTCHours(12, 0, 0, 0); // Nastavi na poldne UTC
    }
    
    const nextDay = new Date(bookingDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    console.log("Parsed booking date (UTC):", bookingDate.toISOString());
    console.log("Looking for bookings between:", bookingDate.toISOString(), "and", nextDay.toISOString());

    const existingBooking = await Booking.findOne({
      userId,
      groupClassId: id,
      classDate: { $gte: bookingDate, $lt: nextDay },
      status: { $in: ["confirmed"] }
    });

    if (existingBooking) {
      return res.status(400).json({ message: "Že imate rezervacijo za to vadbo na ta dan" });
    }

    const bookingsCount = await Booking.countDocuments({
      groupClassId: id,
      classDate: { $gte: bookingDate, $lt: nextDay },
      status: { $in: ["confirmed"] }
    });

    console.log("Existing bookings for this date:", bookingsCount);

    const capacity = groupClass.capacity || 0;
    if (bookingsCount >= capacity) {
      return res.status(400).json({ message: "Ni več prostih mest za to vadbo" });
    }

    console.log("Creating booking with date:", bookingDate.toISOString());

    const booking = await Booking.create({
      userId,
      type: "group_class",
      status: "confirmed",
      groupClassId: id,
      classDate: bookingDate
    });

    console.log("Booking created with classDate:", booking.classDate);

    try {
      const dayOfWeek = bookingDate.getUTCDay();
      const timeSlot = groupClass.schedule.find(slot => slot.dayOfWeek === dayOfWeek);
      
      if (timeSlot) {
        const [hours, minutes] = timeSlot.startTime.split(':').map(Number);
        const classDateTime = new Date(bookingDate);
        classDateTime.setUTCHours(hours, minutes, 0, 0);
        
        const reminderTime = new Date(classDateTime);
        reminderTime.setHours(reminderTime.getHours() - 24);

        await Notification.create({
          userId,
          type: "reminder",
          title: `Opomnik: ${groupClass.name}`,
          message: `Opominjamo vas na vadbo ${groupClass.name} jutri ob ${timeSlot.startTime}.`,
          status: "pending",
          scheduledFor: reminderTime,
          bookingId: booking._id
        });

        console.log("Reminder created for:", reminderTime.toISOString());
      }
    } catch (reminderErr) {
      console.error("Napaka pri ustvarjanju opomnika:", reminderErr);
    }

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

router.get("/my-classes/list", authenticateJwt, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    if (user.role !== "trainer") {
      return res.status(403).json({ message: "Samo trenerji lahko dostopajo do svojih vadb" });
    }

    const classes = await GroupClass.find({ trainerUserId: user._id })
      .sort({ name: 1 })
      .lean();

    return res.json({ classes });
  } catch (err) {
    console.error("Napaka pri pridobivanju vadb:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/create", authenticateJwt, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    if (user.role !== "trainer") {
      return res.status(403).json({ message: "Samo trenerji lahko ustvarjajo vadbe" });
    }

    const { name, description, difficulty, duration, capacity, schedule } = req.body;

    if (!name || !schedule || schedule.length === 0) {
      return res.status(400).json({ message: "Ime vadbe in urnik sta obvezna" });
    }

    const trainerClasses = await GroupClass.find({
      trainerUserId: user._id,
      status: { $in: ["pending", "approved"] }
    });

    for (const existingClass of trainerClasses) {
      if (checkScheduleOverlap(schedule, existingClass.schedule)) {
        return res.status(400).json({ 
          message: `Urnik se prekriva z vadbo "${existingClass.name}". Prosimo, izberite drug termin.` 
        });
      }
    }

    const newClass = await GroupClass.create({
      name,
      description: description || "",
      difficulty: difficulty || "medium",
      duration: duration || 60,
      capacity: capacity || 20,
      schedule,
      trainerUserId: user._id,
      status: "pending"
    });

    console.log("Nova vadba ustvarjena:", newClass._id);

    try {
      await sendNewClassNotificationToAdmin({
        className: name,
        trainerName: user.fullName,
        trainerEmail: user.email,
        description,
        capacity: capacity || 20,
        schedule
      });
      console.log("Email obvestilo poslano adminu");
    } catch (emailErr) {
      console.error("Napaka pri pošiljanju emaila:", emailErr);
    }

    return res.status(201).json({
      message: "Vadba uspešno ustvarjena in poslana v pregled",
      class: newClass
    });
  } catch (err) {
    console.error("Napaka pri ustvarjanju vadbe:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id/update", authenticateJwt, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    if (user.role !== "trainer") {
      return res.status(403).json({ message: "Samo trenerji lahko urejajo vadbe" });
    }

    const groupClass = await GroupClass.findById(id);
    if (!groupClass) {
      return res.status(404).json({ message: "Vadba ni najdena" });
    }

    if (groupClass.trainerUserId?.toString() !== (user._id as any).toString()) {
      return res.status(403).json({ message: "Lahko urejate samo svoje vadbe" });
    }

    const { name, description, difficulty, duration, capacity, schedule } = req.body;

    if (!name || !schedule || schedule.length === 0) {
      return res.status(400).json({ message: "Ime vadbe in urnik sta obvezna" });
    }

    const trainerClasses = await GroupClass.find({
      trainerUserId: user._id,
      _id: { $ne: id },
      status: { $in: ["pending", "approved"] }
    });

    for (const existingClass of trainerClasses) {
      if (checkScheduleOverlap(schedule, existingClass.schedule)) {
        return res.status(400).json({ 
          message: `Urnik se prekriva z vadbo "${existingClass.name}". Prosimo, izberite drug termin.` 
        });
      }
    }

    const previousStatus = groupClass.status;

    if (name) groupClass.name = name;
    if (description !== undefined) groupClass.description = description;
    if (difficulty) groupClass.difficulty = difficulty;
    if (duration) groupClass.duration = duration;
    if (capacity) groupClass.capacity = capacity;
    if (schedule) {
      groupClass.schedule = schedule;
      if (previousStatus === "approved") {
        groupClass.status = "pending";
      }
    }

    await groupClass.save();

    console.log("Vadba posodobljena:", groupClass._id);

    if (previousStatus === "approved" && groupClass.status === "pending") {
      try {
        await sendNewClassNotificationToAdmin({
          className: `${name} (POSODOBLJENA)`,
          trainerName: user.fullName,
          trainerEmail: user.email,
          description: description || "",
          capacity: capacity || 20,
          schedule
        });
        console.log("Email obvestilo poslano adminu o posodobitvi vadbe");
      } catch (emailErr) {
        console.error("Napaka pri pošiljanju emaila:", emailErr);
      }
    }

    return res.json({
      message: groupClass.status === "pending" 
        ? "Vadba posodobljena in poslana v pregled administratorju"
        : "Vadba uspešno posodobljena",
      class: groupClass
    });
  } catch (err) {
    console.error("Napaka pri posodabljanju vadbe:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id/delete", authenticateJwt, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    if (user.role !== "trainer") {
      return res.status(403).json({ message: "Samo trenerji lahko brišejo vadbe" });
    }

    const groupClass = await GroupClass.findById(id);
    if (!groupClass) {
      return res.status(404).json({ message: "Vadba ni najdena" });
    }

    if (groupClass.trainerUserId?.toString() !== (user._id as any).toString()) {
      return res.status(403).json({ message: "Lahko brišete samo svoje vadbe" });
    }

    const activeBookings = await Booking.countDocuments({
      groupClassId: id,
      status: "confirmed",
      classDate: { $gte: new Date() }
    });

    if (activeBookings > 0) {
      return res.status(400).json({ 
        message: `Ne morete izbrisati vadbe z aktivnimi rezervacijami (${activeBookings})` 
      });
    }

    await GroupClass.findByIdAndDelete(id);

    console.log("Vadba izbrisana:", id);

    return res.json({ message: "Vadba uspešno izbrisana" });
  } catch (err) {
    console.error("Napaka pri brisanju vadbe:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;

