import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import db from '@/lib/db';
import { serializeBigInt } from '@/utils/helper';

export async function GET() {
  try {
    const outputDir = path.join(process.cwd(), 'public', 'outputs');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      return NextResponse.json({ files: [] });
    }

    // Get all files in the outputs directory
    const files = fs.readdirSync(outputDir)
      .filter(file => file.endsWith('.mp4')) // Only get video files
      .map(fileName => {
        const filePath = path.join(outputDir, fileName);
        const stats = fs.statSync(filePath);
        return {
          name: fileName,
          createdAt: stats.birthtime.getTime(),
          size: stats.size
        };
      });

    const outputs = await db.generatedMedia.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    const serializedOutputs = serializeBigInt(outputs);
    return NextResponse.json({ files: serializedOutputs });
  } catch (error) {
    console.error('Error listing output files:', error);
    return NextResponse.json({ error: 'Failed to list output files' }, { status: 500 });
  }
}