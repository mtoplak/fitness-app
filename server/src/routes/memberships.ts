import { Router } from "express";
import { authenticateJwt, AuthRequest } from "../middleware/auth.js";
import { Membership, MembershipPackage } from "../models/Membership.js";
import { Payment } from "../models/Payment.js";
import { User } from "../models/User.js";

const router = Router();

// GET /memberships/packages - pridobi vse razpoložljive pakete
router.get("/packages", async (_req, res) => {
  try {
    const packages = await MembershipPackage.find().sort({ price: 1 });
    return res.json({ packages });
  } catch (error) {
    console.error("Napaka pri pridobivanju paketov:", error);
    return res.status(500).json({ message: "Napaka strežnika" });
  }
});

// GET /memberships/current - pridobi trenutno naročnino
router.get("/current", authenticateJwt, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const user = req.user!;

    if (user.role !== "member") {
      return res.status(403).json({ message: "Samo člani imajo naročnine" });
    }

    const membership = await Membership.findOne({
      userId,
      status: { $in: ["active", "cancelled"] },
      endDate: { $gte: new Date() }
    })
      .populate("packageId")
      .populate("nextPackageId")
      .sort({ endDate: -1 });

    if (!membership) {
      return res.json({ membership: null });
    }

    const pkg = membership.packageId as any;
    const nextPkg = membership.nextPackageId as any;

    return res.json({
      membership: {
        id: membership._id,
        package: {
          id: pkg._id,
          name: pkg.name,
          price: pkg.price
        },
        startDate: membership.startDate,
        endDate: membership.endDate,
        autoRenew: membership.autoRenew,
        status: membership.status,
        nextPackage: nextPkg ? {
          id: nextPkg._id,
          name: nextPkg.name,
          price: nextPkg.price
        } : null,
        cancelledAt: membership.cancelledAt
      }
    });
  } catch (error) {
    console.error("Napaka pri pridobivanju naročnine:", error);
    return res.status(500).json({ message: "Napaka strežnika" });
  }
});

// GET /memberships/history - pridobi zgodovino naročnin
router.get("/history", authenticateJwt, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const user = req.user!;

    if (user.role !== "member") {
      return res.status(403).json({ message: "Samo člani imajo naročnine" });
    }

    const memberships = await Membership.find({ userId })
      .populate("packageId")
      .sort({ startDate: -1 });

    const formatted = memberships.map(m => {
      const pkg = m.packageId as any;
      return {
        id: m._id,
        package: {
          id: pkg._id,
          name: pkg.name,
          price: pkg.price
        },
        startDate: m.startDate,
        endDate: m.endDate,
        status: m.status,
        autoRenew: m.autoRenew,
        cancelledAt: m.cancelledAt,
        createdAt: m.createdAt
      };
    });

    return res.json({ memberships: formatted });
  } catch (error) {
    console.error("Napaka pri pridobivanju zgodovine:", error);
    return res.status(500).json({ message: "Napaka strežnika" });
  }
});

// GET /memberships/payments - pridobi plačila
router.get("/payments", authenticateJwt, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const user = req.user!;

    if (user.role !== "member") {
      return res.status(403).json({ message: "Samo člani imajo plačila" });
    }

    const payments = await Payment.find({ userId })
      .populate("membershipId")
      .sort({ createdAt: -1 });

    const formatted = payments.map(p => ({
      id: p._id,
      amount: p.amount,
      status: p.status,
      paymentMethod: p.paymentMethod,
      paymentDate: p.paymentDate,
      description: p.description,
      createdAt: p.createdAt
    }));

    return res.json({ payments: formatted });
  } catch (error) {
    console.error("Napaka pri pridobivanju plačil:", error);
    return res.status(500).json({ message: "Napaka strežnika" });
  }
});

// POST /memberships/subscribe - naroči se na paket
router.post("/subscribe", authenticateJwt, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const user = req.user!;
    const { packageId } = req.body;

    if (user.role !== "member") {
      return res.status(403).json({ message: "Samo člani se lahko naročijo" });
    }

    if (!packageId) {
      return res.status(400).json({ message: "Paket je obvezen" });
    }

    // Preveri, če paket obstaja
    const pkg = await MembershipPackage.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ message: "Paket ni najden" });
    }

    // Preveri, če ima uporabnik že aktivno naročnino
    const existingMembership = await Membership.findOne({
      userId,
      status: { $in: ["active", "cancelled"] },
      endDate: { $gte: new Date() }
    });

    if (existingMembership) {
      return res.status(400).json({ 
        message: "Imate že aktivno naročnino. Uporabite spremembo paketa." 
      });
    }

    // Ustvari novo naročnino
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const membership = await Membership.create({
      userId,
      packageId,
      startDate,
      endDate,
      autoRenew: true,
      status: "active"
    });

    // Ustvari plačilo
    await Payment.create({
      userId,
      membershipId: membership._id,
      amount: pkg.price,
      status: "completed",
      paymentDate: new Date(),
      description: `Naročnina: ${pkg.name}`,
      paymentMethod: "Kreditna kartica"
    });

    // Posodobi uporabnika
    await User.findByIdAndUpdate(userId, { membershipId: membership._id });

    return res.json({
      message: "Uspešno ste se naročili",
      membershipId: membership._id
    });
  } catch (error) {
    console.error("Napaka pri naročanju:", error);
    return res.status(500).json({ message: "Napaka strežnika" });
  }
});

// POST /memberships/change-package - spremeni paket (začne veljati po koncu trenutnega)
router.post("/change-package", authenticateJwt, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const user = req.user!;
    const { packageId } = req.body;

    if (user.role !== "member") {
      return res.status(403).json({ message: "Samo člani lahko spremenijo paket" });
    }

    if (!packageId) {
      return res.status(400).json({ message: "Paket je obvezen" });
    }

    // Preveri, če paket obstaja
    const pkg = await MembershipPackage.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ message: "Paket ni najden" });
    }

    // Najdi trenutno aktivno naročnino
    const currentMembership = await Membership.findOne({
      userId,
      status: { $in: ["active", "cancelled"] },
      endDate: { $gte: new Date() }
    });

    if (!currentMembership) {
      return res.status(400).json({ 
        message: "Nimate aktivne naročnine. Uporabite naročanje." 
      });
    }

    // Preveri, če že ima nastavljen naslednji paket
    if (currentMembership.nextPackageId) {
      // Posodobi naslednji paket
      currentMembership.nextPackageId = pkg._id as any;
      await currentMembership.save();
    } else {
      // Nastavi naslednji paket
      currentMembership.nextPackageId = pkg._id as any;
      await currentMembership.save();
    }

    return res.json({
      message: `Paket ${pkg.name} bo začel veljati ${currentMembership.endDate.toLocaleDateString('sl-SI')}`,
      effectiveDate: currentMembership.endDate
    });
  } catch (error) {
    console.error("Napaka pri spreminjanju paketa:", error);
    return res.status(500).json({ message: "Napaka strežnika" });
  }
});

// POST /memberships/cancel - prekliči naročnino (konča se ob poteku)
router.post("/cancel", authenticateJwt, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const user = req.user!;

    if (user.role !== "member") {
      return res.status(403).json({ message: "Samo člani lahko prekličejo naročnino" });
    }

    // Najdi trenutno aktivno naročnino
    const membership = await Membership.findOne({
      userId,
      status: "active",
      endDate: { $gte: new Date() }
    }).populate("packageId");

    if (!membership) {
      return res.status(400).json({ message: "Nimate aktivne naročnine" });
    }

    // Prekliči samodejno podaljševanje
    membership.autoRenew = false;
    membership.status = "cancelled";
    membership.cancelledAt = new Date();
    membership.nextPackageId = undefined;
    await membership.save();

    const pkg = membership.packageId as any;

    return res.json({
      message: `Naročnina ${pkg.name} bo potekla ${membership.endDate.toLocaleDateString('sl-SI')}. Do takrat imate še vedno dostop.`,
      endDate: membership.endDate
    });
  } catch (error) {
    console.error("Napaka pri preklicu naročnine:", error);
    return res.status(500).json({ message: "Napaka strežnika" });
  }
});

// POST /memberships/reactivate - reaktiviraj preklicano naročnino
router.post("/reactivate", authenticateJwt, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const user = req.user!;

    if (user.role !== "member") {
      return res.status(403).json({ message: "Samo člani lahko reaktivirajo naročnino" });
    }

    // Najdi preklicano naročnino
    const membership = await Membership.findOne({
      userId,
      status: "cancelled",
      endDate: { $gte: new Date() }
    }).populate("packageId");

    if (!membership) {
      return res.status(400).json({ 
        message: "Nimate preklicane naročnine, ki bi jo lahko reaktivirali" 
      });
    }

    // Reaktiviraj
    membership.autoRenew = true;
    membership.status = "active";
    membership.cancelledAt = undefined;
    await membership.save();

    return res.json({
      message: "Naročnina reaktivirana. Samodejno podaljševanje je ponovno omogočeno."
    });
  } catch (error) {
    console.error("Napaka pri reaktivaciji:", error);
    return res.status(500).json({ message: "Napaka strežnika" });
  }
});

export default router;
