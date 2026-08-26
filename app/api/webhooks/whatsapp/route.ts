import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { processIncomingWhatsAppText } from "@/services/whatsapp.service";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRecordArray(value: unknown): value is UnknownRecord[] {
  return Array.isArray(value) && value.every(isRecord);
}

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
    const parsedPayload: unknown = JSON.parse(rawBody);
    if (!isRecord(parsedPayload)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const entries = isRecordArray(parsedPayload.entry) ? parsedPayload.entry : [];

    for (const entry of entries) {
      const changes = isRecordArray(entry.changes) ? entry.changes : [];

      for (const change of changes) {
        const value = isRecord(change.value) ? change.value : null;
        if (!value) continue;

        const metadata = isRecord(value.metadata) ? value.metadata : null;
        const phoneNumberId = typeof metadata?.phone_number_id === "string" ? metadata.phone_number_id : null;
        const messages = isRecordArray(value.messages) ? value.messages : [];
        if (!phoneNumberId) continue;

        const contacts = isRecordArray(value.contacts) ? value.contacts : [];
        const contact = contacts[0];
        const profile = contact && isRecord(contact.profile) ? contact.profile : null;
        const profileName = typeof profile?.name === "string" ? profile.name : undefined;

        for (const message of messages) {
          if (message.type !== "text" || typeof message.id !== "string" || typeof message.from !== "string") {
            continue;
          }

          const text = isRecord(message.text) ? message.text : null;
          if (typeof text?.body !== "string") continue;

          await processIncomingWhatsAppText({
            externalMessageId: message.id,
            phoneNumberId,
            from: message.from,
            profileName,
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
