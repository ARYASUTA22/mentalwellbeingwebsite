import { createHash } from "node:crypto";
import { getSafeEnv } from "@/env";

export interface CloudinarySignPayload {
  timestamp: number;
  folder: string;
  signature: string;
  apiKey: string;
  cloudName: string;
}

/**
 * Generates an HMAC-free SHA-1 signature conforming to Cloudinary's signed upload specification.
 */
export function signCloudinaryUpload(
  folder = "sanctuary-hub"
): CloudinarySignPayload {
  const env = getSafeEnv();
  if (
    !env.CLOUDINARY_API_SECRET ||
    !env.CLOUDINARY_API_KEY ||
    !env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  ) {
    throw new Error(
      "Cloudinary credentials are not configured in .env.local."
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign: Record<string, string | number> = {
    folder,
    timestamp,
  };

  const serialized = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join("&");

  const signature = createHash("sha1")
    .update(`${serialized}${env.CLOUDINARY_API_SECRET}`)
    .digest("hex");

  return {
    timestamp,
    folder,
    signature,
    apiKey: env.CLOUDINARY_API_KEY,
    cloudName: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  };
}

/**
 * Builds an optimized WebP/AVIF Cloudinary delivery URL when configured.
 */
export function buildCloudinaryAssetUrl(
  publicId: string | null | undefined,
  options?: { width?: number; height?: number }
): string | null {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!publicId || !cloudName) {
    return null;
  }

  const transforms = ["f_auto", "q_auto"];
  if (options?.width) transforms.push(`w_${options.width}`);
  if (options?.height) transforms.push(`h_${options.height}`);
  if (options?.width && options?.height) transforms.push("c_fill");

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms.join(",")}/${publicId}`;
}
