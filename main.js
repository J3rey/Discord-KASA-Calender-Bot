// Load environment variables
require('dotenv').config()

// Import Discord.js
const { Client, GatewayIntentBits } = require('discord.js')

// Create client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
})

// Client events
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`)
})

client.on('messageCreate', message => {
  if (message.content === '!hello') {
    message.reply('Hello!')
  }
})

// Login with token
client.login(process.env.DISCORD_BOT_TOKEN)
