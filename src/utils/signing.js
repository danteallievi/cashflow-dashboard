import { createHmac } from 'node:crypto';

function entries(params) {
  return Object.entries(params).filter(([, value]) => value !== undefined && value !== null);
}

export function signBinanceParams(params, secret) {
  const query = new URLSearchParams(entries(params)).toString();
  const signature = createHmac('sha256', secret).update(query).digest('hex');
  return `${query}&signature=${signature}`;
}

export function signBingxParams(params, secret) {
  const sorted = entries(params).sort(([a], [b]) => a.localeCompare(b));
  const signingString = sorted.map(([key, value]) => `${key}=${value}`).join('&');
  const signature = createHmac('sha256', secret).update(signingString).digest('hex');
  const query = sorted
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');
  return `${query}&signature=${signature}`;
}
