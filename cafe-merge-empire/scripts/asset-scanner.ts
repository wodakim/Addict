import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const assetsDir = path.join(root, 'assets');
const dataDir = path.join(root, 'src', 'game', 'data');
const atlasDir = path.join(assetsDir, 'atlases');

type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
type Category = 'ingredient' | 'recipe' | 'furniture' | 'decoration' | 'special';

interface MergeItemDefinition {
  id: string;
  name: string;
  level: number;
  mergeTargetId: string | null;
  imageKey: string;
  rarity: Rarity;
  production: number;
  sellPrice: number;
  unlockLevel: number;
  category: Category;
  tags: string[];
  description: string;
  placementCost: number;
}

const rarityOrder: Rarity[] = ['common', 'rare', 'epic', 'legendary'];
const categoryOrder: Category[] = ['ingredient', 'recipe', 'furniture', 'decoration', 'special'];

function createChecksum(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return hash.toString(16);
}

function toId(name: string): string {
  return name.toLowerCase().replace(/\.png$/i, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function readJsonIfExists(filePath: string): Record<string, unknown> {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<string, unknown>;
}

function readPngFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((file) => file.toLowerCase().endsWith('.png')).sort();
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function resolveRarity(value: unknown): Rarity {
  if (typeof value === 'string' && (rarityOrder as string[]).includes(value)) return value as Rarity;
  return 'common';
}

function resolveCategory(value: unknown): Category {
  if (typeof value === 'string' && (categoryOrder as string[]).includes(value)) return value as Category;
  return 'ingredient';
}

function scanItems(): MergeItemDefinition[] {
  const itemsDir = path.join(assetsDir, 'images', 'merge-items');
  const pngFiles = readPngFiles(itemsDir);

  const items = pngFiles.map((pngFile, index) => {
    const id = toId(pngFile);
    const meta = readJsonIfExists(path.join(itemsDir, `${id}.json`));
    const levelGuess = /(?:-|_)lv(\d+)$/i.exec(id)?.[1];

    const item: MergeItemDefinition = {
      id,
      name: (meta.name as string) ?? id,
      level: Number(meta.level ?? Number(levelGuess ?? index + 1)),
      mergeTargetId: (meta.mergeTargetId as string | null | undefined) ?? null,
      imageKey: `merge-items/${id}`,
      rarity: resolveRarity(meta.rarity),
      production: Number(meta.production ?? 1),
      sellPrice: Number(meta.sellPrice ?? 1),
      unlockLevel: Number(meta.unlockLevel ?? 1),
      category: resolveCategory(meta.category),
      tags: Array.isArray(meta.tags) ? meta.tags.map(String) : [],
      description: (meta.description as string) ?? '',
      placementCost: Number(meta.placementCost ?? (resolveRarity(meta.rarity) === 'legendary' ? 120 : resolveRarity(meta.rarity) === 'epic' ? 60 : resolveRarity(meta.rarity) === 'rare' ? 25 : 10))
    };

    return item;
  });

  validateMergeChains(items);
  writeItemsData(items);
  writeAtlas('merge-items', items.map((item) => item.id));

  return items;
}

function validateMergeChains(items: MergeItemDefinition[]): void {
  const ids = new Set(items.map((item) => item.id));

  for (const item of items) {
    if (item.mergeTargetId && !ids.has(item.mergeTargetId)) {
      throw new Error(`Invalid merge chain: ${item.id} -> ${item.mergeTargetId} (target missing)`);
    }

    if (item.mergeTargetId === item.id) {
      throw new Error(`Invalid merge chain: ${item.id} points to itself`);
    }
  }
}

function writeItemsData(items: MergeItemDefinition[]): void {
  ensureDir(dataDir);
  const target = path.join(dataDir, 'items.ts');

  const content = `/* AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY. */\n` +
`export interface MergeItemDefinition {\n` +
`  id: string;\n` +
`  name: string;\n` +
`  level: number;\n` +
`  mergeTargetId: string | null;\n` +
`  imageKey: string;\n` +
`  rarity: 'common' | 'rare' | 'epic' | 'legendary';\n` +
`  production: number;\n` +
`  sellPrice: number;\n` +
`  unlockLevel: number;\n` +
`  category: 'ingredient' | 'recipe' | 'furniture' | 'decoration' | 'special';\n` +
`  tags: string[];\n` +
`  description: string;\n` +
`  placementCost: number;\n` +
`}\n\n` +
`export const mergeItems: MergeItemDefinition[] = ${JSON.stringify(items, null, 2)};\n`;

  fs.writeFileSync(target, content, 'utf-8');
}

function scanJsonCollection(subDir: 'levels' | 'events'): { id: string; file: string; checksum: string; data: Record<string, unknown> }[] {
  const fullDir = path.join(assetsDir, subDir);
  ensureDir(fullDir);
  const files = fs.readdirSync(fullDir).filter((file) => file.endsWith('.json')).sort();
  const entries = files.map((file) => {
    const raw = fs.readFileSync(path.join(fullDir, file), 'utf-8');
    const content = JSON.parse(raw) as { id?: string } & Record<string, unknown>;
    return { id: content.id ?? toId(file), file, checksum: createChecksum(raw), data: content };
  });

  const outFile = path.join(dataDir, `${subDir}.ts`);
  ensureDir(dataDir);
  const constName = subDir === 'levels' ? 'levelDefinitions' : 'eventDefinitions';
  fs.writeFileSync(
    outFile,
    `/* AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY. */\n` +
      `export const ${constName} = ${JSON.stringify(entries, null, 2)};\n`,
    'utf-8'
  );

  writeAtlas(subDir, entries.map((entry) => entry.id));

  return entries;
}


function scanQuests(): { id: string; type: string; title: string; target: number; metric: string; rewards: Record<string, number> }[] {
  const questDir = path.join(assetsDir, 'quests');
  ensureDir(questDir);
  const files = fs.readdirSync(questDir).filter((f) => f.endsWith('.json')).sort();
  const quests: { id: string; type: string; title: string; target: number; metric: string; rewards: Record<string, number> }[] = [];
  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(questDir, file), 'utf-8'));
    if (Array.isArray(raw)) {
      for (const q of raw) quests.push({ id: String(q.id), type: String(q.type), title: String(q.title), target: Number(q.target), metric: String(q.metric), rewards: (q.rewards ?? {}) as Record<string, number> });
    }
  }
  ensureDir(dataDir);
  fs.writeFileSync(path.join(dataDir, 'quests.ts'), `/* AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY. */\nexport const questDefinitions = ${JSON.stringify(quests, null, 2)};\n`, 'utf-8');
  writeAtlas('quests', quests.map((q) => q.id));
  return quests;
}
function writeAtlas(name: string, frameIds: string[]): void {
  ensureDir(atlasDir);
  const atlas = {
    meta: {
      generatedAt: new Date().toISOString(),
      name,
      frameCount: frameIds.length
    },
    frames: frameIds.reduce<Record<string, { frame: { x: number; y: number; w: number; h: number } }>>((acc, id, idx) => {
      acc[id] = { frame: { x: idx * 1, y: 0, w: 1, h: 1 } };
      return acc;
    }, {})
  };

  fs.writeFileSync(path.join(atlasDir, `${name}.atlas.json`), JSON.stringify(atlas, null, 2), 'utf-8');
}

function printSummary(summary: {
  items?: number;
  levels?: number;
  events?: number;
}): void {
  console.log('\n🌸 CafeMergeEmpire Asset Scan Summary');
  console.log('------------------------------------');
  if (typeof summary.items === 'number') console.log(`🧩 Items scanned : ${summary.items}`);
  if (typeof summary.levels === 'number') console.log(`🗺️ Levels scanned: ${summary.levels}`);
  if (typeof summary.events === 'number') console.log(`🎉 Events scanned: ${summary.events}`);
  if (typeof summary.quests === 'number') console.log(`📜 Quests scanned: ${summary.quests}`);
  console.log(`📦 Generated data: ${path.relative(root, dataDir)}`);
  console.log(`🧵 Generated atlas: ${path.relative(root, atlasDir)}`);
  console.log('✅ Scan completed successfully\n');
}

function run(): void {
  const mode = process.argv[2] ?? 'all';

  if (!['items', 'levels', 'events', 'quests', 'all'].includes(mode)) {
    throw new Error(`Unknown scan mode "${mode}". Use items|levels|events|quests|all.`);
  }

  const summary: { items?: number; levels?: number; events?: number; quests?: number } = {};

  if (mode === 'items' || mode === 'all') summary.items = scanItems().length;
  if (mode === 'levels' || mode === 'all') summary.levels = scanJsonCollection('levels').length;
  if (mode === 'events' || mode === 'all') summary.events = scanJsonCollection('events').length;
  if (mode === 'quests' || mode === 'all') summary.quests = scanQuests().length;

  printSummary(summary);
}

run();
