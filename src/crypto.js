const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}
function fromBase64(value) {
  return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}
function randomBytes(length = 16) {
  return crypto.getRandomValues(new Uint8Array(length));
}

async function deriveKey(password, salt) {
  const material = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptText(text, password) {
  const salt = randomBytes();
  const iv = randomBytes(12);
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, encoder.encode(text)
  );
  return { salt: toBase64(salt), iv: toBase64(iv), data: toBase64(encrypted) };
}

async function decryptText(record, password) {
  const salt = fromBase64(record.salt);
  const iv = fromBase64(record.iv);
  const key = await deriveKey(password, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv }, key, fromBase64(record.data)
  );
  return decoder.decode(decrypted);
}

export async function createVault(masterPassword) {
  return encryptText(JSON.stringify([]), masterPassword);
}
export async function saveVault(items, masterPassword) {
  return encryptText(JSON.stringify(items), masterPassword);
}
export async function openVault(record, masterPassword) {
  return JSON.parse(await decryptText(record, masterPassword));
}
export async function protectSecret(secret, secondPassword) {
  return encryptText(secret, secondPassword);
}
export async function revealSecret(record, secondPassword) {
  return decryptText(record, secondPassword);
}