const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  guildId: String,
  name: String,
  date: Date,
  location: String,
});

module.exports = mongoose.model('Event', eventSchema);
