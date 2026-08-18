// ============================================================
// Armazenamento e Gerenciamento de Assinaturas Web Push
// ============================================================

import fs from 'fs';
import path from 'path';

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface StoredSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: PushSubscriptionKeys;
  preferences: {
    alertAttention: boolean;
    alertAlert: boolean;
    alertEmergency: boolean;
    alertFastRise: boolean;
  };
  createdAt: string;
  lastNotified?: string;
}

// Armazenamento em memória (global singleton no runtime Node.js)
declare global {
  var __pushSubscriptions: Map<string, StoredSubscription> | undefined;
}

function getMemoryStore(): Map<string, StoredSubscription> {
  if (!globalThis.__pushSubscriptions) {
    globalThis.__pushSubscriptions = new Map<string, StoredSubscription>();
  }
  return globalThis.__pushSubscriptions;
}

// Arquivo local para persistência de desenvolvimento / servidor persistente
const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'push-subscriptions.json');

function loadFromFile(): void {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const items: StoredSubscription[] = JSON.parse(raw);
      const store = getMemoryStore();
      for (const item of items) {
        if (item.endpoint && item.keys) {
          store.set(item.endpoint, item);
        }
      }
    }
  } catch {
    // ignore
  }
}

function saveToFile(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const store = getMemoryStore();
    const items = Array.from(store.values());
    fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf-8');
  } catch {
    // Em ambientes serverless read-only, falha silenciosa para manter em memória
  }
}

// Inicializa a leitura do arquivo se existir
loadFromFile();

/**
 * Salva ou atualiza uma assinatura de Web Push.
 */
export async function saveSubscription(sub: {
  endpoint: string;
  keys: PushSubscriptionKeys;
  preferences?: {
    alertAttention?: boolean;
    alertAlert?: boolean;
    alertEmergency?: boolean;
    alertFastRise?: boolean;
  };
}): Promise<void> {
  const store = getMemoryStore();
  const existing = store.get(sub.endpoint);

  const storedItem: StoredSubscription = {
    endpoint: sub.endpoint,
    keys: sub.keys,
    preferences: {
      alertAttention: sub.preferences?.alertAttention ?? existing?.preferences.alertAttention ?? true,
      alertAlert: sub.preferences?.alertAlert ?? existing?.preferences.alertAlert ?? true,
      alertEmergency: sub.preferences?.alertEmergency ?? existing?.preferences.alertEmergency ?? true,
      alertFastRise: sub.preferences?.alertFastRise ?? existing?.preferences.alertFastRise ?? true,
    },
    createdAt: existing?.createdAt || new Date().toISOString(),
  };

  store.set(sub.endpoint, storedItem);
  saveToFile();
}

/**
 * Remove uma assinatura inválida ou desinscrita.
 */
export async function removeSubscription(endpoint: string): Promise<boolean> {
  const store = getMemoryStore();
  const deleted = store.delete(endpoint);
  if (deleted) {
    saveToFile();
  }
  return deleted;
}

/**
 * Retorna todas as assinaturas ativas.
 */
export async function getAllSubscriptions(): Promise<StoredSubscription[]> {
  const store = getMemoryStore();
  return Array.from(store.values());
}
