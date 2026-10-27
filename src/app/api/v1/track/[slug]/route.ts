import { NextRequest } from "next/server";
import { handleTrackingRequest } from "@/lib/tracking-handler";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  return handleTrackingRequest(req, slug);
}
