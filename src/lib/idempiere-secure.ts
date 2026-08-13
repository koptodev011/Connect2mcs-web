import https from 'node:https';

export type SecureResponse<T> = {
  ok: boolean;
  status: number;
  data: T;
};

/**
 * Calls the private iDempiere HTTPS listener, whose certificate chain is not
 * trusted by the local machine. The bypass is deliberately scoped to this
 * request instead of disabling TLS verification for the Node process.
 */
export function idempiereSecureRequest<T extends object>(
  url: string,
  method: 'POST' | 'PUT',
  token: string,
  body: object,
): Promise<SecureResponse<T>> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const request = https.request(url, {
      method,
      rejectUnauthorized: false,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        Authorization: `Bearer ${token}`,
      },
    }, (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk: Buffer) => chunks.push(chunk));
      response.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let data: T;
        try {
          data = (text ? JSON.parse(text) : {}) as T;
        } catch {
          data = { message: text } as T;
        }
        const status = response.statusCode || 500;
        resolve({ ok: status >= 200 && status < 300, status, data });
      });
    });

    request.setTimeout(30_000, () => request.destroy(new Error('iDempiere secure request timed out')));
    request.on('error', reject);
    request.write(payload);
    request.end();
  });
}
