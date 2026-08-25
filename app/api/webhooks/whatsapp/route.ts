import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { processIncomingWhatsAppText } from "@/services/whatsapp.service";

function verifyMetaSignature(rawBody: string, signature: string | null) {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !signature?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const received = signature.slice("sha256=".length);
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");

  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token && verifyToken && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyMetaSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    const entries = Array.isArray(payload.entry) ? payload.entry : [];

    for (const entry of entries) {
      const changes = Array.isArray((entry as Record<string, unknown>).changes)
        ? (entry as Record<string, unknown>).changes
        : [];

      for (const change of changes) {
        const value = (change as Record<string, unknown>).value as Record<string, unknown> | undefined;
        if (!value) continue;

        const metadata = value.metadata as Record<string, unknown> | undefined;
        const phoneNumberId = typeof metadata?.phone_number_id === "string" ? metadata.phone_number_id : null;
        const messages = Array.isArray(value.messages) ? value.messages : [];
        if (!phoneNumberId) continue;

        for (const item of messages) {
          const message = item as Record<string, unknown>;
          const text = message.text as Record<string, unknown> | undefined;
          if (message.type !== "text" || typeof text?.body !== "string" || typeof message.id !== "string" || typeof message.from !== "string") continue;

          const contacts = Array.isArray(value.contacts) ? value.contacts : [];
          const contact = contacts[0] as Record<string, unknown> | undefined;
          const profile = contact?.profile as Record<string, unknown> | undefined;

          await processIncomingWhatsAppText({
            externalMessageId: message.id,
            phoneNumberId,
            from: message.from,
            profileName: typeof profile?.name === "string" ? profile.name : undefined,
            text: text.body,
            timestamp: typeof message.timestamp === "string" ? message.timestamp : undefined,
            rawPayload: message,
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("WhatsApp webhook processing failed", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
