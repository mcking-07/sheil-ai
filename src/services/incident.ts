import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

class IncidentManager {
  private incidents_directory = path.join(path.resolve('./incidents'));
  constructor() {
    this.ensure_directory();
    this.initialize();
  }

  private ensure_directory() {
    const directory_exists = fs.existsSync(this.incidents_directory);
    if (!directory_exists) fs.mkdirSync(this.incidents_directory, { recursive: true });
  }

  private log(type: string, error: Error | unknown) {
    const timestamp = new Date().toISOString();

    const filename = `${timestamp.split('T')[0]}.log`;
    const filepath = path.join(this.incidents_directory, filename);

    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack || '' : '';

    const incident = { message, stack, timestamp, type };

    fs.appendFileSync(filepath, `[${timestamp}] ${JSON.stringify(incident)}\n`);
  }

  private initialize() {
    process.on('uncaughtException', (error: Error) => this.log('uncaught-exception', error));
    process.on('unhandledRejection', (reason: unknown) => this.log('unhandled-rejection', reason));
  }
}

export { IncidentManager };
