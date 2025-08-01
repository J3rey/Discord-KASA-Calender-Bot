// index.js (bot entry point)
require('dotenv').config()
const { Client, GatewayIntentBits } = require('discord.js')
const mongoose = require('mongoose')

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
})

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`)
})

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB')
}).catch(err => {
  console.error('❌ MongoDB connection error:', err)
})

// Add your command/event handling below
client.on('messageCreate', message => {
  if (message.content === '!ping') {
    message.reply('Pong!')
  }
})

client.login(process.env.DISCORD_BOT_TOKEN)
