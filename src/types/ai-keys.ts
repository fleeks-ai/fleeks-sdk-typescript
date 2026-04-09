/**
 * Types for AI provider key management (BYOK).
 */

/** Response returned when storing or listing a key. */
export interface AIKeyInfo {
  provider: string;
  isSet: boolean;
  keyPrefix: string | null;
  updatedAt: string | null;
}

/** Request body for storing a key. */
export interface SetAIKeyOptions {
  provider: string;
  apiKey: string;
}

/** Response returned when deleting a key. */
export interface AIKeyDeleteResult {
  provider: string;
  deleted: boolean;
  message: string;
}
