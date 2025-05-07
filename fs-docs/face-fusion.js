import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios from 'axios';
import formidable from 'formidable';
import { promisify } from 'util';

export const config = {
  api: {
    bodyParser: false, // Required for file uploads
  },
};

const CREATE_API = process.env.MODAL_CREATE_API;
const QUERY_API = process.env.MODAL_QUERY_API;

// Helper to parse multipart/form-data
const parseForm = async (req) =>
  await promisify(formidable({ multiples: false }).parse)(req);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const [fields, files] = await parseForm(req);
    const source = files.source;
    const target = files.target;

    // Step 1: Create Task
    const form = new FormData();
    form.append('source', fs.createReadStream(source.filepath));
    form.append('target', fs.createReadStream(target.filepath));

    const createResp = await axios.post(CREATE_API, form, {
      headers: form.getHeaders(),
    });

    const outputPath = createResp.data.output_path;
    console.log('Task Created. Output path:', outputPath);

    // Step 2: Polling Loop for Result
    const pollForResult = async () => {
      while (true) {
        try {
          const queryResp = await axios.post(QUERY_API, { output_path: outputPath }, {
            responseType: 'arraybuffer',
            validateStatus: () => true, // allow handling all status codes
            headers: { 'Content-Type': 'application/json' }
          });

          const status = queryResp.status;
          if (status === 200) {
            // Save the binary file
            const contentType = queryResp.headers['content-type'];
            const ext = contentType.includes('mp4') ? 'mp4' : contentType.split('/')[1];
            const filename = `face_fusion_result.${ext}`;
            const savePath = path.join(process.cwd(), 'public', filename);

            fs.writeFileSync(savePath, queryResp.data);
            return res.status(200).json({ message: 'Success', filename });
          } else if ([400, 404, 500].includes(status)) {
            return res.status(status).json({ error: queryResp.data });
          }

          // Task still processing (e.g., 202)
          console.log('Still processing, retrying in 5 seconds...');
          await new Promise((resolve) => setTimeout(resolve, 5000));

        } catch (err) {
          console.error('Polling error:', err.message);
          return res.status(500).json({ error: 'Polling failed', details: err.message });
        }
      }
    };

    await pollForResult();
  } catch (err) {
    console.error('Unexpected error:', err.message);
    res.status(500).json({ error: 'Unexpected server error', details: err.message });
  }
}
