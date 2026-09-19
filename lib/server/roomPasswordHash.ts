import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

/** `salt:hash`(hex) 形式で返す */
export async function hashRoomPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await deriveKey(password, salt);
  return `${salt.toString('hex')}:${key.toString('hex')}`;
}

export async function verifyRoomPasswordHash(password: string, stored: string): Promise<boolean> {
  const [saltHex, keyHex] = stored.split(':');
  if (!saltHex || !keyHex) return false;

  const expected = Buffer.from(keyHex, 'hex');
  if (expected.length !== KEY_LENGTH) return false;

  const actual = await deriveKey(password, Buffer.from(saltHex, 'hex'));
  return timingSafeEqual(actual, expected);
}
