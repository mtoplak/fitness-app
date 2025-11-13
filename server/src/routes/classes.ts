import { Router } from "express";
import { GroupClass } from "../models/GroupClass.js";
import { Booking } from "../models/Booking.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
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

    // Pretvori datum v Date objekt - uporabi UTC poldne da se izognemo težavam s časovnimi conami
    const [year, month, day] = date.split('-').map(Number);
    const classDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
    const nextDay = new Date(classDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

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

// GET /classes/:id/participants/:date -> pridobi seznam udeležencev za določen datum
router.get("/:id/participants/:date", authenticateJwt, async (req: AuthRequest, res) => {
  try {
    const { id, date } = req.params;
    const user = req.user!;

    // Samo trenerji in admini lahko vidijo udeležence
    if (user.role !== "trainer" && user.role !== "admin") {
      return res.status(403).json({ message: "Samo trenerji lahko vidijo udeležence vadbe" });
    }

    const groupClass = await GroupClass.findById(id);
    if (!groupClass) {
      return res.status(404).json({ message: "Vadba ni najdena" });
    }

    // Pretvori datum v Date objekt - uporabi UTC poldne da se izognemo težavam s časovnimi conami
    const [year, month, day] = date.split('-').map(Number);
    const classDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
    const nextDay = new Date(classDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    console.log("Searching for bookings between:", classDate, "and", nextDay);

    // Pridobi vse rezervacije za ta datum z uporabniškimi podatki
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

    console.log("Received classDate:", classDate, "Type:", typeof classDate);

    // Preveri datum - parsiramo datum kot YYYY-MM-DD
    // Uporabimo Date.UTC da direktno ustvarimo UTC datum brez pretvorb časovnih con
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

    console.log("Existing bookings for this date:", bookingsCount);

    const capacity = groupClass.capacity || 0;
    if (bookingsCount >= capacity) {
      return res.status(400).json({ message: "Ni več prostih mest za to vadbo" });
    }

    console.log("Creating booking with date:", bookingDate.toISOString());

    // Ustvari rezervacijo
    const booking = await Booking.create({
      userId,
      type: "group_class",
      status: "confirmed",
      groupClassId: id,
      classDate: bookingDate
    });

    console.log("Booking created with classDate:", booking.classDate);

    // Ustvari opomnik (pošlje se 24 ur pred vadbo)
    try {
      // Najdi ustrezen time slot za ta dan v tednu
      const dayOfWeek = bookingDate.getUTCDay();
      const timeSlot = groupClass.schedule.find(slot => slot.dayOfWeek === dayOfWeek);
      
      if (timeSlot) {
        // Izračunaj čas pošiljanja (24 ur pred vadbo)
        const [hours, minutes] = timeSlot.startTime.split(':').map(Number);
        const classDateTime = new Date(bookingDate);
        classDateTime.setUTCHours(hours, minutes, 0, 0);
        
        const reminderTime = new Date(classDateTime);
        reminderTime.setHours(reminderTime.getHours() - 24); // 24 ur prej

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
      // Ne vrnemo napake, ker je booking uspel
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

// GET /classes/my-classes/list -> trener pridobi svoje vadbe
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

// POST /classes/create -> trener ustvari novo vadbo
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

    const newClass = await GroupClass.create({
      name,
      description: description || "",
      difficulty: difficulty || "medium",
      duration: duration || 60,
      capacity: capacity || 20,
      schedule,
      trainerUserId: user._id
    });

    console.log("Nova vadba ustvarjena:", newClass._id);

    return res.status(201).json({
      message: "Vadba uspešno ustvarjena",
      class: newClass
    });
  } catch (err) {
    console.error("Napaka pri ustvarjanju vadbe:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// PUT /classes/:id/update -> trener posodobi vadbo
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

    // Preveri ali je to vadba tega trenerja
    if (groupClass.trainerUserId?.toString() !== (user._id as any).toString()) {
      return res.status(403).json({ message: "Lahko urejate samo svoje vadbe" });
    }

    const { name, description, difficulty, duration, capacity, schedule } = req.body;

    // Posodobi polja
    if (name) groupClass.name = name;
    if (description !== undefined) groupClass.description = description;
    if (difficulty) groupClass.difficulty = difficulty;
    if (duration) groupClass.duration = duration;
    if (capacity) groupClass.capacity = capacity;
    if (schedule) groupClass.schedule = schedule;

    await groupClass.save();

    console.log("Vadba posodobljena:", groupClass._id);

    return res.json({
      message: "Vadba uspešno posodobljena",
      class: groupClass
    });
  } catch (err) {
    console.error("Napaka pri posodabljanju vadbe:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// DELETE /classes/:id/delete -> trener izbriše vadbo
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

    // Preveri ali je to vadba tega trenerja
    if (groupClass.trainerUserId?.toString() !== (user._id as any).toString()) {
      return res.status(403).json({ message: "Lahko brišete samo svoje vadbe" });
    }

    // Preveri če ima vadba aktivne rezervacije
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

