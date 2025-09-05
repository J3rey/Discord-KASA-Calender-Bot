const Event = require('../../models/Event');

module.exports = {
  name: 'showeventschedule',
  description: 'Show only event planning dates',
  
  async execute(message, args) {
    const events = await Event.find({ guildId: message.guild.id }).sort('date');
    if (events.length === 0) return message.reply('No events scheduled.');

    const lines = events.map(ev => {
      const dayMonth = ev.date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
      return `Events start planning for **${ev.name}** on ${dayMonth}`;
    });

    message.channel.send(lines.join('\n'));
  }
};
