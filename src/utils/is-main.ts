import process from 'node:process';
import { fileURLToPath } from 'node:url';

const is_main = (url: string) => process.argv[1] === fileURLToPath(url);

export { is_main };
