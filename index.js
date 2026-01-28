#!/usr/bin/env node

// YouTube AI Channel Summarizer
// Main entry point

import 'dotenv/config';
import { CHANNELS, PATHS, MAX_VIDEO_DURATION } from './src/config.js';
import { fetchChannelVideos, getVideoMetadata, downloadAudio, downloadThumbnail } from './src/youtube.js';
import { transcribeAudio } from './src/transcription.js';
import { analyzeThumbnail, analyzeContent, generateAggregateInsights } from './src/analysis.js';
import { loadState, saveState, isVideoProcessed, markVideoProcessed, updateLastRun, getStats } from './src/state.js';
import { generateReport, generateDiscordSummary } from './src/report.js';
import * as fs from 'fs/promises';

// Parse command line arguments
const args = process.argv.slice(2);
const isTestMode = args.includes('--test');
const channelArg = args.find(a => a.startsWith('--channel='));
const limitArg = args.find(a => a.startsWith('--limit='));

async function main() {
  console.log('='.repeat(60));
  console.log('YouTube AI Channel Summarizer');
  console.log('='.repeat(60));
  console.log('');

  // Ensure directories exist
  await fs.mkdir(PATHS.audioDownloads, { recursive: true });
  await fs.mkdir(PATHS.thumbnailDownloads, { recursive: true });
  await fs.mkdir(PATHS.reports, { recursive: true });

  // Load state
  let state = await loadState();
  const stats = getStats(state);
  console.log(`Previous videos processed: ${stats.processedCount}`);
  console.log(`Last run: ${stats.lastRun || 'Never'}`);
  console.log('');

  // Determine channels to process
  let channelsToProcess = CHANNELS;
  if (channelArg) {
    const specifiedChannel = channelArg.split('=')[1];
    channelsToProcess = [specifiedChannel];
    console.log(`Processing single channel: ${specifiedChannel}`);
  } else if (isTestMode) {
    // In test mode, only process first 2 channels
    channelsToProcess = CHANNELS.slice(0, 2);
    console.log(`Test mode: Processing first ${channelsToProcess.length} channels`);
  }

  // Determine video limit per channel
  const videoLimit = limitArg ? parseInt(limitArg.split('=')[1], 10) : (isTestMode ? 2 : 5);

  const allVideoAnalyses = [];
  let totalNewVideos = 0;

  // Process each channel
  for (const channel of channelsToProcess) {
    console.log('');
    console.log('-'.repeat(50));
    console.log(`Processing channel: ${channel}`);
    console.log('-'.repeat(50));

    try {
      // Fetch recent videos
      const videos = await fetchChannelVideos(channel);
      console.log(`Found ${videos.length} recent videos`);

      if (videos.length === 0) {
        console.log(`No videos found for ${channel}, skipping...`);
        continue;
      }

      // Process videos (up to limit)
      let processedCount = 0;
      for (const video of videos) {
        if (processedCount >= videoLimit) {
          console.log(`Reached limit of ${videoLimit} videos for ${channel}`);
          break;
        }

        // Skip if already processed
        const isNew = !isVideoProcessed(state, video.id);
        if (!isNew && !isTestMode) {
          console.log(`Skipping already processed: ${video.title}`);
          continue;
        }

        // Skip very long videos
        if (video.duration && video.duration > MAX_VIDEO_DURATION) {
          console.log(`Skipping long video (${video.duration}s): ${video.title}`);
          continue;
        }

        console.log('');
        console.log(`Processing: ${video.title}`);
        console.log(`  ID: ${video.id}`);
        console.log(`  Duration: ${video.duration ? Math.round(video.duration / 60) + ' min' : 'Unknown'}`);

        const videoAnalysis = {
          id: video.id,
          title: video.title,
          url: video.url,
          channel: channel,
          duration: video.duration,
          viewCount: video.viewCount,
          uploadDate: video.uploadDate,
          isNew: isNew
        };

        try {
          // Get detailed metadata
          console.log('  Fetching metadata...');
          const metadata = await getVideoMetadata(video.id);

          if (metadata) {
            videoAnalysis.description = metadata.description;
            videoAnalysis.tags = metadata.tags;

            // Download and analyze thumbnail
            if (metadata.thumbnail) {
              console.log('  Downloading thumbnail...');
              const thumbnailPath = await downloadThumbnail(video.id, metadata.thumbnail);

              if (thumbnailPath) {
                console.log('  Analyzing thumbnail...');
                videoAnalysis.thumbnailAnalysis = await analyzeThumbnail(thumbnailPath, video.title);
              }
            }
          }

          // Download audio and transcribe
          console.log('  Downloading audio...');
          const audioPath = await downloadAudio(video.id);

          if (audioPath) {
            console.log('  Transcribing with Whisper...');
            const transcription = await transcribeAudio(audioPath);
            videoAnalysis.transcription = transcription;

            // Analyze content
            console.log('  Analyzing content...');
            videoAnalysis.contentAnalysis = await analyzeContent({
              title: video.title,
              description: metadata?.description || video.description,
              transcription: transcription,
              channelName: channel
            });
          }

          // Mark as processed
          state = markVideoProcessed(state, video.id);
          totalNewVideos++;

        } catch (error) {
          console.error(`  Error processing video: ${error.message}`);
          videoAnalysis.error = error.message;
        }

        allVideoAnalyses.push(videoAnalysis);
        processedCount++;

        // Save state after each video (in case of crash)
        await saveState(state);
      }

    } catch (error) {
      console.error(`Error processing channel ${channel}: ${error.message}`);
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('Generating Report');
  console.log('='.repeat(60));

  // Generate aggregate insights if we have multiple videos
  let aggregateInsights = '';
  if (allVideoAnalyses.length > 1) {
    console.log('Generating aggregate insights...');
    aggregateInsights = await generateAggregateInsights(allVideoAnalyses);
  }

  // Generate report
  const reportPath = await generateReport(allVideoAnalyses, aggregateInsights);

  // Generate Discord summary
  const discordSummary = generateDiscordSummary(allVideoAnalyses, reportPath);
  console.log('');
  console.log('Discord Summary:');
  console.log(discordSummary);

  // Update and save final state
  state = updateLastRun(state);
  await saveState(state);

  console.log('');
  console.log('='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Channels processed: ${channelsToProcess.length}`);
  console.log(`Videos analyzed: ${allVideoAnalyses.length}`);
  console.log(`New videos: ${totalNewVideos}`);
  console.log(`Report: ${reportPath}`);
  console.log('');
  console.log('Done!');
}

// Run main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
