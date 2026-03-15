import { getEngine } from "@simpill/image-ai-core";
import { NextResponse } from "next/server";
import {
  buildServerGeneratePlan,
  encodeImagesBase64,
  generateApiRequestSchema,
  type GenerateApiResponse,
} from "../../../lib/generate-server";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = generateApiRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const plan = buildServerGeneratePlan(parsed.data, process.env);
    const engine = getEngine({ engineId: plan.engineId, apiKey: plan.apiKey });
    const response = await engine.generate(plan.request);

    const body: GenerateApiResponse = {
      engineId: response.engineId,
      modelUsed: response.modelUsed,
      outputFormat: plan.request.outputFormat,
      imagesBase64: encodeImagesBase64(response.images),
    };

    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

