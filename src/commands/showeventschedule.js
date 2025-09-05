const Event = require('../../models/Event');

module.exports = {
  name: 'showeventschedule',
  description: 'Show only event planning dates',
  
  async execute(message, args) {
    const events = await Event.find({ guildId: message.guild.id }).sort('date');
    if (events.length === 0) return message.reply('No events scheduled.');

    const lines = events.map(ev => {
      const msPerDay = 24 * 60 * 60 * 1000;
      const planningDate = (ev.planningReminderDate || new Date(ev.date.getTime() - (17 * msPerDay)))
        .toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
      return `Events start planning for **${ev.name}** on ${planningDate}`;
    });

    message.channel.send(lines.join('\n'));
  }
};
