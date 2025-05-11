import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export async function video2thumbnail(videoPath, outputDir) {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate thumbnail filename based on video filename
    const videoFilename = path.basename(videoPath, path.extname(videoPath));
    const thumbnailPath = path.join(outputDir, `${videoFilename}_thumbnail.webp`);

    // Use ffmpeg to extract a frame at 1 second and convert to webp
    const command = `ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 -vf "scale=116:176:force_original_aspect_ratio=decrease,pad=116:176:(ow-iw)/2:(oh-ih)/2" "${thumbnailPath}"`;
    
    await execAsync(command);
    
    return thumbnailPath;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw error;
  }
} 