import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export async function addWatermark(inputPath, outputPath, watermarkText = 'Preview') {
  try {
    // Ensure the output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // FFmpeg command to add watermark text
    const command = `ffmpeg -i "${inputPath}" -vf "drawtext=text='${watermarkText}':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=(h-text_h)/2" -codec:a copy "${outputPath}"`;

    await execAsync(command);
    return true;
  } catch (error) {
    console.error('Error adding watermark:', error);
    throw error;
  }
}

export async function generateWatermarkedVersion(filePath, filename) {
  try {
    const watermarkPath = path.join('public', 'outputs', 'watermarked', filename);
    await addWatermark(filePath, watermarkPath);
    return `/outputs/watermarked/${filename}`;
  } catch (error) {
    console.error('Error generating watermarked version:', error);
    throw error;
  }
} 

export async function getVideoDuration(videoPath) {
  try {
    // Use ffprobe to get video duration
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
    const { stdout } = await execAsync(command);
    const duration = parseFloat(stdout);
    return duration;
  } catch (error) {
    console.error('Error getting video duration:', error);
    throw error;
  }
}

export async function video2thumbnail(videoPath, outputDir, thumbnailFilename) {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const thumbnailPath = path.join(outputDir, thumbnailFilename);

    // Use ffmpeg to extract a frame at 1 second and convert to webp with higher quality
    // -quality 100: Maximum quality (0-100)
    // -compression_level 0: Best compression (0-6, where 0 is best)
    // -lossless 1: Enable lossless compression
    const command = `ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 -vf "scale=116:176:force_original_aspect_ratio=decrease,pad=116:176:(ow-iw)/2:(oh-ih)/2" -quality 100 -compression_level 0 -lossless 1 "${thumbnailPath}"`;
    
    await execAsync(command);
    
    return thumbnailPath;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw error;
  }
} 