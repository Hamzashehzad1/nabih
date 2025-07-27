
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
