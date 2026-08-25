export type ConversationStatus = "open" | "pending" | "closed";
export type MessageSenderType = "client" | "employee" | "ai" | "system";
export type MessageDirection = "inbound" | "outbound";
export type MessageType = "text" | "image" | "document" | "audio" | "video" | "sticker" | "location" | "contact";
export type MessageStatus = "received" | "queued" | "sent" | "delivered" | "read" | "failed";

export interface WhatsAppAccount {
  id: string;
  company_id: string;
  business_account_id: string | null;
  waba_id: string | null;
  phone_number_id: string;
  display_phone_number: string | null;
  status: "active" | "disconnected" | "error";
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  company_id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  company_id: string;
  client_id: string;
  whatsapp_account_id: string;
  assigned_user_id: string | null;
  status: ConversationStatus;
  subject: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface Message {
  id: string;
  company_id: string;
  conversation_id: string;
  sender_type: MessageSenderType;
  sender_user_id: string | null;
  direction: MessageDirection;
  message_type: MessageType;
  body: string | null;
  external_message_id: string | null;
  status: MessageStatus;
  raw_payload?: Record<string, unknown> | null;
  created_at: string;
}

export interface IncomingWhatsAppTextMessage {
  externalMessageId: string;
  phoneNumberId: string;
  from: string;
  profileName?: string;
  text: string;
  timestamp?: string;
  rawPayload: Record<string, unknown>;
}
