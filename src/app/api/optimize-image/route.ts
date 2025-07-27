
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { z } from 'zod';

const OptimizeRequestSchema = z.object({
  image: z.string(), // base64 string
  format: z.enum(['jpeg', 'png', 'webp']),
  quality: z.number().min(0).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = OptimizeRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parseResult.error.errors }, { status: 400 });
    }

    const { image, format, quality } = parseResult.data;

    const imageBuffer = Buffer.from(image.split(';base64,').pop()!, 'base64');

    let optimizedBuffer: Buffer;
    const sharpInstance = sharp(imageBuffer);

    // This endpoint is now primarily for PNG, but can handle others if called.
    switch (format) {
      case 'jpeg':
        optimizedBuffer = await sharpInstance.jpeg({ quality }).toBuffer();
        break;
      case 'png':
         // Use pngquant for high-quality PNG compression
        optimizedBuffer = await sharpInstance.png({ quality, compressionLevel: 8, palette: true }).toBuffer();
        break;
      case 'webp':
        optimizedBuffer = await sharpInstance.webp({ quality }).toBuffer();
        break;
      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }
    
    const mimeType = `image/${format}`;
    const base64 = `data:${mimeType};base64,${optimizedBuffer.toString('base64')}`;
    const size = optimizedBuffer.length;

    return NextResponse.json({ base64, size });

  } catch (error) {
    console.error('Image optimization error:', error);
    if (error instanceof Error) {
        return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
