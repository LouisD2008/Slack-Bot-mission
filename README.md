# Tour de France Slack bot

### Quick description

This application is a Slack Bot built using Node.js and `@slack/bolt` that provides real-time information and standings for the Tour de France. It communicates over Socket Mode and fetches race data from an external web scraping API [Parse.bot](https://parse.bot/).

You can use it in any Slack Hack Club channel.

### Project structure
```
Slack Bot mission/
├── node_modules/
├── .env  # environmental variables
├── .gitignore
├── index.js  # main script
├── package-lock.json
├── package.json
└── README.md
```
### Slash commands available
 - `/tour-de-france-ping` : Measures and returns bot latency in milliseconds.

 - `/tour-de-france-help` : Lists all available bot commands and usage details.

 - `/tour-de-france-current-stage` : Fetches details for today's stage or the next scheduled stage.

 - `/tour-de-france-stage` : Returns detailed info (route, length, date) for a given stage number.

 - `/tour-de-france-gc` : Returns top 5 overall GC standings after a given stage number.


### Environment variables required:
The bot relies on environment variables managed via dotenv. Create a .env file in the project root containing:
```js
SLACK_APP_TOKEN = xoxb-...
SLACK_BOT_TOKEN = xapp-...
PARSE_BOT_API_KEY = your_parse_bot_api_key
```