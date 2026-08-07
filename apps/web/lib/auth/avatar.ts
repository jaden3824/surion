import sharp from "sharp";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const DATA_URL_PATTERN = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

function hasExpectedSignature(mimeType: string, bytes: Buffer) {
  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return signature.every((byte, index) => bytes[index] === byte);
  }
  if (mimeType === "image/webp") {
    return bytes.length >= 12
      && bytes.subarray(0, 4).toString("ascii") === "RIFF"
      && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  }
  return false;
}

export function parseAvatarDataUrl(value: string) {
  const match = DATA_URL_PATTERN.exec(value);
  if (!match) return null;

  const [, mimeType, encoded] = match;
  const bytes = Buffer.from(encoded, "base64");
  const padding = encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0;
  const expectedBytes = Math.floor((encoded.length * 3) / 4) - padding;

  if (!bytes.length || bytes.length !== expectedBytes || bytes.length > MAX_AVATAR_BYTES) {
    return null;
  }
  if (!hasExpectedSignature(mimeType, bytes)) return null;

  return { bytes, mimeType };
}

/** Re-encoding removes EXIF/location metadata and keeps public avatars small. */
export async function normalizeAvatar(bytes: Buffer) {
  return sharp(bytes, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize(512, 512, { fit: "cover", position: "centre" })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
}
