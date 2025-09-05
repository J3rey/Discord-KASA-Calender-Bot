const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'helpcal',
  description: 'Display help information for all commands',
  
  async execute(message, args) {
    const helpEmbed = new EmbedBuilder()
      .setTitle('KASA Bot Commands')
      .setDescription('Here are the available commands:\n\u200B')
      .addFields(
        { name: '\u200B', value: '**General**', inline: false },
        { name: '/helpcal', value: 'Show this help message.', inline: true },
        { name: '/setchannel [#channel]', value: 'Set the reminder channel.', inline: true },
        { name: '\u200B', value: '\u200B', inline: false },

        { name: '**Event Scheduling**', value: '\u200B', inline: false },
        { name: '/schedule [event name] on the [dd/mm/yyyy] [HH:mmAM/PM] [Location]', value: 'Schedule an event.', inline: false },
        { name: '/showschedule', value: 'Show all events with planning and marketing dates.', inline: false },
        { name: '/showeventschedule', value: 'Show only event planning dates.', inline: false },
        { name: '/showevents', value: 'Show only event dates.', inline: false },
        { name: '/showmarketingschedule', value: 'Show only marketing dates.', inline: false },
        { name: '\u200B', value: '\u200B', inline: false },

        { name: '**Event Management**', value: '\u200B', inline: false },
        { name: '/deleteevent [event name]', value: 'Delete a specific event.', inline: false },
        { name: '/clearschedule', value: 'Delete all events (requires confirmation).', inline: false },
        { name: '/changestart [event name] to dd/MM', value: 'Change planning start date.', inline: false },
        { name: '/changemarketing [event name] to dd/MM', value: 'Change marketing start date.', inline: false },
        { name: '/changeremind [event name] to dd/MM', value: 'Change event date.', inline: false },
        { name: '/testreminders', value: 'Test reminder functionality (Admin only).', inline: false }
      )
      .setColor(0x3498db);

    message.channel.send({ embeds: [helpEmbed] });
  }
};
