import CryptoJS from 'crypto-js';
import pako from 'pako';
import localforage from 'localforage';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { migrateToVersion } from '@/game/data/migrations';
import { LiveOpsManager } from '@/game/managers/LiveOpsManager';
import { mergeItems } from '@/game/data/items';
import { ENERGY_REFILL_MS, usePlayerStore } from '@/stores/playerStore';

const SAVE_PATH = 'cafe-merge-empire/save.enc';
const SAVE_META = 'cme:save:meta';
const SAVE_BACKUP = 'cme:save:backup';
const KEY_STORAGE = 'cme:save:key';
const SAVE_VERSION_NUMBER = 12;
const SAVE_VERSION = '12.0.0';
const OFFLINE_CAP_SECONDS = 8 * 60 * 60;

type Envelope = {
  version: string;
  versionNumber: number;
  timestamp: number;
  checksum: string;
  signature: string;
  cipherText: string;
  iv: string;
};

export interface OfflineReport {
  elapsedSeconds: number;
  effectiveSeconds: number;
  productionPerSecond: number;
  bonusMultiplier: number;
  producedCoins: number;
}

function bufToBase64(arr: Uint8Array): string {
  let s = '';
  for (let i = 0; i < arr.length; i += 1) s += String.fromCharCode(arr[i]);
  return btoa(s);
}

function base64ToBuf(value: string): Uint8Array {
  const bin = atob(value);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

export class SaveManager {
  private static instance: SaveManager;

  static getInstance(): SaveManager {
    if (!this.instance) this.instance = new SaveManager();
    return this.instance;
  }

  static async save(): Promise<void> { await this.getInstance().saveGame(); }
  static async load(): Promise<void> { await this.getInstance().loadGame(); }
  static async forceSaveWithStamp(): Promise<void> {
    usePlayerStore.getState().setLastOfflineTime(Date.now());
    await this.getInstance().saveGame();
  }

  private async getKey(): Promise<string> {
    const existing = await localforage.getItem<string>(KEY_STORAGE);
    if (existing) return existing;
    const key = CryptoJS.SHA256(`${Capacitor.getPlatform()}-${Date.now()}-${Math.random()}`).toString();
    await localforage.setItem(KEY_STORAGE, key);
    return key;
  }

  private serializePlainData(): Record<string, unknown> {
    const s = usePlayerStore.getState();
    return {
      ...s,
      _saveVersion: SAVE_VERSION,
      _saveVersionNumber: SAVE_VERSION_NUMBER
    };
  }

  async saveGame(): Promise<void> {
    const key = await this.getKey();
    const plain = JSON.stringify(this.serializePlainData());
    const checksum = CryptoJS.SHA256(plain).toString();
    const compressed = pako.gzip(plain);
    const payload = bufToBase64(compressed);

    const iv = CryptoJS.lib.WordArray.random(16).toString();
    const cipher = CryptoJS.AES.encrypt(payload, key + iv).toString();
    const timestamp = Date.now();
    const signature = CryptoJS.HmacSHA256(`${SAVE_VERSION}|${timestamp}|${checksum}|${cipher}`, key).toString();

    const envelope: Envelope = {
      version: SAVE_VERSION,
      versionNumber: SAVE_VERSION_NUMBER,
      timestamp,
      checksum,
      signature,
      cipherText: cipher,
      iv
    };

    await this.writeEnvelope(envelope);
    await localforage.setItem(SAVE_BACKUP, envelope);
  }

  async loadGame(): Promise<void> {
    const envelope = await this.readEnvelope();
    if (!envelope) return;

    const valid = await this.validateSave(envelope);
    if (!valid) {
      const repaired = await this.repairSave();
      if (!repaired) return;
      usePlayerStore.setState(repaired as never);
      return;
    }

    const data = await this.decryptEnvelope(envelope);
    const versionNumber = Number((data as Record<string, unknown>)._saveVersionNumber ?? 1);
    const migrated = versionNumber < SAVE_VERSION_NUMBER ? this.migrateSave(data, versionNumber) : data;
    usePlayerStore.setState(migrated as never);
  }

  async validateSave(envelope?: Envelope): Promise<boolean> {
    const env = envelope ?? (await this.readEnvelope());
    if (!env) return false;
    const key = await this.getKey();
    const expectedSig = CryptoJS.HmacSHA256(`${env.version}|${env.timestamp}|${env.checksum}|${env.cipherText}`, key).toString();
    if (expectedSig !== env.signature) return false;
    const data = await this.decryptEnvelope(env);
    const plain = JSON.stringify(data);
    const checksum = CryptoJS.SHA256(plain).toString();
    return checksum === env.checksum;
  }

  async repairSave(): Promise<Record<string, unknown> | null> {
    const backup = await localforage.getItem<Envelope>(SAVE_BACKUP);
    if (!backup) return null;
    if (!(await this.validateSave(backup))) return null;
    await this.writeEnvelope(backup);
    return this.decryptEnvelope(backup);
  }

  migrateSave(data: Record<string, unknown>, currentVersion: number): Record<string, unknown> {
    const migrated = migrateToVersion(data, currentVersion, SAVE_VERSION_NUMBER);
    return { ...migrated, _saveVersion: SAVE_VERSION, _saveVersionNumber: SAVE_VERSION_NUMBER };
  }

  private async decryptEnvelope(envelope: Envelope): Promise<Record<string, unknown>> {
    const key = await this.getKey();
    const bytes = CryptoJS.AES.decrypt(envelope.cipherText, key + envelope.iv);
    const payload = bytes.toString(CryptoJS.enc.Utf8);
    const decompressed = pako.ungzip(base64ToBuf(payload), { to: 'string' }) as string;
    return JSON.parse(decompressed) as Record<string, unknown>;
  }

  private async writeEnvelope(envelope: Envelope): Promise<void> {
    const raw = JSON.stringify(envelope);
    if (Capacitor.getPlatform() === 'android') {
      await Filesystem.writeFile({ path: SAVE_PATH, data: raw, directory: Directory.Documents, encoding: Encoding.UTF8 });
    } else {
      await localforage.setItem(SAVE_META, raw);
    }
  }

  private async readEnvelope(): Promise<Envelope | null> {
    try {
      if (Capacitor.getPlatform() === 'android') {
        const file = await Filesystem.readFile({ path: SAVE_PATH, directory: Directory.Documents, encoding: Encoding.UTF8 });
        return JSON.parse(file.data as string) as Envelope;
      }
      const raw = await localforage.getItem<string>(SAVE_META);
      return raw ? (JSON.parse(raw) as Envelope) : null;
    } catch {
      return null;
    }
  }

  static applyOfflineProgress(now = Date.now()): OfflineReport {
    const state = usePlayerStore.getState();
    const elapsedSeconds = Math.max(0, Math.floor((now - state.lastOfflineTime) / 1000));
    const mergedProduction = Object.entries(state.ownedItems).reduce((acc, [itemId, quantity]) => {
      const item = mergeItems.find((it) => it.id === itemId);
      if (!item) return acc;
      return acc + item.production * quantity;
    }, 0);
    const placedProduction = state.placedObjects.reduce((acc, obj) => {
      const item = mergeItems.find((it) => it.id === obj.itemId);
      return acc + (item?.production ?? 0);
    }, 0);

    const productionPerSecond = mergedProduction + placedProduction;
    const effectiveSeconds = Math.min(elapsedSeconds, OFFLINE_CAP_SECONDS);
    const streakBonus = Math.min(0.5, state.streak * 0.05);
    const liveOpsBonus = LiveOpsManager.getInstance().isMorningRushActive(now) ? 1 : 0;
    const happinessBonus = Math.min(0.5, state.happiness / 200);
    const bonusMultiplier = 1 + streakBonus + liveOpsBonus + happinessBonus;
    const producedCoins = Math.floor(productionPerSecond * effectiveSeconds * bonusMultiplier);

    let nextEnergyAt = state.nextEnergyAt || now + ENERGY_REFILL_MS;
    let energy = state.energy;
    while (energy < state.energyMax && nextEnergyAt <= now) {
      energy += 1;
      nextEnergyAt += ENERGY_REFILL_MS;
    }

    usePlayerStore.setState({
      coins: state.coins + producedCoins,
      energy,
      nextEnergyAt: energy >= state.energyMax ? now + ENERGY_REFILL_MS : nextEnergyAt,
      lastOfflineTime: now
    });

    return { elapsedSeconds, effectiveSeconds, productionPerSecond, bonusMultiplier, producedCoins };
  }
}
