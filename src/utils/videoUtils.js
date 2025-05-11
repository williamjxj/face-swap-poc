import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

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

    // Use provided thumbnail filename or generate one
    const thumbnailPath = path.join(outputDir, thumbnailFilename || `${path.basename(videoPath, path.extname(videoPath))}_thumbnail.webp`);

    // Use ffmpeg to extract a frame at 1 second and convert to webp
    const command = `ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 -vf "scale=116:176:force_original_aspect_ratio=decrease,pad=116:176:(ow-iw)/2:(oh-ih)/2" "${thumbnailPath}"`;
    
    await execAsync(command);
    
    return thumbnailPath;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw error;
  }
} 