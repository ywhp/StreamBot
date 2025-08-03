const fileRegex = /\/file\/d\/([a-zA-Z0-9_-]+)/;
const folderRegex = /(?<=folders\/)[^? \n\r\t]*/;
const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?youtu(?:\.be\/|be.com\/\S*(?:watch|embed)(?:(?:(?=\/[-a-zA-Z0-9_]{11,}(?!\S))\/)|(?:\S*v=|v\/)))([-a-zA-Z0-9_]{11,})/gm


const fileRegexFunc = async(file) => { 
    var fileId = fileRegex.exec(file);
    var id;
    if(fileId && (id=fileId[1])){
    return id;
    } else {
    return file;
    };
};
const folderRegexFunc = async(folder) => {
    var folderID = folder.match(folderRegex);
    var id;
    if(folderID && (id=folderID[0])){
    return id;
    } else {
        return folder;
    }
};

const youtubeRegexFunc = async (url) => {
    var video = youtubeRegex.exec(url);
    if(video){
        return true;
    } else {
        return false;
    }
};


module.exports = { 
    fileRegexFunc,
    folderRegexFunc,
    youtubeRegexFunc
};