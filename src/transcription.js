// Transcription using OpenAI Whisper API

import OpenAI from 'openai';
import * as fs from 'fs';

const openai = new OpenAI();

/**
 * Transcribe audio file using OpenAI Whisper API
 * @param {string} audioPath - Path to the audio file
 * @returns {Promise<string>} - Transcription text
 */
export async function transcribeAudio(audioPath) {
  try {
    // Check file size - Whisper API has a 25MB limit
    const stats = fs.statSync(audioPath);
    const fileSizeInMB = stats.size / (1024 * 1024);

    if (fileSizeInMB > 25) {
      console.log(`Audio file too large (${fileSizeInMB.toFixed(2)}MB). Attempting to process anyway...`);
      // For files over 25MB, we could split them, but for now we'll try direct upload
      // Most YouTube videos under 1 hour should be under 25MB as mp3
    }

    console.log(`Transcribing: ${audioPath} (${fileSizeInMB.toFixed(2)}MB)`);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-1',
      response_format: 'text'
    });

    console.log(`Transcription complete: ${transcription.length} characters`);
    return transcription;
  } catch (error) {
    console.error(`Error transcribing ${audioPath}: ${error.message}`);

    // If file is too large, try to provide helpful error
    if (error.message.includes('maximum')) {
      console.error('File exceeds Whisper API limit. Consider splitting the audio file.');
    }

    return null;
  }
}

/**
 * Transcribe audio with timestamps (verbose format)
 * @param {string} audioPath - Path to the audio file
 * @returns {Promise<Object>} - Transcription with timestamps
 */
export async function transcribeAudioVerbose(audioPath) {
  try {
    const stats = fs.statSync(audioPath);
    const fileSizeInMB = stats.size / (1024 * 1024);

    console.log(`Transcribing (verbose): ${audioPath} (${fileSizeInMB.toFixed(2)}MB)`);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment']
    });

    return {
      text: transcription.text,
      segments: transcription.segments,
      duration: transcription.duration
    };
  } catch (error) {
    console.error(`Error transcribing ${audioPath}: ${error.message}`);
    return null;
  }
}
