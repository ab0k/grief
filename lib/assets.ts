import { createClient } from "@/lib/supabase/client";

export type AssetType = "image" | "video" | "audio" | "cursor" | "font";

export type UserAsset = {
  id: number;
  user_id: string;
  type: AssetType;
  name: string;
  url: string;
  storage_path: string;
  size: number | null;
  mime_type: string | null;
  created_at: string;
};

const BUCKET = "profile-media";

/** Upload a file and record it in user_assets. Returns the saved asset or null on error. */
export async function uploadAsset(
  file: File,
  userId: string,
  type: AssetType
): Promise<UserAsset | null> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "";
  const timestamp = Date.now();
  const storagePath = `${userId}/assets/${type}/${timestamp}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { upsert: false, contentType: file.type });

  if (uploadError) {
    console.error("Storage upload failed:", uploadError.message);
    return null;
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  const { data, error: dbError } = await supabase
    .from("user_assets")
    .insert({
      user_id: userId,
      type,
      name: file.name,
      url: publicUrl,
      storage_path: storagePath,
      size: file.size,
      mime_type: file.type,
    })
    .select()
    .single();

  if (dbError) {
    console.error("DB insert failed:", dbError.message);
    // Clean up orphaned storage object
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return null;
  }

  return data as UserAsset;
}

/** Delete an asset from storage and the database. */
export async function deleteAsset(asset: UserAsset): Promise<boolean> {
  const supabase = createClient();

  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([asset.storage_path]);

  if (storageError) {
    console.error("Storage delete failed:", storageError.message);
    return false;
  }

  const { error: dbError } = await supabase
    .from("user_assets")
    .delete()
    .eq("id", asset.id);

  if (dbError) {
    console.error("DB delete failed:", dbError.message);
    return false;
  }

  return true;
}

/** Fetch all assets for the current user, optionally filtered by type. */
export async function getUserAssets(type?: AssetType): Promise<UserAsset[]> {
  const supabase = createClient();
  let query = supabase
    .from("user_assets")
    .select("*")
    .order("created_at", { ascending: false });

  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) {
    console.error("Failed to fetch assets:", error.message);
    return [];
  }
  return (data ?? []) as UserAsset[];
}

export function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
