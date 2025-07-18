const { Client, GatewayIntentBits } = require('discord.js')
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
})

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('messageCreate', message => {
  if (message.content === '!hello') {
    message.reply('Hello there!')
  }
})

client.login('MTM5NTc0MzA5NTI4MjMzNTc4NA.GJFNf_.cpTI03OOTcRt2naXyWqpBqqqkzCi1eTp-3uX4o')
