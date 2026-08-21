import { NextRequest, NextResponse } from 'next/server';
import { verifyFavoriteUser } from '@/lib/favorite-session';
import { fetchModel } from '@/lib/idempiere';

type Reference = { id?: number | string; identifier?: string };
type BusinessRecord = {
  id?: number | string;
  Name?: string;
  IsActive?: boolean;
  AD_User_ID?: Reference | number | string;
  CreatedBy?: Reference | number | string;
};

function referenceId(value: Reference | number | string | undefined) {
  return String(
    value && typeof value === 'object' ? value.id || '' : value || '',
  );
}

export async function GET(request: NextRequest) {
  try {
    const userId = verifyFavoriteUser(
      request.cookies.get('mcs_favorite_user')?.value,
    );
    if (!userId) {
      return NextResponse.json(
        { error: 'Please sign in to view your businesses.', records: [] },
        { status: 401 },
      );
    }

    const records = (await fetchModel('MCS_Businesses', 'IsActive eq true', {
      top: 100,
      orderby: 'Name',
    })) as BusinessRecord[];
    const businesses = records
      .filter(
        (record) =>
          record.IsActive !== false &&
          (referenceId(record.AD_User_ID) === String(userId) ||
            referenceId(record.CreatedBy) === String(userId)),
      )
      .map((record) => ({
        id: String(record.id || ''),
        name: String(record.Name || '').trim(),
      }))
      .filter((record) => record.id && record.name);

    return NextResponse.json({ records: businesses });
  } catch (error) {
    console.error('User businesses fetch failed:', error);
    return NextResponse.json(
      { error: 'Could not load your businesses.', records: [] },
      { status: 500 },
    );
  }
}
