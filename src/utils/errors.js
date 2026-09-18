const SECRET_PATTERNS = [
  /signature=[^&\s]+/gi,
  /x-mbx-apikey[^,\s]*/gi,
  /x-bx-apikey[^,\s]*/gi,
  /api[_ -]?secret[^,\s]*/gi,
  /api[_ -]?key[^,\s]*/gi,
];

export function safeError(error) {
  let message = error instanceof Error ? error.message : String(error);
  for (const pattern of SECRET_PATTERNS) {
    message = message.replace(pattern, '[redacted]');
  }
  return message.slice(0, 220);
}

export class ExchangeApiError extends Error {
  constructor(exchange, status, message) {
    super(`${exchange} API${status ? ` (${status})` : ''}: ${message}`);
    this.name = 'ExchangeApiError';
  }
}
