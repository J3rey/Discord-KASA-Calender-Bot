const fs = require('fs');
const path = require('path');

/**
 * Command handler for processing Discord messages
 */
class CommandHandler {
  constructor() {
    this.commands = new Map();
    this.loadCommands();
  }

  /**
   * Load all command files from the commands directory
   */
  loadCommands() {
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      
      if (command.name) {
        this.commands.set(command.name, command);
      }
    }
  }

  /**
   * Handle incoming message
   * @param {Object} message - Discord message object
   * @param {string} prefix - Command prefix
   */
  async handleMessage(message, prefix = '/') {
    if (message.author.bot || !message.guild) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = this.commands.get(commandName);
    if (!command) return;

    try {
      await command.execute(message, args);
    } catch (error) {
      console.error(`Error executing command ${commandName}:`, error);
      message.reply('There was an error executing that command.');
    }
  }
}

module.exports = CommandHandler;
