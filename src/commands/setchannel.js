const { PermissionsBitField, ChannelType } = require('discord.js');
const Settings = require('../../models/Settings');

module.exports = {
  name: 'setchannel',
  description: 'Set the reminder channel for the bot',
  
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply('You do not have permission to set the channel.');
    }

    // Get the mentioned channel
    const channel = message.mentions.channels.first();
    if (!channel || channel.type !== ChannelType.GuildText) {
      return message.reply('Please mention a valid text channel.');
    }

    // Save to DB
    let settings = await Settings.findOne({ guildId: message.guild.id });
    if (!settings) {
      settings = new Settings({ guildId: message.guild.id, reminderChannelId: channel.id });
    } else {
      settings.reminderChannelId = channel.id;
    }
    await settings.save();

    message.reply(`Reminder channel set to ${channel.name}`);
  }
};
