# YouTube AI Channel Summarizer

## Overview
Automated system to monitor AI-focused YouTube channels, transcribe new videos, analyze content, and provide summaries with content remake suggestions.

## Channels to Monitor
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

## Features

### 1. Video Discovery
- Fetch recent videos from each channel
- Track which videos have been processed (state file)
- Only process new videos since last run

### 2. Video Analysis
For each new video, capture:
- **Thumbnail** - Download and analyze (visual style, text overlays, colors)
- **Title** - SEO analysis, hook analysis
- **Description** - Key points, links, timestamps
- **Video content** - Full transcription via Whisper

### 3. Content Summarization
- Executive summary (2-3 sentences)
- Key concepts and takeaways (bullet points)
- Notable quotes or insights
- Tools/products mentioned

### 4. Content Remake Suggestions
For each video, provide:
- How Alan could create similar content
- Unique angle opportunities
- Suggested title variations
- Content gaps to fill

### 5. Output Format
Generate a markdown file with:
- Date of analysis
- Per-channel sections
- Per-video detailed breakdowns
- Aggregate insights across all channels

### 6. Discord Integration
- Upload the generated report to #youtube-ai-channel-summarizer
- Include a summary message with highlights

## Technical Stack
- **yt-dlp** - Video/metadata fetching
- **Whisper** - Audio transcription
- **OpenAI API** - Content analysis and summarization
- **Node.js or Python** - Main script
- **JSON state file** - Track processed videos

## Schedule
- Run daily or on-demand
- Cron job via Clawdbot

## State Management
Store in `state.json`:
```json
{
  "lastRun": "2026-01-27T00:00:00Z",
  "processedVideos": {
    "videoId1": "2026-01-26T12:00:00Z",
    "videoId2": "2026-01-27T10:00:00Z"
  }
}
```
