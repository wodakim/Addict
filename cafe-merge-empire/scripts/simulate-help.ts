import fs from 'node:fs';
const storePath = 'assets/events/event-welcome.json';
console.log('simulate-help: ok');
console.log('friends-dev:', ['Sophie', 'Lucien', 'Mia']);
console.log('using-file:', fs.existsSync(storePath));
