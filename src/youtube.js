// YouTube video fetching using yt-dlp

import { exec } from 'child_process';
import { promisify } from 'util';
import { VIDEOS_PER_CHANNEL, PATHS } from './config.js';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * Fetch recent videos from a YouTube channel
 * @param {string} channelHandle - YouTube channel handle (e.g., @nicksaraev)
 * @returns {Promise<Array>} - Array of video metadata objects
 */
export async function fetchChannelVideos(channelHandle) {
  const channelUrl = `https://www.youtube.com/${channelHandle}/videos`;

  try {
    // Use --flat-playlist to get video list without downloading
    const cmd = `yt-dlp --flat-playlist --dump-json --playlist-end ${VIDEOS_PER_CHANNEL} "${channelUrl}"`;

    const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });

    // Each line is a separate JSON object
    const videos = stdout
      .trim()
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          console.error(`Failed to parse video JSON: ${e.message}`);
          return null;
        }
      })
      .filter(v => v !== null);

    return videos.map(v => ({
      id: v.id,
      title: v.title,
      url: v.url || `https://www.youtube.com/watch?v=${v.id}`,
      duration: v.duration,
      uploadDate: v.upload_date,
      channel: channelHandle,
      viewCount: v.view_count,
      description: v.description || ''
    }));
  } catch (error) {
    console.error(`Error fetching videos for ${channelHandle}: ${error.message}`);
    return [];
  }
}

/**
 * Get detailed metadata for a single video
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object>} - Detailed video metadata
 */
export async function getVideoMetadata(videoId) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const cmd = `yt-dlp --dump-json --no-download "${videoUrl}"`;
    const { stdout } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });

    const data = JSON.parse(stdout);

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      duration: data.duration,
      uploadDate: data.upload_date,
      viewCount: data.view_count,
      likeCount: data.like_count,
      channelName: data.channel,
      channelId: data.channel_id,
      thumbnail: data.thumbnail,
      thumbnails: data.thumbnails,
      tags: data.tags || [],
      categories: data.categories || []
    };
  } catch (error) {
    console.error(`Error getting metadata for ${videoId}: ${error.message}`);
    return null;
  }
}

/**
 * Download audio from a video for transcription
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<string>} - Path to downloaded audio file
 */
export async function downloadAudio(videoId) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const outputPath = path.join(PATHS.audioDownloads, `${videoId}.mp3`);

  // Check if already downloaded
  try {
    await fs.access(outputPath);
    console.log(`Audio already downloaded: ${outputPath}`);
    return outputPath;
  } catch {
    // File doesn't exist, proceed with download
  }

  try {
    // Download audio only, convert to mp3
    const cmd = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${outputPath}" "${videoUrl}"`;
    await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024, timeout: 300000 }); // 5 min timeout

    console.log(`Downloaded audio: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error(`Error downloading audio for ${videoId}: ${error.message}`);
    return null;
  }
}

/**
 * Download thumbnail for a video
 * @param {string} videoId - YouTube video ID
 * @param {string} thumbnailUrl - URL of the thumbnail
 * @returns {Promise<string>} - Path to downloaded thumbnail
 */
export async function downloadThumbnail(videoId, thumbnailUrl) {
  const outputPath = path.join(PATHS.thumbnailDownloads, `${videoId}.jpg`);

  // Check if already downloaded
  try {
    await fs.access(outputPath);
    console.log(`Thumbnail already downloaded: ${outputPath}`);
    return outputPath;
  } catch {
    // File doesn't exist, proceed with download
  }

  try {
    const cmd = `curl -sL -o "${outputPath}" "${thumbnailUrl}"`;
    await execAsync(cmd);

    console.log(`Downloaded thumbnail: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error(`Error downloading thumbnail for ${videoId}: ${error.message}`);
    return null;
  }
}
