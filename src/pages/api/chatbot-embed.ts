
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// This API route serves the static chatbot-embed.js file.
// We use an API route to ensure correct content-type headers and to
// potentially add more dynamic logic in the future.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'chatbot-embed.js');
    const stat = fs.statSync(filePath);

    res.writeHead(200, {
      'Content-Type': 'application/javascript',
      'Content-Length': stat.size,
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error loading chatbot script');
  }
}

    