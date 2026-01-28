// Transcription using OpenAI Whisper API

import OpenAI from 'openai';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);
const openai = new OpenAI();

// Max file size for Whisper API (25MB, using 20MB to be safe)
const MAX_CHUNK_SIZE_MB = 20;

/**
 * Get audio duration using ffprobe
 * @param {string} audioPath - Path to audio file
 * @returns {Promise<number>} - Duration in seconds
 */
async function getAudioDuration(audioPath) {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
    );
    return parseFloat(stdout.trim());
  } catch (error) {
    console.error(`Error getting audio duration: ${error.message}`);
    return 0;
  }
}

/**
 * Split audio file into chunks
 * @param {string} audioPath - Path to audio file
 * @param {number} chunkDurationSec - Duration of each chunk in seconds
 * @returns {Promise<string[]>} - Array of chunk file paths
 */
async function splitAudio(audioPath, chunkDurationSec = 300) {
  const dir = path.dirname(audioPath);
  const baseName = path.basename(audioPath, path.extname(audioPath));
  const chunkPattern = path.join(dir, `${baseName}_chunk_%03d.mp3`);
  
  console.log(`Splitting audio into ${chunkDurationSec}s chunks...`);
  
  try {
    await execAsync(
      `ffmpeg -i "${audioPath}" -f segment -segment_time ${chunkDurationSec} -c copy "${chunkPattern}" -y 2>/dev/null`
    );
    
    // Find all chunk files
    const files = fs.readdirSync(dir);
    const chunks = files
      .filter(f => f.startsWith(`${baseName}_chunk_`) && f.endsWith('.mp3'))
      .sort()
      .map(f => path.join(dir, f));
    
    console.log(`Created ${chunks.length} chunks`);
    return chunks;
  } catch (error) {
    console.error(`Error splitting audio: ${error.message}`);
    return [];
  }
}

/**
 * Clean up chunk files
 * @param {string[]} chunkPaths - Array of chunk file paths
 */
function cleanupChunks(chunkPaths) {
  for (const chunk of chunkPaths) {
    try {
      if (fs.existsSync(chunk)) {
        fs.unlinkSync(chunk);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Transcribe a single audio chunk
 * @param {string} chunkPath - Path to chunk file
 * @param {number} index - Chunk index
 * @param {number} total - Total chunks
 * @returns {Promise<string>} - Transcription text
 */
async function transcribeChunk(chunkPath, index, total) {
  try {
    const stats = fs.statSync(chunkPath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    
    console.log(`  Transcribing chunk ${index + 1}/${total} (${fileSizeInMB.toFixed(2)}MB)...`);
    
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(chunkPath),
      model: 'whisper-1',
      response_format: 'text'
    });
    
    return transcription;
  } catch (error) {
    console.error(`  Error transcribing chunk ${index + 1}: ${error.message}`);
    return '';
  }
}

/**
 * Transcribe audio file using OpenAI Whisper API
 * Automatically splits large files into chunks
 * @param {string} audioPath - Path to the audio file
 * @returns {Promise<string>} - Transcription text
 */
export async function transcribeAudio(audioPath) {
  try {
    const stats = fs.statSync(audioPath);
    const fileSizeInMB = stats.size / (1024 * 1024);

    console.log(`Transcribing: ${audioPath} (${fileSizeInMB.toFixed(2)}MB)`);

    // If file is under limit, transcribe directly
    if (fileSizeInMB <= MAX_CHUNK_SIZE_MB) {
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: 'whisper-1',
        response_format: 'text'
      });

      console.log(`Transcription complete: ${transcription.length} characters`);
      return transcription;
    }

    // File is too large - split and transcribe chunks
    console.log(`File exceeds ${MAX_CHUNK_SIZE_MB}MB limit. Splitting into chunks...`);
    
    // Get duration to calculate optimal chunk size
    const duration = await getAudioDuration(audioPath);
    if (duration === 0) {
      console.error('Could not determine audio duration');
      return null;
    }
    
    // Calculate chunk duration to stay under size limit
    // Estimate: if X MB = Y seconds, then 20MB = (20/X) * Y seconds
    const mbPerSecond = fileSizeInMB / duration;
    const chunkDurationSec = Math.floor(MAX_CHUNK_SIZE_MB / mbPerSecond);
    
    console.log(`Audio duration: ${Math.round(duration)}s, chunk duration: ${chunkDurationSec}s`);
    
    // Split audio
    const chunks = await splitAudio(audioPath, chunkDurationSec);
    if (chunks.length === 0) {
      console.error('Failed to split audio');
      return null;
    }
    
    // Transcribe each chunk
    const transcriptions = [];
    for (let i = 0; i < chunks.length; i++) {
      const text = await transcribeChunk(chunks[i], i, chunks.length);
      transcriptions.push(text);
    }
    
    // Cleanup chunks
    cleanupChunks(chunks);
    
    // Combine transcriptions
    const fullTranscription = transcriptions.join(' ');
    console.log(`Transcription complete: ${fullTranscription.length} characters (from ${chunks.length} chunks)`);
    
    return fullTranscription;
  } catch (error) {
    console.error(`Error transcribing ${audioPath}: ${error.message}`);
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
