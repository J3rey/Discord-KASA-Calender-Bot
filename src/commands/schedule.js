const Event = require('../../models/Event');
const { parseScheduleArgs } = require('../utils/dateParser');
const { scheduleReminders } = require('../utils/reminderScheduler');

module.exports = {
  name: 'schedule',
  description: 'Schedule a new event',
  
  async execute(message, args) {
    const parsed = parseScheduleArgs(message.content);
    if (!parsed) {
      return message.reply('Invalid format. Use `/schedule [event name] on the [dd/mm/yyyy] [HH:mmAM/PM] [Location]`');
    }

    const msPerDay = 24 * 60 * 60 * 1000;
    
    let event = await Event.findOne({ guildId: message.guild.id, name: parsed.name });
    if (!event) {
      event = new Event({
        guildId: message.guild.id,
        name: parsed.name,
        date: parsed.date,
        location: parsed.location,
        planningReminderDate: new Date(parsed.date.getTime() - (17 * msPerDay)), // Default 17 days before
        marketingReminderDate: new Date(parsed.date.getTime() - (7 * msPerDay)), // Default 7 days before
      });
    } else {
      // update existing event
      event.date = parsed.date;
      event.location = parsed.location;
      // Update default reminder dates when event date changes
      event.planningReminderDate = new Date(parsed.date.getTime() - (17 * msPerDay));
      event.marketingReminderDate = new Date(parsed.date.getTime() - (7 * msPerDay));
    }
    await event.save();

    scheduleReminders(event, message.client);

    message.reply(`Event **${parsed.name}** scheduled for ${parsed.date.toLocaleString()} at ${parsed.location}`);
  }
};
