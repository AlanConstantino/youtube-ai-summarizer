// State management for tracking processed videos

import * as fs from 'fs/promises';
import { PATHS } from './config.js';

/**
 * Load state from file
 * @returns {Promise<Object>} - State object
 */
export async function loadState() {
  try {
    const data = await fs.readFile(PATHS.state, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Return default state if file doesn't exist
    return {
      lastRun: null,
      processedVideos: {}
    };
  }
}

/**
 * Save state to file
 * @param {Object} state - State object to save
 */
export async function saveState(state) {
  try {
    await fs.writeFile(PATHS.state, JSON.stringify(state, null, 2), 'utf-8');
    console.log('State saved successfully');
  } catch (error) {
    console.error(`Error saving state: ${error.message}`);
  }
}

/**
 * Check if a video has been processed
 * @param {Object} state - Current state
 * @param {string} videoId - Video ID to check
 * @returns {boolean} - True if already processed
 */
export function isVideoProcessed(state, videoId) {
  return videoId in state.processedVideos;
}

/**
 * Mark a video as processed
 * @param {Object} state - Current state
 * @param {string} videoId - Video ID to mark
 * @returns {Object} - Updated state
 */
export function markVideoProcessed(state, videoId) {
  return {
    ...state,
    processedVideos: {
      ...state.processedVideos,
      [videoId]: new Date().toISOString()
    }
  };
}

/**
 * Update last run timestamp
 * @param {Object} state - Current state
 * @returns {Object} - Updated state
 */
export function updateLastRun(state) {
  return {
    ...state,
    lastRun: new Date().toISOString()
  };
}

/**
 * Get statistics about processed videos
 * @param {Object} state - Current state
 * @returns {Object} - Statistics
 */
export function getStats(state) {
  const processedCount = Object.keys(state.processedVideos).length;
  const dates = Object.values(state.processedVideos).map(d => new Date(d));
  const oldestProcessed = dates.length > 0 ? new Date(Math.min(...dates)) : null;
  const newestProcessed = dates.length > 0 ? new Date(Math.max(...dates)) : null;

  return {
    processedCount,
    lastRun: state.lastRun ? new Date(state.lastRun) : null,
    oldestProcessed,
    newestProcessed
  };
}
