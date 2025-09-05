const { PermissionsBitField } = require('discord.js');
const Event = require('../../models/Event');
const Settings = require('../../models/Settings');

module.exports = {
  name: 'testreminders',
  description: 'Test reminder functionality (Admin only)',
  
  async execute(message, args) {
    // Check for admin permissions
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('You need Administrator permissions to test reminders.');
    }

    const events = await Event.find({ guildId: message.guild.id }).sort('date');
    if (events.length === 0) return message.reply('No events to test reminders for.');

    // Get the channel
    const settings = await Settings.findOne({ guildId: message.guild.id });
    let channel = message.channel;
    
    if (settings && settings.reminderChannelId) {
      const reminderChannel = message.guild.channels.cache.get(settings.reminderChannelId);
      if (reminderChannel) channel = reminderChannel;
    }

    // Simulate reminders for each event
    for (const event of events) {
      await message.channel.send('Testing reminders for event: **' + event.name + '**');
      
      // Test 17-day reminder
      await channel.send(`<@&${process.env.EVENTS_ROLE_ID}> Please begin planning for **${event.name}**`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay

      // Test 8-day reminder
      await channel.send(`<@&${process.env.EVENTS_ROLE_ID}> Please have the event details ready for marketing for **${event.name}**`);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Test 7-day reminder
      await channel.send(`<@&${process.env.MARKETING_ROLE_ID}> <@&${process.env.DESIGN_ROLE_ID}> Please begin marketing for **${event.name}**`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    message.channel.send('✅ Reminder testing completed!');
  }
};
