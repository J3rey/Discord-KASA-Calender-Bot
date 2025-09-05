const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  guildId: String,
  name: String,
  date: Date,
  location: String,
  planningReminderDate: Date, // Custom planning start date (defaults to 17 days before event)
  marketingReminderDate: Date, // Custom marketing start date (defaults to 7 days before event)
});

module.exports = mongoose.model('Event', eventSchema);
