// Configuration for YouTube AI Channel Summarizer

export const CHANNELS = [
  '@nicksaraev',
  '@matthew_berman',
  '@trycluely',
  '@ThePrimeTimeagen',
  '@GregIsenberg',
  '@DorianDevelops',
  '@WesRoth',
  '@AlexFinnOfficial',
  '@Alex.Followell',
  '@DavidOndrej',
  '@SaminYasar_',
  '@BrockMesarich',
  '@starterstory',
  '@TwoMinutePapers',
  '@intheworldofai',
  '@AICodeKing',
  '@aisamsonreal'
];

export const PATHS = {
  state: './state.json',
  reports: './reports',
  audioDownloads: './downloads/audio',
  thumbnailDownloads: './downloads/thumbnails'
};

// Number of recent videos to fetch per channel
export const VIDEOS_PER_CHANNEL = 5;

// Maximum video duration in seconds to process (skip very long videos)
export const MAX_VIDEO_DURATION = 3600; // 1 hour
