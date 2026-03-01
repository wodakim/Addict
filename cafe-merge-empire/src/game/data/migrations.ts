export type SaveShape = Record<string, unknown>;
export type MigrationStep = {
  from: number;
  to: number;
  run: (input: SaveShape) => SaveShape;
};

const ensureObject = (v: unknown): Record<string, unknown> => (typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {});

export const migrations: MigrationStep[] = [
  { from: 1, to: 2, run: (s) => ({ ...s, eventRewards: ensureObject(s.eventRewards) }) },
  { from: 2, to: 3, run: (s) => ({ ...s, placeableItems: ensureObject(s.placeableItems), placedObjects: Array.isArray(s.placedObjects) ? s.placedObjects : [] }) },
  { from: 3, to: 4, run: (s) => ({ ...s, purchases: Array.isArray(s.purchases) ? s.purchases : [], analytics: ensureObject(s.analytics) }) },
  { from: 4, to: 5, run: (s) => ({ ...s, ftueCompleted: Boolean(s.ftueCompleted), ftueStep: Number(s.ftueStep ?? 0), quests: Array.isArray(s.quests) ? s.quests : [] }) },
  { from: 5, to: 6, run: (s) => ({ ...s, audioSettings: ensureObject(s.audioSettings), hapticsEnabled: s.hapticsEnabled !== false }) },
  { from: 6, to: 7, run: (s) => ({ ...s, welcomeWeekClaimed: Array.isArray(s.welcomeWeekClaimed) ? s.welcomeWeekClaimed : [] }) },
  { from: 7, to: 8, run: (s) => ({ ...s, _migratedToV8At: Date.now() }) },
  { from: 8, to: 9, run: (s) => ({ ...s, saveSchemaVersion: 9, liveOpsState: ensureObject((s as any).liveOpsState), notificationState: ensureObject((s as any).notificationState), streakShieldCount: Number((s as any).streakShieldCount ?? 1) }) },
  { from: 9, to: 10, run: (s) => ({ ...s, saveSchemaVersion: 10, friends: Array.isArray((s as any).friends) ? (s as any).friends : [], clan: (s as any).clan ?? null, social: ensureObject((s as any).social) }) },
  { from: 10, to: 11, run: (s) => ({ ...s, saveSchemaVersion: 11, contextualOffers: ensureObject((s as any).contextualOffers) }) },
  { from: 11, to: 12, run: (s) => ({ ...s, saveSchemaVersion: 12, analyticsEvents: Array.isArray((s as any).analyticsEvents) ? (s as any).analyticsEvents : [], featureFlags: ensureObject((s as any).featureFlags) }) }
];

export function migrateToVersion(input: SaveShape, fromVersion: number, targetVersion: number): SaveShape {
  let out = { ...input };
  let current = fromVersion;
  while (current < targetVersion) {
    const step = migrations.find((m) => m.from === current && m.to === current + 1);
    if (!step) break;
    out = step.run(out);
    current += 1;
  }
  return out;
}
