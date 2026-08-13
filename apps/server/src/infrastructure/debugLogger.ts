import fs from 'fs';
import path from 'path';

export const logDebug = (msg: string) => {
  try {
    const logPath = path.resolve(process.cwd(), 'hostinger-debug.log');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
    console.error(`[DEBUG] ${msg}`); // Also output to stderr
  } catch (err) {
    // Ignore
  }
};
