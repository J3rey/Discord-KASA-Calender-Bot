const Event = require("../../models/Event");
const { parseScheduleArgs } = require("../utils/dateParser");
const { scheduleReminders } = require("../utils/reminderScheduler");

module.exports = {
  name: "schedule",
  description: "Schedule a new event",

  async execute(message, args) {
    const parsed = parseScheduleArgs(message.content);
    if (!parsed) {
      return message.reply(
        "Invalid format. Use `/schedule [event name] on the [dd/mm/yyyy] [HH:mmAM/PM] [Location]`"
      );
    }

    // Validate event date is in the future
    const now = new Date();
    if (parsed.date <= now) {
      return message.reply("Event date must be in the future.");
    }

    // Optional: Add reasonable limit (e.g., 2 years)
    const twoYearsFromNow = new Date(
      now.getTime() + 2 * 365 * 24 * 60 * 60 * 1000
    );
    if (parsed.date > twoYearsFromNow) {
      return message.reply(
        "Events cannot be scheduled more than 2 years in advance."
      );
    }

    const msPerDay = 24 * 60 * 60 * 1000;
    const daysDifference = Math.floor(
      (parsed.date.getTime() - now.getTime()) / msPerDay
    );

    let event = await Event.findOne({
      guildId: message.guild.id,
      name: parsed.name,
    });
    if (!event) {
      event = new Event({
        guildId: message.guild.id,
        name: parsed.name,
        date: parsed.date,
        location: parsed.location,
        // Only set reminder dates if there's enough time
        planningReminderDate:
          daysDifference >= 17
            ? new Date(parsed.date.getTime() - 17 * msPerDay)
            : null,
        marketingReminderDate:
          daysDifference >= 7
            ? new Date(parsed.date.getTime() - 7 * msPerDay)
            : null,
      });
    } else {
      // update existing event
      event.date = parsed.date;
      event.location = parsed.location;
      // Update reminder dates only if there's enough time
      event.planningReminderDate =
        daysDifference >= 17
          ? new Date(parsed.date.getTime() - 17 * msPerDay)
          : null;
      event.marketingReminderDate =
        daysDifference >= 7
          ? new Date(parsed.date.getTime() - 7 * msPerDay)
          : null;
    }
    await event.save();

    scheduleReminders(event, message.client);

    let replyMessage = `Event **${
      parsed.name
    }** scheduled for ${parsed.date.toLocaleString()} at ${parsed.location}`;

    // Inform user about reminder limitations
    if (daysDifference < 17) {
      replyMessage +=
        "\n⚠️ Planning reminder skipped (event is less than 17 days away)";
    }
    if (daysDifference < 7) {
      replyMessage +=
        "\n⚠️ Marketing reminder skipped (event is less than 7 days away)";
    }

    message.reply(replyMessage);
  },
};
