const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: false,
    execute(client){
        console.log(`Logged in as ${client.user.tag}`);
    }
};
