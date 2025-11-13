import { connectToDatabase } from "../db.js";
import { User } from "../models/User.js";
import { GroupClass } from "../models/GroupClass.js";
import { Booking } from "../models/Booking.js";
import { Notification } from "../models/Notification.js";
import { sendClassReminder } from "../services/emailService.js";
import { env } from "../config/env.js";

async function testEmailReminder() {
  console.log("🧪 Testing email reminder functionality...\n");

  try {
    // Poveži se z bazo
    await connectToDatabase();

    // 1. Najdi testnega uporabnika (member)
    const testUser = await User.findOne({ role: "member" });
    if (!testUser) {
      console.error("❌ No member user found in database");
      process.exit(1);
    }
    console.log(`✅ Found test user: ${testUser.fullName} (${testUser.email})`);

    // 2. Najdi testno vadbo
    const testClass = await GroupClass.findOne();
    if (!testClass) {
      console.error("❌ No group class found in database");
      process.exit(1);
    }
    console.log(`✅ Found test class: ${testClass.name}`);

    // 3. Ustvari testno rezervacijo za jutri
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setUTCHours(12, 0, 0, 0);

    console.log(`\n📅 Creating test booking for: ${tomorrow.toISOString()}`);

    const testBooking = await Booking.create({
      userId: testUser._id,
      type: "group_class",
      status: "confirmed",
      groupClassId: testClass._id,
      classDate: tomorrow
    });

    console.log(`✅ Booking created with ID: ${testBooking._id}`);

    // 4. Najdi ustrezen time slot
    const dayOfWeek = tomorrow.getUTCDay();
    const timeSlot = testClass.schedule.find(slot => slot.dayOfWeek === dayOfWeek);

    if (!timeSlot) {
      console.error(`❌ No time slot found for day ${dayOfWeek}`);
      // Uporabi prvi slot kot fallback
      const fallbackSlot = testClass.schedule[0];
      console.log(`⚠️  Using fallback slot: ${fallbackSlot.startTime} - ${fallbackSlot.endTime}`);
      
      // 5. Pošlji testni email TAKOJ (ne čakaj 24h)
      console.log(`\n📧 Sending test email to: ${env.emailTestRecipient}`);
      
      await sendClassReminder(
        testUser.email,
        testUser.fullName || `${testUser.firstName} ${testUser.lastName}`,
        testClass.name,
        tomorrow,
        fallbackSlot.startTime,
        fallbackSlot.endTime
      );
    } else {
      console.log(`✅ Found time slot: ${timeSlot.startTime} - ${timeSlot.endTime}`);

      // 5. Pošlji testni email TAKOJ (ne čakaj 24h)
      console.log(`\n📧 Sending test email to: ${env.emailTestRecipient}`);
      
      await sendClassReminder(
        testUser.email,
        testUser.fullName || `${testUser.firstName} ${testUser.lastName}`,
        testClass.name,
        tomorrow,
        timeSlot.startTime,
        timeSlot.endTime
      );
    }

    console.log(`✅ Email sent successfully!`);

    // 6. Ustvari tudi notification zapis (za test cron job-a)
    const reminderTime = new Date(tomorrow);
    reminderTime.setHours(reminderTime.getHours() - 24); // 24 ur prej

    const notification = await Notification.create({
      userId: testUser._id,
      type: "reminder",
      title: `Opomnik: ${testClass.name}`,
      message: `Opominjamo vas na vadbo ${testClass.name} jutri ob ${timeSlot?.startTime || testClass.schedule[0].startTime}.`,
      status: "pending",
      scheduledFor: reminderTime,
      bookingId: testBooking._id
    });

    console.log(`✅ Notification created with ID: ${notification._id}`);
    console.log(`   Scheduled for: ${reminderTime.toISOString()}`);

    console.log(`\n✅ Test completed successfully!`);
    console.log(`\n📋 Summary:`);
    console.log(`   - User: ${testUser.fullName} (${testUser.email})`);
    console.log(`   - Class: ${testClass.name}`);
    console.log(`   - Date: ${tomorrow.toLocaleDateString('sl-SI')}`);
    console.log(`   - Booking ID: ${testBooking._id}`);
    console.log(`   - Notification ID: ${notification._id}`);
    console.log(`\n📧 Check email at: ${env.emailTestRecipient}`);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

testEmailReminder();
