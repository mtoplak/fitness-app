import { Router } from "express";
import { Membership, MembershipPackage } from "../models/Membership.js";
import { Booking } from "../models/Booking.js";
import { GroupClass } from "../models/GroupClass.js";
import { authenticateJwt, AuthRequest } from "../middleware/auth.js";

const router = Router();

const requireAdmin = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Dostop zavrnjen - potrebne so admin pravice" });
  }
  next();
};

router.get("/revenue", authenticateJwt, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate } = req.query;

    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(end.getFullYear(), end.getMonth() - 11, 1);

    const packages = await MembershipPackage.find().lean();

    const memberships = await Membership.find({
      $or: [
        { startDate: { $gte: start, $lte: end } },
        { endDate: { $gte: start } }
      ]
    })
      .populate("packageId")
      .populate("userId", "fullName email")
      .lean();

    const subscriptionsByPackage = packages.map(pkg => {
      const count = memberships.filter(m => {
        const packageId = (m.packageId as any)?._id?.toString() || m.packageId?.toString();
        return packageId === pkg._id.toString();
      }).length;

      return {
        packageName: pkg.name,
        price: pkg.price,
        count,
        revenue: count * pkg.price
      };
    });

    const monthlyRevenue = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const monthMemberships = memberships.filter(m => {
        const mStart = new Date(m.startDate);
        const mEnd = new Date(m.endDate);
        return (mStart <= monthEnd && mEnd >= monthStart);
      });

      const revenue = monthMemberships.reduce((sum, m) => {
        const pkg = m.packageId as any;
        return sum + (pkg?.price || 0);
      }, 0);

      monthlyRevenue.push({
        month: currentDate.toLocaleDateString('sl-SI', { year: 'numeric', month: 'long' }),
        year: currentDate.getFullYear(),
        monthNumber: currentDate.getMonth() + 1,
        revenue,
        activeMemberships: monthMemberships.length
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    const totalRevenue = subscriptionsByPackage.reduce((sum, pkg) => sum + pkg.revenue, 0);

    return res.json({
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      totalRevenue,
      subscriptionsByPackage,
      monthlyRevenue,
      totalActiveMemberships: memberships.filter(m => m.status === "active").length
    });
  } catch (err) {
    console.error("Napaka pri pridobivanju prihodkov:", err);
    return res.status(500).json({ message: "Napaka strežnika" });
  }
});

router.get("/attendance", authenticateJwt, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate } = req.query;

    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const groupClasses = await GroupClass.find().lean();

    const bookings = await Booking.find({
      classDate: { $gte: start, $lte: end }
    })
      .populate("groupClassId", "name capacity")
      .lean();

    // Udeležba po skupinskih vadbah
    const groupClassAttendance = groupClasses.map(cls => {
      const classBookings = bookings.filter(b => {
        const classId = (b.groupClassId as any)?._id?.toString();
        return classId === cls._id.toString() && b.groupClassId;
      });

      const confirmedBookings = classBookings.filter(b => b.status !== "cancelled");
      const capacity = cls.capacity || 0;
      const occupancyRate = capacity > 0 ? (confirmedBookings.length / capacity) * 100 : 0;

      return {
        className: cls.name,
        capacity: cls.capacity,
        totalBookings: classBookings.length,
        confirmedBookings: confirmedBookings.length,
        cancelledBookings: classBookings.length - confirmedBookings.length,
        occupancyRate: Math.round(occupancyRate * 10) / 10,
        averageOccupancy: capacity > 0 ? Math.round((confirmedBookings.length / capacity) * 100) : 0
      };
    });

    const personalTrainingBookings = bookings.filter(b => !b.groupClassId);
    const confirmedPT = personalTrainingBookings.filter(b => b.status !== "cancelled");

    const dailyAttendance = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayBookings = bookings.filter(b => {
        if (!b.classDate) return false;
        const bookingDate = new Date(b.classDate);
        return bookingDate >= dayStart && bookingDate <= dayEnd;
      });

      const confirmedDay = dayBookings.filter(b => b.status !== "cancelled");

      dailyAttendance.push({
        date: currentDate.toISOString().split('T')[0],
        totalBookings: dayBookings.length,
        confirmedBookings: confirmedDay.length,
        groupClasses: dayBookings.filter(b => b.groupClassId).length,
        personalTraining: dayBookings.filter(b => !b.groupClassId).length
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Povprečna zapolnjenost
    const totalCapacity = groupClasses.reduce((sum, cls) => sum + (cls.capacity || 0), 0);
    const totalOccupied = groupClassAttendance.reduce((sum, cls) => sum + cls.confirmedBookings, 0);
    const overallOccupancyRate = totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0;

    return res.json({
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      summary: {
        totalBookings: bookings.length,
        confirmedBookings: bookings.filter(b => b.status !== "cancelled").length,
        cancelledBookings: bookings.filter(b => b.status === "cancelled").length,
        groupClassBookings: bookings.filter(b => b.groupClassId).length,
        personalTrainingBookings: personalTrainingBookings.length,
        confirmedPersonalTraining: confirmedPT.length,
        overallOccupancyRate: Math.round(overallOccupancyRate * 10) / 10
      },
      groupClassAttendance,
      dailyAttendance,
      personalTraining: {
        total: personalTrainingBookings.length,
        confirmed: confirmedPT.length,
        cancelled: personalTrainingBookings.length - confirmedPT.length
      }
    });
  } catch (err) {
    console.error("Napaka pri pridobivanju udeležbe:", err);
    return res.status(500).json({ message: "Napaka strežnika" });
  }
});

router.get("/summary", authenticateJwt, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate } = req.query;

    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(end.getFullYear(), end.getMonth() - 11, 1);

    // Prihodki
    const memberships = await Membership.find({
      $or: [
        { startDate: { $gte: start, $lte: end } },
        { endDate: { $gte: start } }
      ]
    }).populate("packageId").lean();

    const totalRevenue = memberships.reduce((sum, m) => {
      const pkg = m.packageId as any;
      return sum + (pkg?.price || 0);
    }, 0);

    // Rezervacije
    const bookings = await Booking.find({
      classDate: { $gte: start, $lte: end }
    }).lean();

    const confirmedBookings = bookings.filter(b => b.status !== "cancelled");

    // Skupinske vadbe
    const groupClasses = await GroupClass.find().lean();
    const totalCapacity = groupClasses.reduce((sum, cls) => sum + (cls.capacity || 0), 0);
    const groupBookings = bookings.filter(b => b.groupClassId);
    const confirmedGroupBookings = groupBookings.filter(b => b.status !== "cancelled");
    const occupancyRate = totalCapacity > 0 ? (confirmedGroupBookings.length / totalCapacity) * 100 : 0;

    return res.json({
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      revenue: {
        total: totalRevenue,
        activeMemberships: memberships.filter(m => m.status === "active").length,
        totalMemberships: memberships.length
      },
      attendance: {
        totalBookings: bookings.length,
        confirmedBookings: confirmedBookings.length,
        cancelledBookings: bookings.length - confirmedBookings.length,
        groupClassBookings: groupBookings.length,
        personalTrainingBookings: bookings.filter(b => !b.groupClassId).length,
        occupancyRate: Math.round(occupancyRate * 10) / 10
      }
    });
  } catch (err) {
    console.error("Napaka pri pridobivanju povzetka:", err);
    return res.status(500).json({ message: "Napaka strežnika" });
  }
});

export default router;
