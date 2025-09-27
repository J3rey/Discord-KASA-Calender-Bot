const { ChannelType, PermissionsBitField } = require("discord.js");
const Event = require("../../models/Event");
const Settings = require("../../models/Settings");

// Store scheduled timeouts globally
const scheduledTimeouts = new Map(); // eventId -> [timeout1, timeout2, timeout3]

// Maximum safe timeout delay (about 24.8 days)
const MAX_TIMEOUT_DELAY = 2147483647;

/**
 * Schedule a callback with a safe delay, handling long delays properly
 * @param {Function} callback - Function to execute
 * @param {number} delay - Delay in milliseconds
 * @returns {NodeJS.Timeout|null} - Timeout object or null if scheduling failed
 */
function scheduleWithSafeDelay(callback, delay) {
  if (delay <= 0) return null;

  if (delay <= MAX_TIMEOUT_DELAY) {
    // Safe to use setTimeout directly
    return setTimeout(callback, delay);
  } else {
    // For delays longer than the max, use a chain of timeouts
    console.log(
      `Long delay detected (${Math.round(
        delay / (24 * 60 * 60 * 1000)
      )} days). Using chained timeout approach.`
    );

    const intermediateTimeout = setTimeout(() => {
      // Schedule another timeout for the remaining delay
      const remainingDelay = delay - MAX_TIMEOUT_DELAY;
      scheduleWithSafeDelay(callback, remainingDelay);
    }, MAX_TIMEOUT_DELAY);

    return intermediateTimeout;
  }
}

/**
 * Schedule reminders for an event
 * @param {Object} event - The event object
 * @param {Object} client - Discord client
 */
async function scheduleReminders(event, client) {
  // Clear previous timeouts for this event
  if (scheduledTimeouts.has(event._id.toString())) {
    scheduledTimeouts
      .get(event._id.toString())
      .forEach((timeout) => clearTimeout(timeout));
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
      .filter(
        (c) =>
          c.type === ChannelType.GuildText &&
          c
            .permissionsFor(guild.members.me)
            .has(PermissionsBitField.Flags.SendMessages)
      )
      .sort((a, b) => a.position - b.position)
      .first();
  }
  if (!channel) return;

  const msPerDay = 24 * 60 * 60 * 1000;
  const timeouts = [];

  // Calculate reminder dates - use custom dates if set, otherwise use defaults
  const planningDate =
    event.planningReminderDate ||
    new Date(event.date.getTime() - 17 * msPerDay);
  const eventDetailsDate = new Date(event.date.getTime() - 8 * msPerDay); // Always 8 days before event
  const marketingDate =
    event.marketingReminderDate ||
    new Date(event.date.getTime() - 7 * msPerDay);

  // Maximum safe timeout delay (about 24.8 days)
  const MAX_TIMEOUT_DELAY = 2147483647;

  // Schedule planning reminder (17 days before or custom date)
  if (planningDate > now) {
    const delay = planningDate.getTime() - now.getTime();
    const timeout = scheduleWithSafeDelay(async () => {
      if (!channel) return;
      channel.send(
        `<@&${process.env.EVENTS_ROLE_ID}> Please begin planning for **${event.name}**`
      );
    }, delay);
    if (timeout) timeouts.push(timeout);
  }

  // Schedule event details reminder (always 8 days before event)
  if (eventDetailsDate > now) {
    const delay = eventDetailsDate.getTime() - now.getTime();
    const timeout = scheduleWithSafeDelay(async () => {
      if (!channel) return;
      channel.send(
        `<@&${process.env.EVENTS_ROLE_ID}> Please have the event details ready for marketing for **${event.name}**`
      );
    }, delay);
    if (timeout) timeouts.push(timeout);
  }

  // Schedule marketing reminder (7 days before or custom date)
  if (marketingDate > now) {
    const delay = marketingDate.getTime() - now.getTime();
    const timeout = scheduleWithSafeDelay(async () => {
      if (!channel) return;
      channel.send(
        `<@&${process.env.MARKETING_ROLE_ID}> <@&${process.env.DESIGN_ROLE_ID}> Please begin marketing for **${event.name}**`
      );
    }, delay);
    if (timeout) timeouts.push(timeout);
  }

  // Schedule event cleanup (delete event 24 hours after it has passed)
  const cleanupTime = new Date(event.date.getTime() + msPerDay); // 24 hours after event
  if (cleanupTime > now) {
    const cleanupDelay = cleanupTime.getTime() - now.getTime();
    const cleanupTimeout = scheduleWithSafeDelay(async () => {
      await deleteExpiredEvent(event._id);
      console.log(
        `Event "${event.name}" has been automatically deleted after completion.`
      );
    }, cleanupDelay);
    if (cleanupTimeout) timeouts.push(cleanupTimeout);
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
      scheduledTimeouts
        .get(eventId.toString())
        .forEach((timeout) => clearTimeout(timeout));
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
    console.error("Error cleaning up past events:", error);
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
  events.forEach((event) => scheduleReminders(event, client));

  // Set up daily cleanup interval (runs every 24 hours)
  // Use safe interval for 24-hour periods
  const dailyCleanupInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  setInterval(async () => {
    await cleanupPastEvents();
  }, dailyCleanupInterval);
}

module.exports = {
  scheduleReminders,
  initializeReminders,
  deleteExpiredEvent,
  cleanupPastEvents,
};
