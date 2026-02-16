/**
 * Convert API response (snake_case) → SDK type (camelCase)
 */
export function toCamelCase<T = Record<string, unknown>>(obj: Record<string, unknown>): T {
  if (obj === null || obj === undefined) return obj as T;
  if (Array.isArray(obj)) {
    return obj.map(item =>
      item && typeof item === 'object' ? toCamelCase(item as Record<string, unknown>) : item
    ) as T;
  }
  if (typeof obj !== 'object') return obj as T;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    if (Array.isArray(value)) {
      result[camelKey] = value.map(item =>
        item && typeof item === 'object' ? toCamelCase(item as Record<string, unknown>) : item
      );
    } else if (value && typeof value === 'object') {
      result[camelKey] = toCamelCase(value as Record<string, unknown>);
    } else {
      result[camelKey] = value;
    }
  }
  return result as T;
}

/**
 * Convert SDK type (camelCase) → API request (snake_case)
 */
export function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item =>
      item && typeof item === 'object' ? toSnakeCase(item as Record<string, unknown>) : item
    ) as unknown as Record<string, unknown>;
  }
  if (typeof obj !== 'object') return obj;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
    if (Array.isArray(value)) {
      result[snakeKey] = value.map(item =>
        item && typeof item === 'object' ? toSnakeCase(item as Record<string, unknown>) : item
      );
    } else if (value && typeof value === 'object') {
      result[snakeKey] = toSnakeCase(value as Record<string, unknown>);
    } else {
      result[snakeKey] = value;
    }
  }
  return result;
}
