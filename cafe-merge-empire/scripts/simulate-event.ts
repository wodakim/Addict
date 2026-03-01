import fs from 'node:fs';
import path from 'node:path';

const rawId = process.argv[2] ?? 'rush-matin';
const id = rawId === 'rush-matin' ? 'morning-rush' : rawId;
const dir = path.resolve('assets/events');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
const events = files.map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) as { id: string; name?: string });
const target = events.find((e) => e.id === id);
console.log('simulate-event:', id);
console.log('events-loaded:', events.map((e) => e.id));
console.log('target-found:', Boolean(target));
console.log('target:', target ?? null);
