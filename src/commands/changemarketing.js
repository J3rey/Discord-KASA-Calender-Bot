const changeCommand = require('./changestart');

module.exports = {
  name: 'changemarketing',
  description: 'Change marketing start date',
  
  async execute(message, args) {
    return changeCommand.handleDateChange(message, 'changemarketing');
  }
};
