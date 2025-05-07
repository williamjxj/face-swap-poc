// app/api/face-fusion/route.js

import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';
import formidable from 'formidable';
import axios from 'axios';
import { NextResponse } from 'next/server';

const pipe = promisify(pipeline);

export const config = {
  api: {
    bodyParser: false, // disable built-in parser to use formidable
  },
};

export async function POST(request) {
  try {
    // 1. Parse multipart form data (fields unused, only files)
    const form = formidable({ multiples: false });
    const { files } = await new Promise((resolve, reject) => {
      form.parse(request, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const source = files.source;
    const target = files.target;
    if (!source || !target) {
      return NextResponse.json(
        { error: 'Must include “source” (image) and “target” (video) files.' },
        { status: 400 }
      );
    }

    // 2. Create Task: upload files to CREATE_API
    const createForm = new FormData();
    createForm.append('source', fs.createReadStream(source.filepath));
    createForm.append('target', fs.createReadStream(target.filepath));

    const createRes = await axios.post(process.env.MODAL_CREATE_API, createForm, {
      headers: createForm.getHeaders(),
    });
    const outputPath = createRes.data.output_path;

    // 3. Poll QUERY_API until 200 OK or error
    const maxAttempts = 20;
    const intervalMs = 5000;
    let attempt = 0;

    while (attempt < maxAttempts) {
      const queryRes = await axios.post(
        process.env.MODAL_QUERY_API,
        { output_path: outputPath },
        {
          responseType: 'arraybuffer',
          validateStatus: () => true, // handle all statuses manually
          headers: { 'Content-Type': 'application/json' },
        }
      );

      // Success: binary file returned
      if (queryRes.status === 200) {
        const contentType = queryRes.headers['content-type'] || 'video/mp4';
        const ext = contentType.split('/')[1].split(';')[0] || 'mp4';
        const filename = `fusion_result.${ext}`;
        const destPath = path.join(process.cwd(), 'public', filename);

        // write the returned binary buffer out
        fs.writeFileSync(destPath, queryRes.data);

        return NextResponse.json({ message: 'Done', url: `/${filename}` });
      }

      // Client/server error: surface back
      if ([400, 404, 500].includes(queryRes.status)) {
        const text = Buffer.from(queryRes.data).toString();
        return NextResponse.json(
          { error: text || 'Unknown error', status: queryRes.status },
          { status: queryRes.status }
        );
      }

      // Still processing: wait then retry
      await new Promise((r) => setTimeout(r, intervalMs));
      attempt++;
    }

    // timed out
    return NextResponse.json(
      { error: 'Task did not complete in time (timeout)' },
      { status: 504 }
    );

  } catch (err) {
    console.error('API /face-fusion error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}
