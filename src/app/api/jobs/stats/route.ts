import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/idempiere';

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1';
const PAGE_SIZE = 100;

interface ModelResponse {
  'row-count'?: number;
  rowCount?: number;
  'records-size'?: number;
  records?: Record<string, unknown>[];
}

async function getActivePage(model: string, token: string, top: number, skip = 0) {
  const query = new URLSearchParams({
    '$top': String(top),
    '$skip': String(skip),
    '$filter': 'IsActive eq true',
  });
  const response = await fetch(`${API_URL}/models/${model}?${query.toString()}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Could not load ${model}: ${response.status} ${message}`);
  }

  return await response.json() as ModelResponse;
}

const getRowCount = (data: ModelResponse) =>
  Number(data['row-count'] ?? data.rowCount ?? data['records-size'] ?? data.records?.length ?? 0) || 0;

async function getActiveCount(model: string, token: string) {
  return getRowCount(await getActivePage(model, token, 1));
}

async function getLiveJobsAndCountryCount(token: string) {
  const firstPage = await getActivePage('MCS_Jobs', token, PAGE_SIZE);
  const liveJobs = getRowCount(firstPage);
  const records = [...(firstPage.records || [])];

  for (let skip = PAGE_SIZE; skip < liveJobs; skip += PAGE_SIZE) {
    const page = await getActivePage('MCS_Jobs', token, PAGE_SIZE, skip);
    records.push(...(page.records || []));
  }

  const countryKeys = new Set(
    records
      .map(record => {
        const country = record.C_Country_ID;
        if (typeof country === 'object' && country !== null) {
          const reference = country as { id?: string | number; identifier?: string };
          return String(reference.id ?? reference.identifier ?? '');
        }
        return country == null ? '' : String(country);
      })
      .filter(Boolean),
  );

  return { liveJobs, countries: countryKeys.size };
}

export async function GET() {
  try {
    const token = await getAuthToken();
    const [jobsStats, applications] = await Promise.all([
      getLiveJobsAndCountryCount(token),
      getActiveCount('MCS_Jobs_Applicants', token),
    ]);

    return NextResponse.json({
      liveJobs: jobsStats.liveJobs,
      countries: jobsStats.countries,
      applications,
    });
  } catch (error) {
    console.error('Jobs stats loading failed:', error);
    return NextResponse.json({ error: 'Could not load jobs statistics' }, { status: 500 });
  }
}
