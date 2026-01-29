# YouTube AI Channel Summarizer

Automated YouTube channel monitoring, transcription, and AI summarization. Monitors 17 AI-focused YouTube channels, transcribes new videos using local Whisper, and generates detailed content analyses with remake suggestions.

## Features

- 📺 **Channel Monitoring** - Tracks 17 AI/tech YouTube channels
- 🎯 **Smart Filtering** - Only processes new videos since last run
- 🖼️ **Thumbnail Analysis** - GPT-4o vision analysis of thumbnails
- 🎤 **Local Whisper Transcription** - Fast, free transcription via whisper.cpp (large-v3-turbo)
- 📊 **Content Analysis** - Executive summaries, key takeaways, tools mentioned
- 💡 **Remake Suggestions** - Unique angles and content opportunities
- 📈 **Trend Analysis** - Aggregate insights across all channels

## Channels Monitored

- @nicksaraev
- @matthew_berman
- @trycluely
- @ThePrimeTimeagen
- @GregIsenberg
- @DorianDevelops
- @WesRoth
- @AlexFinnOfficial
- @Alex.Followell
- @DavidOndrej
- @SaminYasar_
- @BrockMesarich
- @starterstory
- @TwoMinutePapers
- @intheworldofai
- @AICodeKing
- @aisamsonreal

## Prerequisites

- Node.js 18+
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) installed and in PATH
- [whisper-local](file:///Users/alanconstantino/Code/claude_code/whisper-local) set up with large-v3-turbo model
- OpenAI API key with GPT-4o access (for analysis only)

## Installation

```bash
git clone https://github.com/aconstantino-dev/youtube-ai-summarizer.git
cd youtube-ai-summarizer
npm install
cp .env.example .env
# Edit .env with your OpenAI API key
```

## Usage

### Full Run
```bash
npm start
```

### Test Mode (2 channels, 2 videos each)
```bash
npm test
```

### Single Channel
```bash
node index.js --channel=@nicksaraev
```

### Custom Video Limit
```bash
node index.js --limit=3
```

## Output

Reports are generated in `./reports/` as markdown files with:
- Per-video analyses
- Thumbnail breakdowns
- Content summaries
- Remake suggestions
- Aggregate trend insights

## State Management

The `state.json` file tracks processed videos to avoid re-processing. Delete it to start fresh.

## Configuration

Edit `src/config.js` to:
- Add/remove channels
- Change video limits
- Adjust maximum video duration

## Transcription

Uses local whisper.cpp with the large-v3-turbo model:
- **Speed**: ~12x real-time on Apple M4
- **Cost**: Free (no API calls)
- **Quality**: State-of-the-art accuracy
- **No file size limits**: Handles any video length

## License

MIT
