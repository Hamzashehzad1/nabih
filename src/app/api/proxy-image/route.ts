
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

async function handleProxy(request: NextRequest) {
  let imageUrl: string | null = null;
  let requestedWidth: number | null = null;

  const { searchParams } = new URL(request.url);

  if (request.method === 'GET') {
    imageUrl = searchParams.get('url');
    const widthParam = searchParams.get('width');
    if (widthParam) {
      requestedWidth = parseInt(widthParam, 10);
    }
  } else if (request.method === 'POST') {
    try {
      const body = await request.json();
      imageUrl = body.url;
      if (body.width) {
        requestedWidth = parseInt(body.width, 10);
      }
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
  }

  if (!imageUrl) {
    return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
  }

  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch image: ${response.statusText}` }, { status: response.status });
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Use sharp to resize the image
    const sharpInstance = sharp(Buffer.from(imageBuffer));
    
    // Resize if width is specified, otherwise use a sensible default for previews
    const finalWidth = requestedWidth || 800; // Default to 800px width for previews
    const resizedBuffer = await sharpInstance.resize(finalWidth).toBuffer();

    const base64 = `data:${contentType};base64,${resizedBuffer.toString('base64')}`;

    return NextResponse.json({ base64 });

  } catch (error) {
    console.error('Proxy image error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleProxy(request);
}

export async function POST(request: NextRequest) {
  return handleProxy(request);
}
