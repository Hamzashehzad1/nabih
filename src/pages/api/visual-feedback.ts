import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// This API route serves the static visual-feedback.js file.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'visual-feedback.js');
    const stat = fs.statSync(filePath);

    res.writeHead(200, {
      'Content-Type': 'application/javascript',
      'Content-Length': stat.size,
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error loading visual feedback script');
  }
}
