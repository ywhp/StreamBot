const path = require('path');
const { downloadFile } = require('./drive');
const { Youtube } = require('./youtube');
const { youtubeRegexFunc } = require('./regex')
const { Client } = require('discord.js-selfbot-v13');
const { accToken } = require('../../JSON/settings.json');
const yt = new Youtube();
const client = new Client();
let isPlaying = false;
client.login(accToken);

client.on('ready', () => {
    console.log(`${client.user.username}`)
})

async function play({
    interaction: interaction,
    url: url,
    userID: userID,
    type: type,
    quality: quality
}) {

    const channel = client.users.cache.get(userID)?.voice?.channel;
    const re = await youtubeRegexFunc(url);

   if(!channel){
    await interaction.editReply({ content: 'You must be in a voice channel to play a video.'});
    return;
   };

   if(isPlaying){
    await interaction.editReply({ content: 'Player is already playing a video.'});
    return;
    } 
    if(re === true){
        type = 'Youtube';
    }
    if(quality === null){
        quality = 720;
    }

    if(
    url.startsWith('https://cdn.discordapp.com/attachments/') 
    && url.includes('.mp4') 
    || url.includes('.webm') 
    || url.includes('.mov')
    || url.includes('.avi') 
    || url.includes('.mkv')
    ){
        type = 'Local';
    }
    
   try {
    
    if(type === 'Youtube'){
    const info = await yt.getInfo(url);
    
    const youtube = await yt.getUrl(url, quality);

    const stream = await channel.client.voice.joinChannel(channel, {
        selfDeaf: true,
        selfMute: true,
        videoCodec: 'H264'
    });

    const connection = await stream.createStreamConnection();

    const videoDispatcher = connection.playVideo(youtube.videoUrl, {
        bitrate: 6000,
        fps: 30,
    });
     connection.playAudio(youtube.audioUrl)

    videoDispatcher.on('start', async () => {
        isPlaying = true;
        await interaction.editReply({
            embeds: [
                {
                    author: {
                        name: info.channel,
                        icon_url: info.thumbnail
                    },
                    title: info.title,
                    description: info.description,
                    thumbnail: {
                        url: info.image_src
                    },
                    fields: [
                        { name: 'Likes', value: `${info.likes}` },
                        { name: 'Views', value: `${info.views}` },
                        { name: 'Subscriber count', value: `${info.subscriberCount}` },
                        { name: 'Duration', value: `${info.duration}` },
                        { name: 'Date', value: `${info.date}` }
                    ],
                    timestamp: new Date().toISOString()
                }
            ]
        });
    }).on('finish', async () => {
        isPlaying = false;
        stream.disconnect();
        await interaction.editReply({
            content: `Finished playing ${info.title}`,
            embeds: []
        });
    });
    
   } else if(type === 'Drive'){
    
    const file = await downloadFile(url, {convert: true});
    const videoPath = path.join('Videos', `${file.fileName}${file.fileType}`);
    const audioPath = path.join('Audios', `${file.fileName}.mp3`);

   const stream = await channel.client.voice.joinChannel(channel, {
    selfDeaf: true,
    selfMute: true,
    videoCodec: 'H264',
   });

   setTimeout(async() => {

   const connection = await stream.createStreamConnection();

   const videoDispatcher = connection.playVideo(videoPath, {
    bitrate: 'auto',
    fps: 30
   });
   connection.playAudio(audioPath);

    videoDispatcher.on('start', async () => {
    await interaction.editReply({
        content: `Started playing ${file.fileName}`
    });
    isPlaying = true;
   }).on('finish', async() => {
    await interaction.editReply({
        content: `Finished playing ${file.fileName}`
    });
    stream.disconnect();
    isPlaying = false;
   }).on('error', (error) => {
    console.error(`Error playing video: ${error.message}`);
    });
},3000);
   } else if(type === 'Local'){

    const stream = await channel.client.voice.joinChannel(channel, {
        selfDeaf: true,
        selfMute: true,
        videoCodec: 'H264'
    });

    const connection = await stream.createStreamConnection();

    const videoDispatcher = connection.playVideo(url, {
        bitrate: 'auto',
        fps: 30
    });
    connection.playAudio(url);

    videoDispatcher.on('start', async () => {
        isPlaying = true;
        await interaction.editReply({
        content: `Started playing local video from ${url}`,
        });
    }).on('finish', async () => {
        connection.disconnect();
        isPlaying = false;
        await interaction.editReply({
        content: `Finished playing local video from ${url}`,
        });
    })

   }
    } catch (err) {
        console.log(err);
        isPlaying = false;
        await interaction.editReply({
            content: `${err.message}`
        });
    }
};

async function stop({
    interaction: interaction,
    userID: userID
}) {
    const channel = client.users.cache.get(userID)?.voice?.channel;
    if(!channel){
    await interaction.reply({ content: 'You must be in a voice channel to stop a video.', flags: 64 });
    return;
   };

   if(!isPlaying){
    await interaction.reply({content : 'Player is not playing any video.', flags: 64});
    return;
   }

   try {
    channel.client.voice.connection.disconnect();
    isPlaying = false;
    await interaction.reply({ content: 'Stopped playing video.', flags: 64});
   } catch (error) {
    console.error(`Error stopping video: ${error}`)
    await interaction.reply({ content: 'Error stopping video.', flags: 64})
   }
}



module.exports = {
    play,
    stop
};