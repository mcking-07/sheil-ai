import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import readline, { type Interface } from 'node:readline';
import chalk from 'chalk';
import { config } from '../config';
import { tools } from '../tools';
import type { AIService } from '../services';
import type { AIMessage, AIResponseStreamPartType, ModelGenerationOptionsType, ProviderOptionsType } from '../types';
import { services } from './registry';

const categorize = (options: ProviderOptionsType & ModelGenerationOptionsType) => {
  const provider_options: ProviderOptionsType = {};
  const generation_options: ModelGenerationOptionsType = {};

  const provider_options_keys = ['reasoning', 'reasoningEffort', 'thinkingBudget', 'disableParallelToolUse', 'embedding', 'dimensions'];
  const generation_options_keys = ['maxTokens', 'temperature', 'topP', 'topK', 'frequencyPenalty', 'presencePenalty', 'seed'];

  Object.entries(options).forEach(([key, value]) => {
    if (provider_options_keys.includes(key)) provider_options[key as keyof ProviderOptionsType] = value;
    if (generation_options_keys.includes(key)) generation_options[key as keyof ModelGenerationOptionsType] = value;
  });

  return { provider_options, generation_options };
};

class ChatService {
  private ai_service: AIService;
  private messages: AIMessage[] = [];
  private id: string = '';
  private file: string = '';
  private sessions_directory = path.join(path.resolve('./sessions'));
  private provider_options: ProviderOptionsType = {};
  private generation_options: ModelGenerationOptionsType = {};
  private rl: Interface;
  constructor(ai_service: AIService, id?: string, options?: ProviderOptionsType & ModelGenerationOptionsType) {
    if (id) this.load_session(id);

    const { provider_options, generation_options } = categorize(options || {});
    this.provider_options = provider_options;
    this.generation_options = generation_options;

    this.ai_service = ai_service;
    this.rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  }

  private load_session(id: string) {
    const file = path.join(this.sessions_directory, `${id}.json`);
    if (!fs.existsSync(file)) return;

    const { messages = [] } = JSON.parse(fs.readFileSync(file, 'utf8') || '{}');
    this.messages = messages;

    this.id = id;
    this.file = file;
  }

  private show_welcome() {
    const screen_width = process?.stdout?.columns || 80;
    const styled_separator = chalk.bold.blue('━'.repeat(screen_width));

    // ? aur-ai or sheil-ai? or ai assistant console?
    const title = '🤖 Welcome to AI Assistant Console';
    const sub_title = `[*] ask me anything, i'll reason, search and assist.`;

    const author = `muzammil_07`;
    const sub_title_white_spaces = Math.max(0, screen_width - sub_title.length - author.length);

    const styled_title = chalk.bold.blue(title.padStart(Math.floor(screen_width / 2) + Math.floor(title.length / 2)));
    const styled_sub_title = chalk.cyan(sub_title + ' '.repeat(sub_title_white_spaces) + chalk.yellow(author));
    const styled_exit_help = chalk.cyan(`[*] type ${chalk.yellow('/bye')} to exit.`);

    console.log(`${styled_separator}\n${styled_title}\n${styled_separator}`);
    console.log(`${styled_sub_title}\n${styled_exit_help}`);
  }

  private async generate_title(message: string) {
    const ai_service = services.find<AIService>('ai:flash');

    const response = await ai_service.generate_text({
      system: config.prompts.generate_title,
      messages: [{ role: 'user', parts: [{ type: 'text', text: message }] }],
      options: { reasoning: false },
      params: { maxTokens: 25, temperature: 0.5 },
    });

    const title = response?.text?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50) || `untitled-chat-${Date.now()}`;
    const title_exists = fs.existsSync(path.join(this.sessions_directory, `${title}.json`));

    return title_exists ? `${title}-${Date.now()}` : title;
  }

  private save_session() {
    if (!this.file) this.file = path.join(this.sessions_directory, `${this.id}.json`);
    fs.writeFileSync(this.file, JSON.stringify({ id: this.id, messages: this.messages }, null, 2));
  }

  private handle_stream_for(part: AIResponseStreamPartType) {
    let assistance: string = '';

    switch (part?.type) {
      case 'reasoning-start':
        process.stdout.write(chalk.gray('\n[+] reasoning\n'));
        break;
      case 'reasoning-delta':
        const normalized = part?.text?.replace(/\n{2,}/g, '\n');
        process.stdout.write(chalk.gray(normalized));
        break;
      case 'reasoning-end':
        break;
      case 'tool-input-start':
        process.stdout.write(chalk.magenta(`\n[+] invoking tool [${part?.toolName}]`));
        break;
      case 'tool-input-delta':
        process.stdout.write(chalk.magenta(` with args [${part?.delta}]\n`));
        break;
      case 'tool-input-end':
        break;
      case 'text-start':
        process.stdout.write(chalk.cyan('\nAI: '));
        break;
      case 'text-delta':
        process.stdout.write(chalk.green(part?.text));
        assistance += part?.text || '';
        break;
      case 'text-end':
        process.stdout.write(chalk.green('\n'));
        break;
      case 'error':
        process.stdout.write(chalk.red('\n[!] an error occurred: ', part?.error));
        break;
    }

    return assistance;
  }

  private async process_input(input: string) {
    const is_exit_requested = ['/bye', '/exit', 'exit', '/quit', '.exit', '.quit'].includes(input.trim().toLowerCase());
    if (is_exit_requested) return this.stop();

    this.id = this.id.trim() || await this.generate_title(input);
    this.messages.push({ role: 'user', parts: [{ type: 'text', text: input }] });

    const response = await this.ai_service.stream_text({
      system: config?.prompts?.system,
      messages: this.messages,
      options: { ...this.provider_options },
      params: { ...this.generation_options },
      tools,
    });

    let assistance: string = '';
    for await (const part of response.fullStream) {
      assistance += this.handle_stream_for(part);
    }

    this.messages.push({ role: 'assistant', parts: [{ type: 'text', text: assistance }] });
    this.save_session();

    return this.prompt();
  }

  private async prompt() {
    this.rl.question(chalk.cyan('\n> '), async input => this.process_input(input));
  }

  async start() {
    console.clear();
    this.show_welcome();
    return this.prompt();
  }

  private stop() {
    console.log(chalk.yellow('\n[*] goodbye\n'));
    process.exit(0);
  }
}

export { ChatService };
