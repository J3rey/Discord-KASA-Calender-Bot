const { PermissionsBitField } = require('discord.js');
const Event = require('../../models/Event');
const { scheduleReminders } = require('../utils/reminderScheduler');

module.exports = {
  name: 'changestart',
  description: 'Change planning start date',
  
  async execute(message, args) {
    return this.handleDateChange(message, 'changestart');
  },

  async handleDateChange(message, command) {
    // Check permissions
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return message.reply('You need Manage Server permissions to modify event dates.');
    }

    // Parse arguments: /command [event name] to dd/MM
    const fullArgs = message.content.slice(1).trim(); // Remove prefix
    const matchResult = fullArgs.match(/^(?:changestart|changeremind|changemarketing)\s+(.+?)\s+to\s+(\d{2}\/\d{2})$/i);
    
    if (!matchResult) {
      return message.reply('Invalid format. Use `/' + command + ' [event name] to dd/MM`');
    }

    const [_, eventName, newDate] = matchResult;
    const [day, month] = newDate.split('/').map(num => parseInt(num));

    // Find the event
    const event = await Event.findOne({ guildId: message.guild.id, name: eventName });
    if (!event) {
      return message.reply('Event not found.');
    }

    // Create new date based on the event's original year
    const eventYear = event.date.getFullYear();
    const newDateTime = new Date(eventYear, month - 1, day);

    // Validate date
    if (isNaN(newDateTime.getTime())) {
      return message.reply('Invalid date format. Please use dd/MM');
    }

    // Update appropriate date based on command
    const msPerDay = 24 * 60 * 60 * 1000;
    let updateMessage = '';

    if (command === 'changestart') {
      // Calculate new event date (17 days after planning start)
      const newEventDate = new Date(newDateTime.getTime() + (17 * msPerDay));
      event.date = newEventDate;
      updateMessage = `Planning start date updated to ${newDate}. Event date moved to ${newEventDate.toLocaleDateString('en-GB')}`;
    } 
    else if (command === 'changemarketing') {
      // Update event date to 7 days after marketing
      const newEventDate = new Date(newDateTime.getTime() + (7 * msPerDay));
      event.date = newEventDate;
      updateMessage = `Marketing date updated to ${newDate}. Event date moved to ${newEventDate.toLocaleDateString('en-GB')}`;
    }
    else if (command === 'changeremind') {
      // Update the event date directly
      event.date = newDateTime;
      updateMessage = `Event date updated to ${newDate}`;
    }

    // Save changes
    await event.save();

    // Reschedule reminders
    scheduleReminders(event, message.client);

    // Send confirmation
    message.reply(updateMessage);
  }
};
