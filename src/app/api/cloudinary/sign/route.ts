import { NextResponse } from "next/server";
import { z } from "zod";
import { signCloudinaryUpload } from "@/lib/cloudinary";

const signRequestSchema = z.object({
  folder: z
    .string()
    .regex(/^[a-zA-Z0-9/_-]+$/)
    .max(80)
    .optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = signRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid Cloudinary folder parameter." },
        { status: 400 }
      );
    }

    const signed = signCloudinaryUpload(parsed.data.folder ?? "sanctuary-hub");
    return NextResponse.json(signed);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Cloudinary signature failed. Check environment variables.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
