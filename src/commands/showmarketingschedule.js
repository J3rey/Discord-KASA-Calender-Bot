const Event = require('../../models/Event');

module.exports = {
  name: 'showmarketingschedule',
  description: 'Show only marketing dates',
  
  async execute(message, args) {
    const events = await Event.find({ guildId: message.guild.id }).sort('date');
    if (events.length === 0) return message.reply('No events scheduled.');

    const lines = events.map(ev => {
      const msPerDay = 24 * 60 * 60 * 1000;
      const marketingDate = (ev.marketingReminderDate || new Date(ev.date.getTime() - (7 * msPerDay)))
        .toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
      return `Graphics start for **${ev.name}** on ${marketingDate}`;
    });

    message.channel.send(lines.join('\n'));
  }
};
