// Transcription using local whisper.cpp (large-v3-turbo model)
// No API costs, no file size limits, ~12x real-time on M4

import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Path to local whisper transcribe script
const WHISPER_TRANSCRIBE = '/Users/alanconstantino/Code/claude_code/whisper-local/transcribe';

/**
 * Transcribe audio file using local whisper.cpp
 * @param {string} audioPath - Path to the audio file
 * @returns {Promise<string>} - Transcription text
 */
export async function transcribeAudio(audioPath) {
  try {
    const stats = fs.statSync(audioPath);
    const fileSizeInMB = stats.size / (1024 * 1024);

    console.log(`Transcribing: ${audioPath} (${fileSizeInMB.toFixed(2)}MB)`);

    // Use local whisper with English language, plain text output
    const { stdout, stderr } = await execAsync(
      `"${WHISPER_TRANSCRIBE}" -l en --txt "${audioPath}"`,
      { maxBuffer: 50 * 1024 * 1024 } // 50MB buffer for large transcriptions
    );

    // Clean up the output - remove extra whitespace
    const transcription = stdout.trim().replace(/\s+/g, ' ');

    console.log(`Transcription complete: ${transcription.length} characters`);
    return transcription;
  } catch (error) {
    console.error(`Error transcribing ${audioPath}: ${error.message}`);
    return null;
  }
}

/**
 * Transcribe audio with timestamps
 * @param {string} audioPath - Path to the audio file
 * @returns {Promise<Object>} - Transcription with timestamps
 */
export async function transcribeAudioVerbose(audioPath) {
  try {
    const stats = fs.statSync(audioPath);
    const fileSizeInMB = stats.size / (1024 * 1024);

    console.log(`Transcribing (verbose): ${audioPath} (${fileSizeInMB.toFixed(2)}MB)`);

    // Get transcription with timestamps (default output format)
    const { stdout } = await execAsync(
      `"${WHISPER_TRANSCRIBE}" -l en "${audioPath}"`,
      { maxBuffer: 50 * 1024 * 1024 }
    );

    // Parse timestamped output: [00:00:00.000 --> 00:00:05.000] text
    const lines = stdout.trim().split('\n');
    const segments = [];
    let fullText = '';

    for (const line of lines) {
      const match = line.match(/\[(\d{2}):(\d{2}):(\d{2}\.\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}\.\d{3})\]\s*(.*)/);
      if (match) {
        const startTime = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3]);
        const endTime = parseInt(match[4]) * 3600 + parseInt(match[5]) * 60 + parseFloat(match[6]);
        const text = match[7].trim();
        
        segments.push({
          start: startTime,
          end: endTime,
          text: text
        });
        fullText += text + ' ';
      }
    }

    const duration = segments.length > 0 ? segments[segments.length - 1].end : 0;

    return {
      text: fullText.trim(),
      segments: segments,
      duration: duration
    };
  } catch (error) {
    console.error(`Error transcribing ${audioPath}: ${error.message}`);
    return null;
  }
}
