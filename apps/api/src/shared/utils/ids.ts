import { randomUUID } from "node:crypto";

export function novoId(): string {
  return randomUUID();
}

export function agoraIso(): string {
  return new Date().toISOString();
}
