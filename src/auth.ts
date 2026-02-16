import { FleeksAuthenticationError } from './errors';

export function validateApiKey(apiKey: string): void {
  if (!apiKey) {
    throw new FleeksAuthenticationError(
      'API key required. Pass apiKey option or set FLEEKS_API_KEY env var.'
    );
  }
  if (!apiKey.startsWith('fleeks_')) {
    throw new FleeksAuthenticationError(
      'Invalid API key format. Must start with "fleeks_".'
    );
  }
  if (apiKey.length < 32) {
    throw new FleeksAuthenticationError(
      'Invalid API key format. Key too short.'
    );
  }
}

export function getAuthHeaders(apiKey: string): Record<string, string> {
  return {
    'X-API-Key': apiKey,
    'Authorization': `Bearer ${apiKey}`,
  };
}
