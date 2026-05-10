import { ROOMIFY_RENDER_PROMPT } from "./constants";

const OPENROUTER_KEY_STORAGE = "roomify_openrouter_key";

export const getOpenRouterApiKey = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(OPENROUTER_KEY_STORAGE);
};

export const setOpenRouterApiKey = (value: string) => {
  if (typeof window === "undefined") return;
  if (!value) {
    window.localStorage.removeItem(OPENROUTER_KEY_STORAGE);
    return;
  }
  window.localStorage.setItem(OPENROUTER_KEY_STORAGE, value);
};

export const fetchAsDataUrl = async (url: string): Promise<string> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const generate3DView = async ({ sourceImage }: Generate3DViewParams) => {
    const dataUrl = sourceImage.startsWith('data:')
        ? sourceImage
        : await fetchAsDataUrl(sourceImage);

    const base64Data = dataUrl.split(',')[1];
    const mimeType = dataUrl.split(';')[0].split(':')[1];

    if(!mimeType || !base64Data) throw new Error('Invalid source image payload');

    const apiKey = getOpenRouterApiKey();
    if (!apiKey) throw new Error("Missing OpenRouter API key");

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: ROOMIFY_RENDER_PROMPT,
        inputImage: base64Data,
        inputImageMimeType: mimeType,
      }),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const errorJson = await response.json();
        throw new Error(errorJson?.error || "Generation failed");
      }
      const errorText = await response.text();
      throw new Error(errorText || "Generation failed");
    }

    const data = (await response.json()) as {
      renderedImage?: string | null;
      renderedPath?: string | null;
    };

    return {
      renderedImage: data?.renderedImage ?? null,
      renderedPath: data?.renderedPath ?? undefined,
    };
}
