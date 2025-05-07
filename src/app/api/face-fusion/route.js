// app/api/face-fusion/route.js
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

export const runtime = 'nodejs'; // Required for filesystem access

export async function POST() {
  try {
    // Step 1: Create Fusion Task
    const assetsDir = path.join(process.cwd(), 'src', 'assets');
    const sourcePath = path.join(assetsDir, 'image.png');
    const targetPath = path.join(assetsDir, 'video.mp4');

    // Prepare form data
    const form = new FormData();
    form.append('source', fs.createReadStream(sourcePath), { filename: 'image.png' });
    form.append('target', fs.createReadStream(targetPath), { filename: 'video.mp4' });

    // Create task request
    const createRes = await fetch(process.env.MODAL_CREATE_API, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });

    if (!createRes.ok) {
      const error = await createRes.text();
      throw new Error(`Create task failed: ${error}`);
    }

    const { output_path } = await createRes.json();

    // Step 2: Poll Task Status
    let resultBuffer;
    let attempts = 0;
    const maxAttempts = 20; // 20 * 5s = 100s timeout

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const queryRes = await fetch(process.env.MODAL_QUERY_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ output_path }),
      });

      // Handle response
      if (queryRes.status === 200) {
        const arrayBuffer = await queryRes.arrayBuffer();
        resultBuffer = Buffer.from(arrayBuffer);
        break;
      }

      if ([400, 404, 500].includes(queryRes.status)) {
        const error = await queryRes.json();
        throw new Error(`API Error: ${error.message}`);
      }

      attempts++;
    }

    if (!resultBuffer) {
      throw new Error('Processing timeout - task not completed within allowed time');
    }

    // Save result
    const contentType = queryRes.headers.get('content-type');
    const extension = contentType.includes('video') ? 'mp4' : 'png';
    const filename = `result-${Date.now()}.${extension}`;
    const outputPath = path.join(assetsDir, filename);

    fs.writeFileSync(outputPath, resultBuffer);

    return NextResponse.json({
      success: true,
      message: 'Face fusion completed',
      file: filename,
      path: outputPath.replace(process.cwd(), '')
    });

  } catch (error) {
    console.error('Face fusion error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}