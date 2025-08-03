const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return interaction.reply({ content: `No command matching ${interaction.commandName} was found.`, flags: 64 });
        try {
            await command.execute(interaction, client);
        } catch (error) {
            interaction.reply({ content: `Error executing ${interaction.commandName}`, flags: 64 });
            console.error(error);
        }
    },
};