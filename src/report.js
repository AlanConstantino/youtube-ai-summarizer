// Report generation for YouTube AI Summarizer

import * as fs from 'fs/promises';
import * as path from 'path';
import { PATHS } from './config.js';

/**
 * Generate markdown report
 * @param {Array} videoAnalyses - Array of analyzed videos
 * @param {string} aggregateInsights - Aggregate insights across videos
 * @returns {Promise<string>} - Path to generated report
 */
export async function generateReport(videoAnalyses, aggregateInsights) {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const reportPath = path.join(PATHS.reports, `${dateStr}.md`);

  // Group videos by channel
  const videosByChannel = {};
  for (const video of videoAnalyses) {
    if (!videosByChannel[video.channel]) {
      videosByChannel[video.channel] = [];
    }
    videosByChannel[video.channel].push(video);
  }

  // Build report content
  let report = `# YouTube AI Channel Summary - ${dateStr}

*Generated: ${date.toLocaleString()}*

---

## Overview

- **Channels Analyzed:** ${Object.keys(videosByChannel).length}
- **Videos Processed:** ${videoAnalyses.length}
- **New Videos Found:** ${videoAnalyses.filter(v => v.isNew).length}

---

## Aggregate Insights

${aggregateInsights || 'No aggregate insights available.'}

---

`;

  // Add per-channel sections
  for (const [channel, videos] of Object.entries(videosByChannel)) {
    report += `## ${channel}

`;

    for (const video of videos) {
      report += generateVideoSection(video);
    }
  }

  // Write report to file
  await fs.mkdir(PATHS.reports, { recursive: true });
  await fs.writeFile(reportPath, report, 'utf-8');

  console.log(`Report generated: ${reportPath}`);
  return reportPath;
}

/**
 * Generate markdown section for a single video
 * @param {Object} video - Video analysis data
 * @returns {string} - Markdown section
 */
function generateVideoSection(video) {
  const { title, url, duration, viewCount, uploadDate, thumbnailAnalysis, contentAnalysis } = video;

  const durationStr = duration ? formatDuration(duration) : 'Unknown';
  const viewsStr = viewCount ? formatNumber(viewCount) : 'Unknown';
  const dateStr = uploadDate ? formatDate(uploadDate) : 'Unknown';

  return `### ${title}

**URL:** ${url}
**Duration:** ${durationStr} | **Views:** ${viewsStr} | **Uploaded:** ${dateStr}

#### Thumbnail Analysis

${thumbnailAnalysis?.analysis || 'No thumbnail analysis available.'}

#### Content Analysis

${contentAnalysis?.analysis || 'No content analysis available.'}

---

`;
}

/**
 * Format duration in seconds to human-readable string
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration
 */
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
function formatNumber(num) {
  return num.toLocaleString();
}

/**
 * Format upload date (YYYYMMDD) to readable string
 * @param {string} dateStr - Date string in YYYYMMDD format
 * @returns {string} - Formatted date
 */
function formatDate(dateStr) {
  if (!dateStr || dateStr.length !== 8) return dateStr;

  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);

  return `${year}-${month}-${day}`;
}

/**
 * Generate a summary message for Discord
 * @param {Array} videoAnalyses - Array of analyzed videos
 * @param {string} reportPath - Path to the generated report
 * @returns {string} - Summary message
 */
export function generateDiscordSummary(videoAnalyses, reportPath) {
  const newVideos = videoAnalyses.filter(v => v.isNew);
  const channelCount = new Set(videoAnalyses.map(v => v.channel)).size;

  let summary = `**YouTube AI Channel Summary**\n\n`;
  summary += `Analyzed **${videoAnalyses.length}** videos from **${channelCount}** channels.\n`;

  if (newVideos.length > 0) {
    summary += `\n**New Videos:**\n`;
    for (const video of newVideos.slice(0, 10)) {
      summary += `- ${video.channel}: "${video.title}"\n`;
    }

    if (newVideos.length > 10) {
      summary += `...and ${newVideos.length - 10} more\n`;
    }
  }

  summary += `\nFull report: ${reportPath}`;

  return summary;
}
