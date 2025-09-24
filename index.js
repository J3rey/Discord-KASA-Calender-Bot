require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const CommandHandler = require("./src/handlers/commandHandler");
const { initializeReminders } = require("./src/utils/reminderScheduler");
const database = require("./src/database/connection");

class DiscordBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });
    this.commandHandler = new CommandHandler();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.client.once("ready", this.onReady.bind(this));
    this.client.on("messageCreate", this.onMessageCreate.bind(this));

    // Graceful shutdown handling
    process.on("SIGINT", this.shutdown.bind(this));
    process.on("SIGTERM", this.shutdown.bind(this));
  }

  async onReady() {
    try {
      console.log(`Logged in as ${this.client.user.tag}`);

      const isConnected = await database.connect();
      if (!isConnected) {
        console.error("Failed to connect to MongoDB. Bot will exit.");
        process.exit(1);
      }

      await initializeReminders(this.client);
      console.log("Bot initialization complete");
    } catch (error) {
      console.error("Error during bot initialization:", error);
      process.exit(1);
    }
  }

  async onMessageCreate(message) {
    try {
      if (!database.isConnected()) {
        console.log("MongoDB disconnected, attempting to reconnect...");
        const reconnected = await database.connect();
        if (!reconnected) {
          console.error("Failed to reconnect to database, skipping command");
          return;
        }
      }

      await this.commandHandler.handleMessage(message, "/");
    } catch (error) {
      console.error("Error handling message:", error);
    }
  }

  async start() {
    try {
      await this.client.login(process.env.DISCORD_TOKEN);
    } catch (error) {
      console.error("Failed to login to Discord:", error);
      process.exit(1);
    }
  }

  async shutdown() {
    console.log("Shutting down bot...");
    try {
      await database.disconnect();
      this.client.destroy();
      console.log("Bot shutdown complete");
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  }
}

// Start the bot
const bot = new DiscordBot();
bot.start();
