import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/idempiere';

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const id = params.id;
    if (!id) {
      return new NextResponse('Missing ID', { status: 400 });
    }

    const token = await getAuthToken();

    const response = await fetch(`${API_URL}/models/ad_image/${id}?_select=BinaryData`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      next: { revalidate: 600 }
    });

    if (!response.ok) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const data = await response.json();
    const base64Str = data.BinaryData;
    
    if (!base64Str) {
      return new NextResponse('Image data missing', { status: 404 });
    }

    // Convert base64 to Buffer
    const buffer = Buffer.from(base64Str, 'base64');
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('Error fetching image proxy:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
