
import { NextRequest, NextResponse } from 'next/server';

async function handleProxy(request: NextRequest) {
  let imageUrl: string | null = null;

  if (request.method === 'GET') {
    const { searchParams } = new URL(request.url);
    imageUrl = searchParams.get('url');
  } else if (request.method === 'POST') {
    try {
      const body = await request.json();
      imageUrl = body.url;
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
    
    const base64 = `data:${contentType};base64,${Buffer.from(imageBuffer).toString('base64')}`;

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
