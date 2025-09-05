const Event = require('../../models/Event');

module.exports = {
  name: 'showschedule',
  description: 'Show all events with planning and marketing dates',
  
  async execute(message, args) {
    const events = await Event.find({ guildId: message.guild.id }).sort('date');
    if (events.length === 0) return message.reply('No events scheduled.');

    const lines = events.map(ev => {
      const eventDate = ev.date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
      const planningDate = new Date(ev.date.getTime() - (17 * 24 * 60 * 60 * 1000))
        .toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
      const marketingDate = new Date(ev.date.getTime() - (7 * 24 * 60 * 60 * 1000))
        .toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });

      return `${planningDate}, Events start planning for **${ev.name}**\n` +
             `${marketingDate}, Graphics start for **${ev.name}**\n` +
             `**${ev.name}**, ${eventDate}, ${ev.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}, ${ev.location}`;
    });

    message.channel.send(lines.join('\n\n'));
  }
};
