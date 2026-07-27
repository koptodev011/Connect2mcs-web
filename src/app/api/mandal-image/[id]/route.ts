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

    // 1. Fetch attachments list for the mandal
    const attachListRes = await fetch(`${API_URL}/models/MCS_Mandals/${id}/attachments`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      next: { revalidate: 600 }
    });

    if (!attachListRes.ok) {
      return new NextResponse('No attachments found', { status: 404 });
    }

    const attachListData = await attachListRes.json();
    let attachments: any[] = [];
    if (Array.isArray(attachListData)) {
      attachments = attachListData;
    } else if (attachListData && Array.isArray(attachListData.attachments)) {
      attachments = attachListData.attachments;
    } else if (attachListData && Array.isArray(attachListData.records)) {
      attachments = attachListData.records;
    }

    if (attachments.length === 0) {
      return new NextResponse('No attachments found', { status: 404 });
    }

    // Get the filename of the first attachment
    const firstAttach = attachments[0];
    const fileName = firstAttach.name || firstAttach.fileName || firstAttach.FileName;

    if (!fileName) {
      return new NextResponse('Attachment name missing', { status: 404 });
    }

    // 2. Fetch the actual file binary
    const fileRes = await fetch(`${API_URL}/models/MCS_Mandals/${id}/attachments/${fileName}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      next: { revalidate: 600 }
    });

    if (!fileRes.ok) {
      return new NextResponse('Attachment file not found', { status: 404 });
    }

    const arrayBuffer = await fileRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine content type
    let contentType = 'image/jpeg';
    if (fileName.toLowerCase().endsWith('.png')) contentType = 'image/png';
    if (fileName.toLowerCase().endsWith('.webp')) contentType = 'image/webp';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('Error fetching mandal image proxy:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
