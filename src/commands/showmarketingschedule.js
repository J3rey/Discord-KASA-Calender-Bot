const Event = require('../../models/Event');

module.exports = {
  name: 'showmarketingschedule',
  description: 'Show only marketing dates',
  
  async execute(message, args) {
    const events = await Event.find({ guildId: message.guild.id }).sort('date');
    if (events.length === 0) return message.reply('No events scheduled.');

    const lines = events.map(ev => {
      const dayMonth = ev.date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
      return `Graphics start for **${ev.name}** on ${dayMonth}`;
    });

    message.channel.send(lines.join('\n'));
  }
};
