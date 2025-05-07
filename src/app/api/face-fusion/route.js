// app/api/face-fusion/route.js
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: false
  }
};

export async function POST(request) {
  try {
    // Handle both initial task creation and status polling
    if (request.headers.get('content-type')?.includes('application/json')) {
      // This is a status polling request
      const { output_path } = await request.json();
      
      const queryRes = await axios.post(process.env.MODAL_QUERY_API, 
        { output_path }, 
        {
          responseType: 'arraybuffer',
          validateStatus: () => true,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (queryRes.status === 200) {
        const contentType = queryRes.headers['content-type'];
        const ext = contentType.includes('mp4') ? 'mp4' : contentType.split('/')[1];
        const filename = `result_${Date.now()}.${ext}`;
        const savePath = path.join(process.cwd(), 'public', 'outputs', filename);

        // Ensure directory exists
        fs.mkdirSync(path.dirname(savePath), { recursive: true });
        fs.writeFileSync(savePath, queryRes.data);

        return NextResponse.json({
          status: 'success',
          message: 'Face fusion completed',
          file: `/outputs/${filename}`
        });
      }

      if ([400, 404, 500].includes(queryRes.status)) {
        const error = Buffer.from(queryRes.data).toString();
        return NextResponse.json({ error }, { status: queryRes.status });
      }

      return NextResponse.json({ status: 'processing' });
    }

    // This is an initial task creation request
    const formData = await request.formData();
    const source = formData.get('source');
    const target = formData.get('target');

    if (!source || !target) {
      return NextResponse.json(
        { error: 'Source and target files are required' },
        { status: 400 }
      );
    }

    // Create form data for the API
    const apiForm = new FormData();
    apiForm.append('source', Buffer.from(await source.arrayBuffer()), {
      filename: source.name,
      contentType: source.type
    });
    apiForm.append('target', Buffer.from(await target.arrayBuffer()), {
      filename: target.name,
      contentType: target.type
    });

    const createRes = await axios.post(
      process.env.MODAL_CREATE_API,
      apiForm,
      { headers: apiForm.getHeaders() }
    );

    return NextResponse.json(createRes.data);
  } catch (error) {
    console.error('Face fusion error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}