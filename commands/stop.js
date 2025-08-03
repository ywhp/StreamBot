const { ChatInputCommandInteraction, Client, SlashCommandBuilder } = require("discord.js");
const { stop } = require('../src/utils/player');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stops the currently playing video'),
    /**
     * @param {ChatInputCommandInteraction} interaction
     * @param {Client} client
     */
    async execute(interaction, client){
        await stop({
            client: client,
            interaction: interaction,
            userID: interaction.user.id
        });
    }
};