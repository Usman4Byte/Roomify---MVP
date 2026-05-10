import type { Route } from "./+types/api.generate";
import { OPENROUTER_API_BASE, OPENROUTER_MODEL } from "../../lib/env";

const jsonError = (status: number, message: string) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const isDataUrl = (value: string) =>
  /^data:image\/[a-z0-9.+-]+;base64,/i.test(value);

const fetchImageAsDataUrl = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch generated image");
  const contentType = response.headers.get("content-type") || "image/png";
  const buffer = Buffer.from(await response.arrayBuffer());
  return `data:${contentType};base64,${buffer.toString("base64")}`;
};

const extractBase64FromText = (text: string): string | null => {
  const dataUrlMatch = text.match(/data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/i);
  if (dataUrlMatch?.[0]) return dataUrlMatch[0];

  const base64Match = text.match(/[A-Za-z0-9+/=]{400,}/);
  if (base64Match?.[0]) return `data:image/png;base64,${base64Match[0]}`;

  return null;
};

const extractImageFromResponse = async (payload: any): Promise<string | null> => {
  const dataItem = payload?.data?.[0];
  if (dataItem?.b64_json) {
    return `data:image/png;base64,${dataItem.b64_json}`;
  }
  if (dataItem?.url) {
    return isDataUrl(dataItem.url) ? dataItem.url : await fetchImageAsDataUrl(dataItem.url);
  }

  const message = payload?.choices?.[0]?.message;

  if (Array.isArray(message?.images)) {
    for (const img of message.images) {
      const url = img?.image_url?.url || img?.url;
      if (typeof url === "string") {
        return isDataUrl(url) ? url : await fetchImageAsDataUrl(url);
      }
    }
  }

  const content = message?.content;
  if (typeof content === "string") {
    return extractBase64FromText(content);
  }
  if (Array.isArray(content)) {
    for (const part of content) {
      const url = part?.image_url?.url;
      if (typeof url === "string") {
        return isDataUrl(url) ? url : await fetchImageAsDataUrl(url);
      }
      if (typeof part?.text === "string") {
        const resolved = extractBase64FromText(part.text);
        if (resolved) return resolved;
      }
    }
  }

  return null;
};

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") return jsonError(405, "Method not allowed");

  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return jsonError(401, "Missing OpenRouter key");

  let body: { prompt?: string; inputImage?: string; inputImageMimeType?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON body");
  }

  if (!body?.prompt || !body?.inputImage || !body?.inputImageMimeType) {
    return jsonError(400, "Missing prompt or input image");
  }

  const dataUrl = `data:${body.inputImageMimeType};base64,${body.inputImage}`;
  const origin = request.headers.get("origin") || "";

  const response = await fetch(`${OPENROUTER_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
      "HTTP-Referer": origin,
      "X-Title": "Roomzup",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      temperature: 0.2,
      max_tokens: 500,
      modalities: ["image", "text"],
      messages: [
        {
          role: "system",
          content:
            "Return ONLY a single base64-encoded PNG image. Do not include any text or markdown.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: body.prompt },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return jsonError(response.status, errorText || "OpenRouter request failed");
  }

  const payload = await response.json();
  const renderedImage = await extractImageFromResponse(payload);

  if (!renderedImage) {
    return jsonError(502, "No image returned by OpenRouter model");
  }

  return Response.json({ renderedImage });
}

