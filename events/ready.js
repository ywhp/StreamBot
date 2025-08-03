const { Events } = require('discord.js');
// const {record} = require('../src/utils/record')
module.exports = {
    name: Events.ClientReady,
    once: false,
    execute(client){
        console.log(`Logged in as ${client.user.tag}`);
        // record();
    }
};