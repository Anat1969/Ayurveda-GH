// מעתיק את נחיית היועץ מהמסמך לקוד, כדי שהמסמך יישאר המקור היחיד.
import fs from 'node:fs';

const md = fs.readFileSync('docs/consultant-system-prompt.md', 'utf8');
const body = md.split(/\n---\n/)[1].trim();
fs.writeFileSync(
  'src/lib/consultantPrompt.js',
  `// נוצר מתוך docs/consultant-system-prompt.md. בדיקת יחידה מוודאת שהם זהים.\n// לעדכון: לשנות את המסמך ולהריץ npm run sync-prompt.\nexport const CONSULTANT_PROMPT = ${JSON.stringify(body)};\n`,
);
