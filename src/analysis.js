// AI Analysis using OpenAI API

import OpenAI from 'openai';
import * as fs from 'fs';

const openai = new OpenAI();

/**
 * Analyze thumbnail image
 * @param {string} thumbnailPath - Path to thumbnail image
 * @param {string} videoTitle - Video title for context
 * @returns {Promise<Object>} - Thumbnail analysis
 */
export async function analyzeThumbnail(thumbnailPath, videoTitle) {
  try {
    // Read the image and convert to base64
    const imageBuffer = fs.readFileSync(thumbnailPath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = 'image/jpeg';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this YouTube thumbnail for the video titled "${videoTitle}". Provide:
1. Visual style (colors, composition, text overlays)
2. Emotional appeal/hook strategy
3. Text visible on thumbnail
4. Overall effectiveness rating (1-10)
5. What makes it clickable or not

Keep the analysis concise but insightful.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    return {
      analysis: response.choices[0].message.content,
      success: true
    };
  } catch (error) {
    console.error(`Error analyzing thumbnail: ${error.message}`);
    return {
      analysis: 'Thumbnail analysis failed',
      success: false
    };
  }
}

/**
 * Analyze video content and generate summary
 * @param {Object} videoData - Video metadata and transcription
 * @returns {Promise<Object>} - Content analysis
 */
export async function analyzeContent(videoData) {
  const { title, description, transcription, channelName } = videoData;

  // Truncate transcription if too long (keep under 100k chars for context window)
  const maxTranscriptionLength = 80000;
  const truncatedTranscription = transcription && transcription.length > maxTranscriptionLength
    ? transcription.substring(0, maxTranscriptionLength) + '... [truncated]'
    : transcription;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert content analyst specializing in AI/tech YouTube content.
Analyze videos to extract insights, key takeaways, and content remake opportunities for creators.
Be concise but comprehensive. Focus on actionable insights.`
        },
        {
          role: 'user',
          content: `Analyze this YouTube video:

**Title:** ${title}
**Channel:** ${channelName}
**Description:** ${description || 'No description'}

**Full Transcription:**
${truncatedTranscription || 'No transcription available'}

Provide:

## Executive Summary
(2-3 sentences capturing the main point)

## Key Concepts & Takeaways
(5-7 bullet points)

## Notable Quotes or Insights
(2-3 standout moments with timestamps if mentioned)

## Tools/Products Mentioned
(List any tools, products, or services discussed)

## Title & SEO Analysis
- Hook effectiveness
- Keyword usage
- Suggested improvements

## Content Remake Suggestions for Alan
(How could Alan create similar content with a unique angle?)
- Unique angle opportunities
- 3 alternative title suggestions
- Content gaps Alan could fill
- Specific improvements or additions Alan could make`
        }
      ],
      max_tokens: 2000
    });

    return {
      analysis: response.choices[0].message.content,
      success: true
    };
  } catch (error) {
    console.error(`Error analyzing content: ${error.message}`);
    return {
      analysis: 'Content analysis failed: ' + error.message,
      success: false
    };
  }
}

/**
 * Generate aggregate insights across all analyzed videos
 * @param {Array} videoAnalyses - Array of video analysis results
 * @returns {Promise<string>} - Aggregate insights
 */
export async function generateAggregateInsights(videoAnalyses) {
  // Prepare summary of all videos
  const videoSummaries = videoAnalyses.map(v => ({
    title: v.title,
    channel: v.channel,
    summary: v.contentAnalysis?.analysis?.substring(0, 500) || 'No analysis'
  }));

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a content strategist analyzing trends across AI/tech YouTube channels.'
        },
        {
          role: 'user',
          content: `Based on these ${videoSummaries.length} recent videos from various AI YouTube channels, provide:

Videos analyzed:
${videoSummaries.map(v => `- "${v.title}" by ${v.channel}`).join('\n')}

## Trending Topics
What topics are multiple channels covering?

## Content Patterns
What formats and styles are popular?

## Gaps & Opportunities
What topics are underserved or could be approached differently?

## Recommended Actions for Alan
Top 3-5 content ideas based on these trends.`
        }
      ],
      max_tokens: 1500
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error(`Error generating aggregate insights: ${error.message}`);
    return 'Failed to generate aggregate insights';
  }
}
