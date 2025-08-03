const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const scopes = ['https://www.googleapis.com/auth/drive'];

const { client_id, client_secret, redirect_uris } = require('../../JSON/credentials.json');

const oauth2Client = new google.auth.OAuth2(
  client_id, client_secret, redirect_uris
);

const { fileRegexFunc , folderRegexFunc } = require('./regex');

const { convertToAudio } = require('./ffmpeg')

function generateToken() {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  });

  console.log(authUrl);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Authorization code: ', (code) => {
    rl.close();
    oauth2Client.getToken(code, (err, token) => {
      if (err) return console.error(err.message);
      oauth2Client.setCredentials(token);
      fs.writeFileSync('JSON/token.json', JSON.stringify(token));
      return token;
    });
  });
};

let token;

if(fs.existsSync('JSON/token.json')) {
  token = require('../../JSON/token.json');
} else {
  token = generateToken();
}



oauth2Client.setCredentials(token);


async function getFileType(
  fileId,
  fileType,
  fileName,
  folderName
) {
  const drive = google.drive({
    version: 'v3',
    auth: oauth2Client
  });

  const res = await drive.files.get({
    fileId: fileId
  });
  
  if(res.data.mimeType === 'application/vnd.google-apps.folder'){
    const files = new Array();
    const folderID = fileId;
    const list = await drive.files.list({
      q: `'${folderID}' in parents and trashed=false`,
      fields: 'files(name,id,mimeType)'
    });
    
    files.push(...list.data.files);


    for(const file of files){
      if(file.mimeType === 'application/vnd.google-apps.folder'){
        await getFileType(file.id)
        // console.log(file.name)
      } else {
        return files.map(f => {
        if(f.mimeType.startsWith('video/')){
          fileName = f.name;
          fileId = f.id;
          fileType = '.mp4';
        } else if(f.mimeType.startsWith('image/')){
          fileName = f.name;
          fileId = f.id;
          fileType = '.png';
        } else if(f.mimeType.startsWith('audio/')){
          fileName = f.name;
          fileId = f.id;
          fileType = '.mp3';
        } else {
          fileName = f.name;
          fileId = f.id;
          fileType = f.mimeType;
        }
        return {
          fileName,
          fileId,
          fileType
        };
        });
      }
    };
  } else {

  if(res.data.mimeType.startsWith('video/')){
    folderName = 'Videos';
    fileName = res.data.name;
    fileType = '.mp4';
  } else if (res.data.mimeType.startsWith('image/')){
    folderName = 'Pictures';
    fileName = res.data.name;
    fileType = '.png'
  } else if(res.data.mimeType.startsWith('audio/')){
    folderName = 'Audios';
    fileName = res.data.name;
    fileType = '.mp3'
  } else {
    fileName = res.data.name;
    fileType = res.data.mimeType;
  }
  

  return {
    fileName,
    fileType,
    folderName
  };
}

}

async function checkFileType(fileName, fileType) {
  if(!fileName) {
    throw new Error('Invalid file name');
  }

  const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.flv'];
  const audioExtensions = ['.mp3', '.wav', '.aac', '.flac'];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];

  const fileExtension = '.' + fileName.split('.').pop().toLowerCase();

  if(videoExtensions.includes(fileExtension)){
    fileName = fileName.replace(fileExtension,'');
    fileType = fileExtension;
  } else if(audioExtensions.includes(fileExtension)){
    fileName = fileName.replace(fileExtension,'');
    fileType = fileExtension;
  } else if(imageExtensions.includes(fileExtension)){
    fileName = fileName.replace(fileExtension,'');
    fileType = fileExtension;
  } else {
    fileName;
  }
  return {
    fileName, 
    fileType
  };
};


async function downloadFile(
  fileId,
  {convert: convert = false},
  fileName, 
  folderName, 
  fileType
) {

   if(!fileId) {
    throw new Error('Invalid file ID or URL');
    }

  if(!oauth2Client.credentials?.access_token){
    return;
  }

   fileId = await fileRegexFunc(fileId);

    const drive = google.drive({
        version: 'v3',
        auth: oauth2Client
    });

    const values = await getFileType(fileId);
    const file = await checkFileType(values.fileName);

    if(file.fileType === undefined){
      file.fileType = values.fileType;
    }

    if(Array.isArray(values)){
      for(const value of values){
        if(value.fileType === 'mp4'){
          folderName = 'Videos';
          fileName = value.fileName;
          fileId = value.fileId;
          fileType = await checkFileType(value.fileName);
          await downloadFile(fileId,fileName,folderName,fileType);
        } else if(value.fileType.endsWith('mp3')){
          folderName = 'Audios';
          fileName = value.fileName;
          fileId = value.fileId;
          fileType = await checkFileType(value.fileName);
          await downloadFile(fileId,fileName,folderName);
        } else if(value.fileType === 'png'){
          folderName = 'Pictures';
          fileName = value.fileName;
          fileId = value.fileId;
          fileType = await checkFileType(value.fileName);
          await downloadFile(fileId,fileName,folderName,fileType);
        } else {
          return;
        }
      }
    } else {
      fileName = file.fileName;
      fileType = values.fileType;
      folderName = values.folderName;
    }

    const dirPath = path.join(folderName);
    if(!fs.existsSync(dirPath)){
      fs.mkdirSync(dirPath, {recursive: true});
    }

    if(typeof convert != 'boolean') return;

    const res = await drive.files.get(
        {
            fileId: fileId,
            
            alt: 'media',
        }, 
        {
            responseType: 'stream'
        }
    );

    await new Promise((resolve, reject) => {
    res.data
    .pipe(fs.createWriteStream(`${folderName}/${fileName}${fileType}`))
    .on('finish' , async () => {
      if(convert === true){
        await convertToAudio(`${dirPath}/${fileName}${fileType}`, `${fileName}.mp3`, 'mp3');
        console.log('finished');
      } else {
        console.log('finished');
      }
      resolve();
    }).on('error', (err) => {
      console.error(err);
      reject(err);
    });
  });
    return file;
};

async function downloadFolder(folderID) {
    if(!oauth2Client.credentials?.access_token){
        return;
    }
    folderID = await folderRegexFunc(folderID);
    
    const drive = google.drive({version: 'v3', auth: oauth2Client});
    const files = new Array();

    const res = await drive.files.list({
        q: `'${folderID}' in parents and trashed=false`,
        fields: 'files(name,id,mimeType)',
        supportsAllDrives: true
    });

    files.push(...res.data.files);

    for(const file of files){
      if(file.mimeType === 'application/vnd.google-apps.folder'){
        await downloadFolder(file.id);
      } else {
        await downloadFile(file.id,file.name);
      }
    }
    
    // console.log(files);
    return files;
};

// downloadFile('https://drive.google.com/file/d/1Bgq9vyaSpMEWxim29qjg7zNgSMkQmphS/view')

module.exports = {
  downloadFile,
  downloadFolder
};