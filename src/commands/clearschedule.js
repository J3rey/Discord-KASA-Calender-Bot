const { PermissionsBitField } = require('discord.js');
const Event = require('../../models/Event');

module.exports = {
  name: 'clearschedule',
  description: 'Delete all events (requires confirmation)',
  
  async execute(message, args) {
    // Check if user has manage server permissions
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return message.reply('You need Manage Server permissions to clear the schedule.');
    }

    // Ask for confirmation
    const confirm = await message.channel.send('Are you sure you want to delete ALL events? Reply with "yes" to confirm.');
    
    try {
      const response = await message.channel.awaitMessages({
        filter: m => m.author.id === message.author.id,
        max: 1,
        time: 30000,
        errors: ['time']
      });

      if (response.first().content.toLowerCase() === 'yes') {
        await Event.deleteMany({ guildId: message.guild.id });
        message.channel.send('All events have been deleted.');
      } else {
        message.channel.send('Operation cancelled.');
      }
    } catch (err) {
      message.channel.send('No response received, operation cancelled.');
    }
  }
};
