// ============================================================
// Destiny AI Forge — AES-256-GCM Encryption for Token Storage
// ============================================================
// Used to encrypt OAuth tokens before storing them in HTTP-only cookies.
// This ensures that even if the cookie is somehow exfiltrated, the tokens
// are unreadable without the server's SESSION_SECRET.
// ============================================================

import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Derives a 256-bit encryption key from the SESSION_SECRET using scrypt.
 * The salt ensures different keys even if the same secret is reused.
 */
function deriveKey(secret: string, salt: Buffer): Buffer {
  return scryptSync(secret, salt, KEY_LENGTH);
}

/**
 * Gets the session secret from environment variables.
 * Throws a clear error if not configured.
 */
function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      '[Destiny AI Forge] SESSION_SECRET is missing or too short. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return secret;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a base64-encoded string containing: salt + iv + tag + ciphertext.
 */
export function encrypt(plaintext: string): string {
  const secret = getSecret();
  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(secret, salt);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Pack: salt(16) + iv(16) + tag(16) + ciphertext(variable)
  const packed = Buffer.concat([salt, iv, tag, encrypted]);
  return packed.toString('base64');
}

/**
 * Decrypts a base64-encoded AES-256-GCM encrypted string.
 * Returns the original plaintext, or throws on tampering/wrong key.
 */
export function decrypt(encryptedBase64: string): string {
  const secret = getSecret();
  const packed = Buffer.from(encryptedBase64, 'base64');

  // Unpack: salt(16) + iv(16) + tag(16) + ciphertext(rest)
  const salt = packed.subarray(0, SALT_LENGTH);
  const iv = packed.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = packed.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const ciphertext = packed.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const key = deriveKey(secret, salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
