import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/idempiere';

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) return new NextResponse('Missing ID', { status: 400 });

    const response = await fetch(`${API_URL}/models/ad_image/${id}?_select=BinaryData,data&_=${Date.now()}`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${await getAuthToken()}` },
      cache: 'no-store',
    });
    if (!response.ok) return new NextResponse('Image not found', { status: 404 });

    const image = await response.json();
    const base64 = String(image.BinaryData || image.data || '');
    if (!base64) return new NextResponse('Image data missing', { status: 404 });

    const buffer = Buffer.from(base64.includes(',') ? base64.substring(base64.indexOf(',') + 1) : base64, 'base64');
    const contentType = base64.includes('image/webp') || base64.startsWith('UklGR')
      ? 'image/webp'
      : base64.includes('image/gif') || base64.startsWith('R0lGOD')
        ? 'image/gif'
        : base64.includes('image/jpeg') || base64.startsWith('/9j/')
          ? 'image/jpeg'
          : 'image/png';

    return new NextResponse(buffer, {
      headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (error) {
    console.error('Error fetching image proxy:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}