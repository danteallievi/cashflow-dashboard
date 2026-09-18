import { ExchangeApiError } from './errors.js';

export async function fetchJson(url, { exchange = 'Remote', headers = {} } = {}) {
  let response;
  try {
    response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    throw new ExchangeApiError(exchange, null, error.name === 'TimeoutError' ? 'request timed out' : error.message);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.msg || payload?.message || response.statusText || 'request failed';
    throw new ExchangeApiError(exchange, response.status, message);
  }
  return payload;
}
