require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const mongoose = require("mongoose");
const CommandHandler = require("./src/handlers/commandHandler");
const { initializeReminders } = require("./src/utils/reminderScheduler");

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Initialize command handler
const commandHandler = new CommandHandler();

// Bot ready event
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Initialize reminders for all upcoming events
  await initializeReminders(client);
});

// Connect to MongoDB with Node.js 18+ compatible options
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    family: 4, // Use IPv4, skip trying IPv6
    serverApi: {
      version: "1",
      strict: true,
      deprecationErrors: true,
    },
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

// Handle incoming messages
client.on("messageCreate", async (message) => {
  await commandHandler.handleMessage(message, "/");
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);
