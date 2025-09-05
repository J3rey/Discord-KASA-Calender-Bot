const { PermissionsBitField } = require('discord.js');
const Event = require('../../models/Event');

module.exports = {
  name: 'deleteevent',
  description: 'Delete a specific event',
  
  async execute(message, args) {
    // Check if user has manage server permissions
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return message.reply('You need Manage Server permissions to delete events.');
    }

    // Get event name from arguments
    const eventName = args.join(' ');
    if (!eventName) {
      return message.reply('Please provide the name of the event to delete. Usage: `/deleteevent [event name]`');
    }

    // Find and delete the event
    const event = await Event.findOne({ guildId: message.guild.id, name: eventName });
    if (!event) {
      return message.reply('Event not found.');
    }

    // Ask for confirmation
    const confirm = await message.channel.send(`Are you sure you want to delete the event **${eventName}**? Reply with "yes" to confirm.`);
    
    try {
      const response = await message.channel.awaitMessages({
        filter: m => m.author.id === message.author.id,
        max: 1,
        time: 30000,
        errors: ['time']
      });

      if (response.first().content.toLowerCase() === 'yes') {
        await Event.deleteOne({ _id: event._id });
        message.channel.send(`Event **${eventName}** has been deleted.`);
      } else {
        message.channel.send('Operation cancelled.');
      }
    } catch (err) {
      message.channel.send('No response received, operation cancelled.');
    }
  }
};
