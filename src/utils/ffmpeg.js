const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);
const fs = require('fs');
const path = require('path');
/**
 * @param {string} input
 * @param {string} output
 * @param {string} format
 */

async function convertToAudio(
    input,
    output,
    format
){
    return new Promise((resolve, reject) => {
        const folder = path.join('Audios')
        
        ffmpeg()
        .input(input)
        .toFormat(format)
        .on('end', () => {
            console.log(`Conversion finished: ${output}`);
            resolve(output);
        })
        .on('error', (err) => {
            console.error(`Error during conversion: ${err.message}`);
            reject(err);
        })
        .saveToFile(`${folder}/${output}`); 
    });
};

async function mergeAudioAndVideo(
    video,
    audio,
    output
){
    return new Promise((resolve, reject) => {
        const folder = path.join('Videos')

        ffmpeg(video)
        .addInput(audio)
        .outputOptions('-c:v', 'copy')
        .outputOptions('-c:a', 'aac')
        .outputOptions('-strict', 'experimental')
        .output(`${folder}/${output}`)
        .on('end', () => {
            fs.unlinkSync(audio);
            console.log(`Merge finished: ${output}`);
            resolve(`${folder}/${output}`);
        })
        .on('error', (err) => {
            console.error(`Error during merge: ${err.message}`);
            reject(err);
        })
        .run();
    });
};

module.exports = {
    convertToAudio,
    mergeAudioAndVideo
};