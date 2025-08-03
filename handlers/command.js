const { REST, Routes, ApplicationCommandType, Collection, Events } = require('discord.js');
const fs = require('fs');
const { TOKEN } = require('../JSON/settings.json');
const rest = new REST({ version: '10' }).setToken(TOKEN);
const ascii = require('ascii-table');
const table = new ascii('Commands').setJustify();

module.exports = (client) => {
    const commands = [];
    client.commands = new Collection();
    
        const commandsFile = fs.readdirSync(`./commands`).filter(file => file.endsWith('.js'));

        for(const file of commandsFile){
            const command = require(`../commands/${file}`);
            if(command.name && command.description){
                commands.push({
                    name: command.name,
                    description: command.description,
                    type: ApplicationCommandType.ChatInput,
                    options: command.options || [],
                });
                client.commands.set(command.name, command);
                table.addRow(`./${command.name}`, '✅ working');
            } else if (command.data?.name && command.data?.description){
                commands.push(command.data.toJSON());
                client.commands.set(command.data.name, command);
                table.addRow(`./${command.data.name}`, '✅ working');
            } else {
                table.addRow(file, '❌ not working');
            }
    }
    console.log(table.toString());

    client.once(Events.ClientReady, async c => {
        try {
            console.log(`Started refreshing ${commands.length} application (/) commands.`);
            const data = await rest.put(
                Routes.applicationCommands(c.user.id),
                { body: commands }
            );
            console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        } catch (error) {
            console.error(error);
        }
    });

};