const Event = require('../../models/Event');

module.exports = {
  name: 'showevents',
  description: 'Show only event dates',
  
  async execute(message, args) {
    const events = await Event.find({ guildId: message.guild.id }).sort('date');
    if (events.length === 0) return message.reply('No events scheduled.');

    const lines = events.map(ev => {
      return `${ev.name}, ${ev.date.toLocaleDateString('en-GB')}, ${ev.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}, ${ev.location}`;
    });

    message.channel.send(lines.join('\n'));
  }
};
