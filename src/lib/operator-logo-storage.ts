import { supabase } from "@/lib/supabase";

export const OPERATOR_LOGOS_BUCKET = "operator-logos";

export const MAX_LOGO_SIZE_MB = 2;

export const ACCEPTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

const _PUBLIC_MARKER = "/storage/v1/object/public/";

/** Client-side validation: image type + 2 MB size limit. */
export function validateLogoFile(file: File): string | null {
  if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
    return "Logo must be a PNG, JPG, or WebP image.";
  }
  if (file.size > MAX_LOGO_SIZE_MB * 1024 * 1024) {
    return `Logo must be ${MAX_LOGO_SIZE_MB} MB or smaller.`;
  }
  return null;
}

function extensionFor(file: File): string {
  switch (file.type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

/** Extract the object path from a Supabase public URL of our bucket. */
export function logoPathFromUrl(url: string | null): string | null {
  if (!url) return null;
  const marker = `${_PUBLIC_MARKER}${OPERATOR_LOGOS_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.substring(index + marker.length);
}

/**
 * Uploads an operator logo to the public `operator-logos` bucket using the
 * authenticated Supabase session. Storage RLS restricts write access to
 * authenticated admins; the service-role key is never used here.
 */
export async function uploadOperatorLogo(
  folderId: string,
  file: File,
): Promise<string> {
  const path = `${folderId}/logo.${extensionFor(file)}`;
  const { error } = await supabase.storage
    .from(OPERATOR_LOGOS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(OPERATOR_LOGOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Removes a previously uploaded operator logo, if it belongs to our bucket. */
export async function removeOperatorLogo(logoUrl: string): Promise<void> {
  const path = logoPathFromUrl(logoUrl);
  if (!path) return;
  const { error } = await supabase.storage.from(OPERATOR_LOGOS_BUCKET).remove([path]);
  if (error) {
    throw new Error(error.message);
  }
}
