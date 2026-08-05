import { Tone } from '@/lib/tokens';

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1';

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Authenticates with iDempiere and returns a valid JWT token.
 * It caches the token in memory to avoid authenticating on every request.
 */
export async function getAuthToken(): Promise<string> {
  // If we have a valid token that doesn't expire in the next 5 minutes, use it.
  if (cachedToken && Date.now() < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedToken;
  }

  console.log("🔑 Authenticating with iDempiere...");

  const parameters: any = {
    clientId: Number(process.env.IDEMPIERE_CLIENT_ID),
    organizationId: Number(process.env.IDEMPIERE_ORG_ID),
    warehouseId: Number(process.env.IDEMPIERE_WAREHOUSE_ID),
    language: process.env.IDEMPIERE_LANGUAGE || 'en_US',
  };

  if (process.env.IDEMPIERE_ROLE_ID) {
    const roleId = Number(process.env.IDEMPIERE_ROLE_ID);
    if (!isNaN(roleId)) {
      parameters.roleId = roleId;
    }
  }

  const authData = {
    userName: process.env.IDEMPIERE_USERNAME,
    password: process.env.IDEMPIERE_PASSWORD,
    parameters,
  };

  try {
    const response = await fetch(`${API_URL}/auth/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authData),
      cache: 'no-store', // Never cache the auth response in Next.js fetch cache
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Auth failed: ${response.status} ${err}`);
    }

    const data = await response.json();
    cachedToken = data.token;

    // Decode JWT to find expiry, or default to 1 hour
    try {
      const payloadBase64 = data.token.split('.')[1];
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
      if (payload.exp) {
        tokenExpiresAt = payload.exp * 1000;
      } else {
        tokenExpiresAt = Date.now() + 60 * 60 * 1000;
      }
    } catch (e) {
      tokenExpiresAt = Date.now() + 60 * 60 * 1000;
    }

    return cachedToken as string;
  } catch (error) {
    console.error("❌ Failed to get iDempiere Auth Token:", error);
    throw error;
  }
}

/**
 * Fetches data from an iDempiere model table.
 * 
 * @param modelName The iDempiere table name (e.g., 'MCS_Jobs')
 * @param filter Optional OData filter string (e.g., "IsActive eq 'Y'")
 */
export async function fetchModel(
  modelName: string,
  filter?: string,
  options?: { top?: number; skip?: number; orderby?: string }
) {
  const token = await getAuthToken();
  
  let url = `${API_URL}/models/${modelName}`;
  const query = new URLSearchParams();
  if (filter) query.set('$filter', filter);
  if (options?.top) query.set('$top', options.top.toString());
  if (options?.skip) query.set('$skip', options.skip.toString());
  if (options?.orderby) query.set('$orderby', options.orderby);
  if (query.size > 0) url += `?${query.toString()}`;

  console.log(`🌐 Fetching ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      // Cache data for 60 seconds (ISR pattern) or use no-store for completely dynamic
      next: { revalidate: 60 } 
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Fetch failed for ${modelName}: ${response.status} ${err}`);
    }

    const data = await response.json();
    return data.records || [];
  } catch (error) {
    console.error(`❌ Failed to fetch model ${modelName}:`, error);
    throw error;
  }
}

/**
 * Fetches a single record from an iDempiere model table, optionally expanding relationships.
 * 
 * @param modelName The iDempiere table name (e.g., 'MCS_Mandals')
 * @param recordId The primary key ID of the record (e.g., 1000056)
 * @param expand Optional expands string (e.g., 'ad_user,mcs_socia_media')
 */
export async function fetchModelRecord(modelName: string, recordId: string | number, expand?: string) {
  const token = await getAuthToken();
  
  let url = `${API_URL}/models/${modelName}/${recordId}`;
  if (expand) {
    url += `?$expand=${encodeURIComponent(expand)}`;
  }

  console.log(`🌐 Fetching record ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      next: { revalidate: 60 } 
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Fetch record failed for ${modelName}/${recordId}: ${response.status} ${err}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Failed to fetch record ${modelName}/${recordId}:`, error);
    throw error;
  }
}
