import { supabase } from "./supabase.client";
import { SUPABASE_URL } from "./env";
import { dataUrlToBlob, fetchBlobFromUrl, getImageExtension } from "./utils";

const STORAGE_BUCKET = "roomify";

const isSupabasePublicUrl = (url: string) =>
  typeof url === "string" &&
  !!SUPABASE_URL &&
  url.startsWith(`${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/`);

const resolveImageBlob = async (url: string) => {
  if (url.startsWith("data:")) {
    return dataUrlToBlob(url);
  }
  return fetchBlobFromUrl(url);
};

const uploadImageToStorage = async (params: {
  url: string;
  projectId: string;
  label: "source" | "rendered";
}): Promise<string | null> => {
  const { url, projectId, label } = params;
  if (!url) return null;
  if (isSupabasePublicUrl(url)) return url;

  const resolved = await resolveImageBlob(url);
  if (!resolved) return null;

  const contentType = resolved.contentType || resolved.blob.type || "image/png";
  const ext = getImageExtension(contentType, url);
  const filePath = `projects/${projectId}/${label}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, resolved.blob, {
      upsert: true,
      contentType,
    });

  if (uploadError) {
    console.warn("Failed to upload image", uploadError);
    return null;
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  return data?.publicUrl || null;
};

const mapProjectRow = (row: any): DesignItem | null => {
  if (!row?.id || !row?.source_image) return null;
  return {
    id: row.id,
    name: row.name ?? null,
    sourceImage: row.source_image,
    renderedImage: row.rendered_image ?? null,
    timestamp: row.timestamp ?? Date.now(),
    ownerId: row.owner_id ?? null,
    isPublic: row.is_public ?? false,
  };
};

export const signIn = async () => {
  const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: redirectTo ? { redirectTo } : undefined,
  });
  if (error) throw error;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user ?? null;
  } catch {
    return null;
  }
};

export const createProject = async ({ item, visibility = "private" }: CreateProjectParams) => {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user?.id) return null;

    const projectId = item.id;
    const hostedSource = await uploadImageToStorage({
      url: item.sourceImage,
      projectId,
      label: "source",
    });

    if (!hostedSource) return null;

    const hostedRender = item.renderedImage
      ? await uploadImageToStorage({
          url: item.renderedImage,
          projectId,
          label: "rendered",
        })
      : null;

    const payload = {
      id: projectId,
      name: item.name ?? null,
      source_image: hostedSource,
      rendered_image: hostedRender ?? null,
      timestamp: item.timestamp ?? Date.now(),
      owner_id: auth.user.id,
      is_public: visibility === "public",
    };

    const { data, error } = await supabase
      .from("projects")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.error("Failed to save project", error);
      return null;
    }

    return mapProjectRow(data);
  } catch (error) {
    console.error("Failed to save project", error);
    return null;
  }
};

export const getProjects = async (): Promise<DesignItem[]> => {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user?.id) return [];

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("owner_id", auth.user.id)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Failed to fetch projects", error);
      return [];
    }

    return (data || []).map(mapProjectRow).filter(Boolean) as DesignItem[];
  } catch (error) {
    console.error("Failed to fetch projects", error);
    return [];
  }
};

export const getProjectById = async ({ id }: { id: string }) => {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user?.id) return null;

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("owner_id", auth.user.id)
      .single();

    if (error) {
      console.error("Failed to fetch project", error);
      return null;
    }

    return mapProjectRow(data);
  } catch (error) {
    console.error("Failed to fetch project", error);
    return null;
  }
};
