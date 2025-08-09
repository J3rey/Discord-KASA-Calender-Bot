const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  guildId: String,
  reminderChannelId: String,
});

module.exports = mongoose.model('Settings', settingsSchema);
