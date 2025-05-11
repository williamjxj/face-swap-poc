import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

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