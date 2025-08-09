# Discord KASA Bot

A Discord bot for managing and scheduling events within a server.

## Features

- Schedule events with reminders.
- Set a specific channel for reminders.
- List available commands.

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/discord-kasa-bot.git
   ```
2. Navigate to the project directory:
   ```
   cd discord-kasa-bot
   ```
3. Install the dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the root directory and add your MongoDB URI and Discord bot token:
   ```
   MONGO_URI=your_mongo_uri
   DISCORD_BOT_TOKEN=your_discord_bot_token
   ```

## Usage

To start the bot, run:
```
node src/index.js
```

## Commands

- `/help`: Lists all available commands.
- `/setchannel [#channel]`: Sets the reminder channel for events.
- `/schedule [event name] on the [dd/mm/yyyy] [HH:mmAM/PM] [Location]`: Schedules an event.
- `/showschedule`: Displays all scheduled events.
- `/showeventschedule`: Shows only event planning dates.
- `/showevents`: Lists all event dates.
- `/showmarketingschedule`: Displays marketing schedule dates.

## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes.

## License

This project is licensed under the MIT License.