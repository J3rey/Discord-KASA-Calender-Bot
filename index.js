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

// MongoDB connection function
async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      family: 4,
      ssl: true,
      tls: true,
      tlsAllowInvalidCertificates: true,
      serverApi: {
        version: "1",
        strict: true,
        deprecationErrors: true,
      },
    });
    console.log("Connected to MongoDB");
    return true;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    return false;
  }
}

// Bot ready event with MongoDB connection check
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Try to connect to MongoDB
  const isConnected = await connectToMongoDB();
  if (!isConnected) {
    console.error("Failed to connect to MongoDB. Bot will exit.");
    process.exit(1);
  }

  // Initialize reminders only after successful MongoDB connection
  await initializeReminders(client);
});

// Handle incoming messages
client.on("messageCreate", async (message) => {
  // Check MongoDB connection before handling commands
  if (mongoose.connection.readyState !== 1) {
    console.log("MongoDB disconnected, attempting to reconnect...");
    await connectToMongoDB();
  }
  await commandHandler.handleMessage(message, "/");
});

// MongoDB connection error handler
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

// MongoDB disconnection handler
mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected. Attempting to reconnect...");
  connectToMongoDB();
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);
