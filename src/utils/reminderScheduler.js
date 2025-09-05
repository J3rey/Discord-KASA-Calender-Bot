const { ChannelType, PermissionsBitField } = require('discord.js');
const Event = require('../../models/Event');
const Settings = require('../../models/Settings');

// Store scheduled timeouts globally
const scheduledTimeouts = new Map(); // eventId -> [timeout1, timeout2, timeout3]

/**
 * Schedule reminders for an event
 * @param {Object} event - The event object
 * @param {Object} client - Discord client
 */
async function scheduleReminders(event, client) {
  // Clear previous timeouts for this event
  if (scheduledTimeouts.has(event._id.toString())) {
    scheduledTimeouts.get(event._id.toString()).forEach(timeout => clearTimeout(timeout));
  }

  const now = new Date();

  const guild = await client.guilds.fetch(event.guildId).catch(() => null);
  if (!guild) return;

  const settings = await Settings.findOne({ guildId: event.guildId });
  let channel;

  if (settings && settings.reminderChannelId) {
    channel = guild.channels.cache.get(settings.reminderChannelId);
  }

  if (!channel) {
    channel = guild.channels.cache
      .filter(c => c.type === ChannelType.GuildText && c.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages))
      .sort((a, b) => a.position - b.position)
      .first();
  }
  if (!channel) return;

  const msPerDay = 24 * 60 * 60 * 1000;
  const timeouts = [];

  [17, 8, 7].forEach(daysBefore => {
    const reminderTime = new Date(event.date.getTime() - daysBefore * msPerDay);
    if (reminderTime > now) {
      const delay = reminderTime.getTime() - now.getTime();
      const timeout = setTimeout(async () => {
        if (!channel) return;

        if (daysBefore === 17) {
          channel.send(`<@&${process.env.EVENTS_ROLE_ID}> Please begin planning for **${event.name}**`);
        } else if (daysBefore === 8) {
          channel.send(`<@&${process.env.EVENTS_ROLE_ID}> Please have the event details ready for marketing for **${event.name}**`);
        } else if (daysBefore === 7) {
          channel.send(`<@&${process.env.MARKETING_ROLE_ID}> <@&${process.env.DESIGN_ROLE_ID}> Please begin marketing for **${event.name}**`);
        }
      }, delay);
      timeouts.push(timeout);
    }
  });

  // Store new timeouts for this event
  scheduledTimeouts.set(event._id.toString(), timeouts);
}

/**
 * Initialize reminders for all upcoming events
 * @param {Object} client - Discord client
 */
async function initializeReminders(client) {
  const now = new Date();
  const events = await Event.find({ date: { $gte: now } });
  events.forEach(event => scheduleReminders(event, client));
}

module.exports = {
  scheduleReminders,
  initializeReminders
};
