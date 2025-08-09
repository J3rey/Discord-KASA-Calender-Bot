require('dotenv').config();
const { Client, GatewayIntentBits, PermissionsBitField, ChannelType, EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');
const Event = require('./models/Event');
const Settings = require('./models/Settings');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // On start, load upcoming events and schedule reminders
  const now = new Date();
  const events = await Event.find({ date: { $gte: now } });
  events.forEach(scheduleReminders);
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(console.error);

// Helper: parse schedule command arguments
function parseScheduleArgs(content) {
  // Expected format:
  // [event name] on the [dd/mm/yyyy] and time [HH:mm AM/PM], location [location]
  // Simplify parsing by regex
  // Format: /schedule Ice Skating on the 19/07/2025 7:00PM Rod Laver Stadium
  // Split by " on the " first, then separate date/time and location
  // For simplicity: assume "/schedule eventName on the dd/mm/yyyy HH:mmAM/PM location"

  // Remove command prefix
  const input = content.slice('/schedule '.length).trim();
  const onTheIndex = input.indexOf(' on the ');
  if (onTheIndex === -1) return null;

  const name = input.slice(0, onTheIndex).trim();
  const rest = input.slice(onTheIndex + 8).trim();

  // date time is first two parts, then location is rest
  // date time: e.g. 19/07/2025 7:00PM
  const firstSpaceIndex = rest.indexOf(' ');
  if (firstSpaceIndex === -1) return null;

  const datePart = rest.slice(0, 10); // dd/mm/yyyy is always 10 chars
  const timeAndLocation = rest.slice(11).trim();

  // Time is until first space or until AM/PM
  const timeRegex = /^(\d{1,2}:\d{2}(AM|PM))/i;
  const timeMatch = timeAndLocation.match(timeRegex);
  if (!timeMatch) return null;

  const time = timeMatch[1];
  const location = timeAndLocation.slice(time.length).trim();

  // Parse date and time into JS Date
  // Convert dd/mm/yyyy and time (HH:mmAM/PM) to Date object
  const [day, month, year] = datePart.split('/');
  let hourMinute = time.toUpperCase(); // e.g. 7:00PM
  // Parse hour and minute and AM/PM
  const timeMatch2 = hourMinute.match(/(\d{1,2}):(\d{2})(AM|PM)/);
  if (!timeMatch2) return null;
  let hour = parseInt(timeMatch2[1]);
  const minute = parseInt(timeMatch2[2]);
  const ampm = timeMatch2[3];
  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;

  const date = new Date(year, month - 1, day, hour, minute);

  if (isNaN(date.getTime())) return null;

  return { name, date, location };
}

// Helper: schedule reminders for an event
async function scheduleReminders(event) {
  const now = new Date();

  const guild = await client.guilds.fetch(event.guildId).catch(() => null);
  if (!guild) return;

  const settings = await Settings.findOne({ guildId: event.guildId });
  let channel;

  if (settings && settings.reminderChannelId) {
    channel = guild.channels.cache.get(settings.reminderChannelId);
  }

  // If no set channel or invalid, pick first text channel in guild
  if (!channel) {
    channel = guild.channels.cache
      .filter(c => c.type === ChannelType.GuildText && c.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages))
      .sort((a, b) => a.position - b.position)
      .first();
  }
  if (!channel) return;

  const msPerDay = 24 * 60 * 60 * 1000;

  // Schedule reminders for 17, 8, and 7 days before event
  [17, 8, 7].forEach(daysBefore => {
    const reminderTime = new Date(event.date.getTime() - daysBefore * msPerDay);
    if (reminderTime > now) {
      const delay = reminderTime.getTime() - now.getTime();
      setTimeout(async () => {
        if (!channel) return;

        if (daysBefore === 17) {
          channel.send(`@events Please begin planning for **${event.name}**`);
        } else if (daysBefore === 8) {
          channel.send(`@events Please have the event details ready for marketing`);
        } else if (daysBefore === 7) {
          channel.send(`@marketing @design Please begin marketing for **${event.name}**`);
        }
      }, delay);
    }
  });
}

// Command prefix
const PREFIX = '/';

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'help') {
    message.channel.send(`**Commands:**  
/help
/setchannel [#channel] - Set the reminder channel. Defaults to first text channel.  
/schedule [event name] on the [dd/mm/yyyy] [HH:mmAM/PM] [Location] - Schedule an event.  
/showschedule - Show all events with planning and marketing dates.  
/showeventschedule - Show only event planning dates.  
/showevents - Show only event dates.  
/showmarketingschedule - Show only marketing dates.`);
  }

  else if (command === 'setchannel') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply('You do not have permission to set the channel.');
    }

    // Get the mentioned channel
    const channel = message.mentions.channels.first();
    if (!channel || channel.type !== ChannelType.GuildText) {
      return message.reply('Please mention a valid text channel.');
    }

    // Save to DB
    let settings = await Settings.findOne({ guildId: message.guild.id });
    if (!settings) {
      settings = new Settings({ guildId: message.guild.id, reminderChannelId: channel.id });
    } else {
      settings.reminderChannelId = channel.id;
    }
    await settings.save();

    message.reply(`Reminder channel set to ${channel.name}`);
  }

  else if (command === 'schedule') {
    const parsed = parseScheduleArgs(message.content);
    if (!parsed) {
      return message.reply('Invalid format. Use `/schedule [event name] on the [dd/mm/yyyy] [HH:mmAM/PM] [Location]`');
    }

    let event = await Event.findOne({ guildId: message.guild.id, name: parsed.name });
    if (!event) {
      event = new Event({
        guildId: message.guild.id,
        name: parsed.name,
        date: parsed.date,
        location: parsed.location,
      });
    } else {
      // update existing event
      event.date = parsed.date;
      event.location = parsed.location;
    }
    await event.save();

    scheduleReminders(event);

    message.reply(`Event **${parsed.name}** scheduled for ${parsed.date.toLocaleString()} at ${parsed.location}`);
  }

  else if (command === 'showschedule') {
    const events = await Event.find({ guildId: message.guild.id }).sort('date');
    if (events.length === 0) return message.reply('No events scheduled.');

    const lines = events.map(ev => {
      const dayMonth = ev.date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
      return `Events start planning for **${ev.name}** on ${dayMonth}\nGraphics start for **${ev.name}** on ${dayMonth}\n${ev.name}, ${ev.date.toLocaleDateString('en-GB')}, ${ev.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}, ${ev.location}`;
    });

    message.channel.send(lines.join('\n\n'));
  }

  else if (command === 'showeventschedule') {
    const events = await Event.find({ guildId: message.guild.id }).sort('date');
    if (events.length === 0) return message.reply('No events scheduled.');

    const lines = events.map(ev => {
      const dayMonth = ev.date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
      return `Events start planning for **${ev.name}** on ${dayMonth}`;
    });

    message.channel.send(lines.join('\n'));
  }

  else if (command === 'showevents') {
    const events = await Event.find({ guildId: message.guild.id }).sort('date');
    if (events.length === 0) return message.reply('No events scheduled.');

    const lines = events.map(ev => {
      return `${ev.name}, ${ev.date.toLocaleDateString('en-GB')}, ${ev.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}, ${ev.location}`;
    });

    message.channel.send(lines.join('\n'));
  }

  else if (command === 'showmarketingschedule') {
    const events = await Event.find({ guildId: message.guild.id }).sort('date');
    if (events.length === 0) return message.reply('No events scheduled.');

    const lines = events.map(ev => {
      const dayMonth = ev.date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
      return `Graphics start for **${ev.name}** on ${dayMonth}`;
    });

    message.channel.send(lines.join('\n'));
  }
});

client.login(process.env.DISCORD_TOKEN);
