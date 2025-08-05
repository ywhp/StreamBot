const { youtubeDl } = require('youtube-dl-exec');

class Youtube {
  async getInfo(url) {
    try {
      const res = await fetch(url);

      const html = await res.text();

      const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.*?\});/s);
      const InitialPlayer = JSON.parse(playerMatch[1]);
      const dataMatch = html.match(/ytInitialData\s*=\s*(\{.*?\});/s);
      const initData = JSON.parse(dataMatch[1]);

      if (!playerMatch || !dataMatch)return;
      const image_src = html
      .match(/<link[^>]+rel=["']image_src["'][^>]*href=["']([^"']+)["']/i) 
      ? 
      html
      .match(/<link[^>]+rel=["']image_src["'][^>]*href=["']([^"']+)["']/i)[1] 
      :
      'N';
      const description = html
      .match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["']/i)
      ?
      html
      .match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["']/i)[1]
      : 'N';
      const videoDetails = InitialPlayer.videoDetails;
      const title = videoDetails.title;
      const channel = videoDetails.author;
      const lengthSeconds = Number(videoDetails.lengthSeconds);
      const duration = `${Math.floor(lengthSeconds / 60)}:${(lengthSeconds % 60).toString().padStart(2, '0')}`;
      const primaryInfo = initData.contents
      ?.twoColumnWatchNextResults
      ?.results
      ?.results
      ?.contents
      ?.find(c => c.videoPrimaryInfoRenderer)
      ?.videoPrimaryInfoRenderer;
      const views = primaryInfo.viewCount
      ?.videoViewCountRenderer
      ?.viewCount
      ?.simpleText || 'N';
      const date = primaryInfo
      ?.dateText
      ?.simpleText || 'N';
      const likeButton = primaryInfo
      ?.videoActions
      ?.menuRenderer
      ?.topLevelButtons;
      const likes = likeButton.map(i => {
      return i
      ?.segmentedLikeDislikeButtonViewModel
      ?.likeButtonViewModel
      ?.likeButtonViewModel
      ?.toggleButtonViewModel
      ?.toggleButtonViewModel
      ?.defaultButtonViewModel
      ?.buttonViewModel
      ?.title || 'N';
      })[0];
      const videoSecondaryInfo = initData
      .contents
      ?.twoColumnWatchNextResults
      ?.results
      ?.results
      ?.contents
      ?.find(c => c.videoSecondaryInfoRenderer)
      ?.videoSecondaryInfoRenderer;
      const thumbnail = videoSecondaryInfo
      ?.owner
      ?.videoOwnerRenderer
      ?.thumbnail
      ?.thumbnails
      ?.find(c => c.url)?.url || 'N';
      const subscriberCount = videoSecondaryInfo
      .owner
      ?.videoOwnerRenderer
      ?.subscriberCountText
      ?.simpleText || 'N';


      return {
        title,
        channel,
        views,
        duration,
        date,
        likes,
        image_src,
        thumbnail,
        subscriberCount,
        description
      };

    } catch (error) {
      console.error(error);
    }
  };

  async getUrl(url, videoQuality = 720, format_note = 'medium') {
    
    const info = await youtubeDl(url, {
      dumpSingleJson: true,
      noWarnings: true,
    });
    
    const formats = info.formats;

    const videoUrl = formats
    .filter(f => f.vcodec !== 'none' && f.acodec === 'none')
    .map(f => {
      return {
        url: f.url,
        height: f.height,
        ext: f.ext,
        filesize: f.filesize ? (f.filesize / 1024 / 1024).toFixed(1) + ' MB' : 'Unknown',
        quality: f.height || 'Unknown',
        type: f.ext
      }
    })
    .filter(f => f.height <= Number(videoQuality))
    .filter(f => f.filesize !== 'Unknown')
    .sort((a,b) => (b.height) - (a.height))
    .at(0)
    ?.url;
    
    const audioUrl = formats
    .filter(f => f.acodec !== "none" && f.vcodec === "none")
    .sort((a,b) => (b.abr) - (a.abr))
    .at(0)
    ?.url;

    if(!videoUrl){
      throw new Error('No video stream found');
    }
    if(!audioUrl){
      throw new Error('No audio stream found');
    }

    return {
      videoUrl,
      audioUrl
    }
  }
};

module.exports = {
  Youtube
}
