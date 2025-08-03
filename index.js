const { Client , GatewayIntentBits , AttachmentBuilder, Collection} = require('discord.js');

const fs = require('fs');

const { TOKEN } = require('./JSON/settings.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});


fs.readdirSync('./handlers').forEach(handler => {
    require(`./handlers/${handler}`)(client);
});



client.login(TOKEN);