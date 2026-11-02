import { AppError } from '../application/errors.ts';
import type { FieldCipher } from '../application/ports.ts';

const PREFIX = 'saath-v1:';
const IV_LENGTH = 12;
const KEY_PATTERN = /^[0-9a-fA-F]{64}$/;

export function isEncryptionKey(value: string | undefined): value is string {
  return Boolean(value && KEY_PATTERN.test(value.trim()));
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim();
  const bytes = new Uint8Array(clean.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(clean.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

export class PlainCipher implements FieldCipher {
  configured() {
    return false;
  }

  async encrypt(plaintext: string) {
    return plaintext;
  }

  async decrypt(value: string) {
    return value;
  }
}

export class AesGcmCipher implements FieldCipher {
  private readonly hexKey: string;
  private keyPromise: Promise<CryptoKey> | null = null;

  constructor(hexKey: string) {
    this.hexKey = hexKey;
  }

  configured() {
    return true;
  }

  private importKey() {
    this.keyPromise ??= crypto.subtle.importKey(
      'raw',
      hexToBytes(this.hexKey) as BufferSource,
      'AES-GCM',
      false,
      ['encrypt', 'decrypt'],
    );
    return this.keyPromise;
  }

  async encrypt(plaintext: string): Promise<string> {
    if (!plaintext) return plaintext;
    const key = await this.importKey();
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encoded = new TextEncoder().encode(plaintext);
    const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded));
    const packed = new Uint8Array(iv.length + sealed.length);
    packed.set(iv, 0);
    packed.set(sealed, iv.length);
    return PREFIX + bytesToBase64(packed);
  }

  async decrypt(value: string): Promise<string> {
    if (!value || !value.startsWith(PREFIX)) return value;
    try {
      const key = await this.importKey();
      const packed = base64ToBytes(value.slice(PREFIX.length));
      if (packed.length <= IV_LENGTH) throw new Error('short');
      const iv = packed.slice(0, IV_LENGTH);
      const sealed = packed.slice(IV_LENGTH);
      const opened = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, sealed);
      return new TextDecoder().decode(opened);
    } catch {
      throw new AppError(500, 'Saved private text could not be decrypted with the configured key.', 'DECRYPT_FAILED');
    }
  }
}

export function createFieldCipher(hexKey: string | undefined): FieldCipher {
  return isEncryptionKey(hexKey) ? new AesGcmCipher(hexKey.trim()) : new PlainCipher();
}
