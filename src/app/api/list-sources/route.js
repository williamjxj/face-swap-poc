import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const sourcesDir = path.join(process.cwd(), 'public', 'sources');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(sourcesDir)) {
      fs.mkdirSync(sourcesDir, { recursive: true });
      return NextResponse.json({ files: [] });
    }

    // Get all files in the sources directory
    const files = fs.readdirSync(sourcesDir)
      .filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) // Only get image files
      .map((fileName, index) => {
        const filePath = path.join(sourcesDir, fileName);
        const stats = fs.statSync(filePath);
        return {
          id: index + 1,
          name: fileName,
          imagePath: `/sources/${fileName}`,
          createdAt: stats.birthtime.getTime()
        };
      });

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error listing source files:', error);
    return NextResponse.json({ error: 'Failed to list source files' }, { status: 500 });
  }
}