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

  // Schedule event cleanup (delete event 24 hours after it has passed)
  const cleanupTime = new Date(event.date.getTime() + msPerDay); // 24 hours after event
  if (cleanupTime > now) {
    const cleanupDelay = cleanupTime.getTime() - now.getTime();
    const cleanupTimeout = setTimeout(async () => {
      await deleteExpiredEvent(event._id);
      console.log(`Event "${event.name}" has been automatically deleted after completion.`);
    }, cleanupDelay);
    timeouts.push(cleanupTimeout);
  }

  // Store new timeouts for this event
  scheduledTimeouts.set(event._id.toString(), timeouts);
}

/**
 * Delete an expired event and clear its timeouts
 * @param {string} eventId - The event ID to delete
 */
async function deleteExpiredEvent(eventId) {
  try {
    // Clear scheduled timeouts for this event
    if (scheduledTimeouts.has(eventId.toString())) {
      scheduledTimeouts.get(eventId.toString()).forEach(timeout => clearTimeout(timeout));
      scheduledTimeouts.delete(eventId.toString());
    }

    // Delete the event from database
    await Event.findByIdAndDelete(eventId);
  } catch (error) {
    console.error(`Error deleting expired event ${eventId}:`, error);
  }
}

/**
 * Clean up past events that have already occurred
 */
async function cleanupPastEvents() {
  try {
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const cutoffTime = new Date(now.getTime() - msPerDay); // Events older than 24 hours

    const pastEvents = await Event.find({ date: { $lt: cutoffTime } });
    
    for (const event of pastEvents) {
      await deleteExpiredEvent(event._id);
      console.log(`Cleaned up past event: "${event.name}"`);
    }

    if (pastEvents.length > 0) {
      console.log(`Cleaned up ${pastEvents.length} past event(s) on startup.`);
    }
  } catch (error) {
    console.error('Error cleaning up past events:', error);
  }
}

/**
 * Initialize reminders for all upcoming events
 * @param {Object} client - Discord client
 */
async function initializeReminders(client) {
  // First, clean up any past events
  await cleanupPastEvents();

  // Then initialize reminders for upcoming events
  const now = new Date();
  const events = await Event.find({ date: { $gte: now } });
  events.forEach(event => scheduleReminders(event, client));

  // Set up daily cleanup interval (runs every 24 hours)
  setInterval(async () => {
    await cleanupPastEvents();
  }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
}

module.exports = {
  scheduleReminders,
  initializeReminders,
  deleteExpiredEvent,
  cleanupPastEvents
};
