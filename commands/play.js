const { ChatInputCommandInteraction, SlashCommandBuilder , Client} = require("discord.js");
const { play } = require('../src/utils/player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a video in a voice channel')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Choose the type of video to play')
                .addChoices(
                    { name: 'Drive', value: 'Drive' },
                    { name: 'Youtube', value: 'Youtube' },
                    { name: 'Local', value: 'Local' }
                )
                .setRequired(true))
                .addStringOption(option => 
                    option.setName('link')
                    .setDescription('Provide the link. If it\'s local, provide the attachment link')
                    .setRequired(true)
                )
                .addStringOption(option => 
                    option.setName('video_quality')
                    .setDescription('Choose the video quality')
                    .setRequired(false)
                    .addChoices(
                        { name: '480p', value: '480' },
                        { name: '720p', value: '720' },
                        { name: '1080p', value: '1080' }
                    )
                ),
    /**
     * @param {Client} client
     * @param {ChatInputCommandInteraction} interaction
     */
    async execute(interaction, client) {
        if(!interaction.deferred || !interaction.replied) {
            await interaction.deferReply({ flags: 64});
        }
        let video = interaction.options.getString('link');
        let user = interaction.user.id;
        let type = interaction.options.getString('type');
        let quality = interaction.options.getString('video_quality');
        
        if (!video) {
            return interaction.editReply({ content: 'Provide a video link.', flags: 64 });
        }
        
            await play({
                interaction: interaction,
                url: video,
                userID: user,
                type: type,
                quality: quality
            });
    }
};