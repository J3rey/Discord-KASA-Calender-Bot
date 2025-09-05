const changeCommand = require('./changestart');

module.exports = {
  name: 'changeremind',
  description: 'Change event date',
  
  async execute(message, args) {
    return changeCommand.handleDateChange(message, 'changeremind');
  }
};
