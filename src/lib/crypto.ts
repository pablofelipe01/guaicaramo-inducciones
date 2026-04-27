import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_BYTES = 12; // GCM standard
const TAG_BYTES = 16;

function getKey(): Buffer {
  const raw = process.env.SIGNATURE_ENCRYPTION_KEY;
  if (!raw) throw new Error("Missing SIGNATURE_ENCRYPTION_KEY");
  if (raw.length !== 32) {
    throw new Error(
      "SIGNATURE_ENCRYPTION_KEY debe tener exactamente 32 caracteres"
    );
  }
  return Buffer.from(raw, "utf8");
}

/**
 * Encrypts a UTF-8 string with AES-256-GCM.
 * Output format (single string): v1.<iv-b64>.<tag-b64>.<ciphertext-b64>
 */
export function encryptString(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64"),
    tag.toString("base64"),
    enc.toString("base64"),
  ].join(".");
}

/**
 * Decrypts a string produced by `encryptString`.
 */
export function decryptString(payload: string): string {
  const key = getKey();
  const parts = payload.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Formato de cifrado inválido");
  }
  const iv = Buffer.from(parts[1], "base64");
  const tag = Buffer.from(parts[2], "base64");
  const data = Buffer.from(parts[3], "base64");
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
    throw new Error("Encabezado de cifrado inválido");
  }
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString("utf8");
}

/**
 * SHA-256 hex digest of the original (unencrypted) string.
 */
export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}
