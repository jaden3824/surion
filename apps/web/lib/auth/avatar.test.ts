import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { normalizeAvatar, parseAvatarDataUrl } from "./avatar";

function dataUrl(mimeType: string, bytes: Buffer) {
  return `data:${mimeType};base64,${bytes.toString("base64")}`;
}

describe("parseAvatarDataUrl", () => {
  it.each([
    ["image/jpeg", Buffer.from([0xff, 0xd8, 0xff, 0x01])],
    ["image/png", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01])],
    ["image/webp", Buffer.from("RIFF0000WEBPdata", "ascii")],
  ])("accepts a %s image whose bytes match its MIME signature", (mimeType, bytes) => {
    const parsed = parseAvatarDataUrl(dataUrl(mimeType as string, bytes as Buffer));
    expect(parsed?.mimeType).toBe(mimeType);
    expect(parsed?.bytes).toEqual(bytes);
  });

  it("rejects an image whose declared MIME type does not match its bytes", () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x01]);
    expect(parseAvatarDataUrl(dataUrl("image/png", jpeg))).toBeNull();
  });

  it("rejects unsupported and malformed data URLs", () => {
    expect(parseAvatarDataUrl("data:image/gif;base64,R0lGODlh")).toBeNull();
    expect(parseAvatarDataUrl("https://example.com/avatar.png")).toBeNull();
    expect(parseAvatarDataUrl("data:image/png;base64,not base64")).toBeNull();
  });

  it("rejects decoded images larger than 2 MB", () => {
    const oversizedPng = Buffer.alloc(2 * 1024 * 1024 + 1);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(oversizedPng);
    expect(parseAvatarDataUrl(dataUrl("image/png", oversizedPng))).toBeNull();
  });
});

describe("normalizeAvatar", () => {
  it("creates a square WebP without carrying source metadata", async () => {
    const source = await sharp({
      create: { width: 800, height: 600, channels: 3, background: "#2563eb" },
    }).withMetadata({ orientation: 6 }).jpeg().toBuffer();

    const normalized = await normalizeAvatar(source);
    const metadata = await sharp(normalized).metadata();

    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(512);
    expect(metadata.height).toBe(512);
    expect(metadata.exif).toBeUndefined();
    expect(metadata.orientation).toBeUndefined();
  });
});
