import cron from "node-cron";
import { Notification } from "../models/Notification.js";
import { GroupClass } from "../models/GroupClass.js";
import { sendClassReminder } from "../services/emailService.js";

export function startReminderJob() {
  cron.schedule("0 * * * *", async () => {
    console.log("Checking for pending reminders...");
    
    try {
      const now = new Date();
      
      const pendingReminders = await Notification.find({
        type: "reminder",
        status: "pending",
        scheduledFor: { $lte: now }
      }).populate("userId bookingId");

      console.log(`Found ${pendingReminders.length} reminders to send`);

      for (const reminder of pendingReminders) {
        try {
          const user = reminder.userId as any;
          const booking = reminder.bookingId as any;

          if (!user || !booking) {
            console.error(`Missing user or booking for reminder ${reminder._id}`);
            await Notification.findByIdAndUpdate(reminder._id, { 
              status: "failed",
              sentAt: now
            });
            continue;
          }

          const groupClass = await GroupClass.findById(booking.groupClassId);
          if (!groupClass) {
            console.error(`Missing group class for reminder ${reminder._id}`);
            await Notification.findByIdAndUpdate(reminder._id, { 
              status: "failed",
              sentAt: now
            });
            continue;
          }

          const dayOfWeek = booking.classDate.getUTCDay();
          const timeSlot = groupClass.schedule.find((slot: any) => slot.dayOfWeek === dayOfWeek);

          if (!timeSlot) {
            console.error(`Missing time slot for reminder ${reminder._id}`);
            await Notification.findByIdAndUpdate(reminder._id, { 
              status: "failed",
              sentAt: now
            });
            continue;
          }

          const classDate = new Date(booking.classDate);

          await sendClassReminder(
            user.email,
            user.fullName || `${user.firstName} ${user.lastName}`,
            groupClass.name,
            classDate,
            timeSlot.startTime,
            timeSlot.endTime
          );

          await Notification.findByIdAndUpdate(reminder._id, { 
            status: "sent",
            sentAt: now
          });

          const dateStr = classDate.toLocaleDateString('sl-SI', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          console.log(`Reminder sent to ${user.email} for ${groupClass.name} on ${dateStr}`);
        } catch (err) {
          console.error(`Error sending reminder ${reminder._id}:`, err);
          
          await Notification.findByIdAndUpdate(reminder._id, { 
            status: "failed",
            sentAt: now
          });
        }
      }

      console.log("Reminder job completed");
    } catch (error) {
      console.error("Error in reminder job:", error);
    }
  });

  console.log("Reminder job scheduled - runs every hour at minute 0");
}
