import process from 'node:process';
import chalk from 'chalk';
import { Command } from 'commander';
import { config } from '../config';
import type { AIService, VectorStore } from '../services';
import type { AnyType, CommandOptionType, ModelGenerationOptionsType, ProviderOptionsType, SearchableType } from '../types';
import { ChatService } from './chat';
import { services } from './registry';

const { application: { name, description, version, commands } } = config;

const program = new Command();

program.name(name).description(description).version(version);

const append_options = (command: Command, option: CommandOptionType) => {
  const args: AnyType[] = [];

  const has_action = !!option?.action;
  if (has_action) args.push(option.action);

  const has_default = !!option?.default;
  if (has_default) args.push(option.default);

  command.option(option.flags, option.description, ...args);
};

const init_chat_command = () => {
  const { chat: { name, description, options } } = commands;

  const command = program.command(name, { isDefault: true }).description(description);
  options.forEach((option: CommandOptionType) => append_options(command, option));

  command.action(async ({ model = 'gemini-2.5-flash', session, ...options }: { model: string; session?: string } & ProviderOptionsType & ModelGenerationOptionsType) => {
    const ai_service = services.find<AIService>(`ai:${model}`);

    const chat_service = new ChatService(ai_service, session, options);
    await chat_service.start();
  });
};

const init_search_command = () => {
  const { search: { name, description, options } } = commands;

  const command = program.command(name).description(description);
  options.forEach((option: CommandOptionType) => append_options(command, option));

  command.action(async ({ query, count, threshold }: SearchableType) => {
    const vector_store = services.find<VectorStore>('vector-store');

    const response = await vector_store.search({ query, count, threshold });
    if (!Array.isArray(response) || !response?.length) console.log(chalk.yellow('[*] no results found for query'), query);

    if (Array.isArray(response)) {
      console.log(chalk.green(`[*] found [${response?.length}] results for query "${chalk.yellow(query)}"\n`));
      response.forEach(({ content, source }, index) => {
        console.log(chalk.blue(`[${index + 1}] ${content}\n${chalk.magenta(`[${source}]`)}`));
      });
    }

    process.exit(0);
  });
};

const init_list_models_command = () => {
  const { models: { name, description, options } } = commands;

  const command = program.command(name).description(description);
  options.forEach((option: CommandOptionType) => append_options(command, option));

  command.action(async ({ type }) => {
    const all_services = services.list();

    const language_models = all_services.filter(service => service.startsWith('ai:'));
    const embedding_models = all_services.filter(service => service.startsWith('embedding:'));

    const is_language_type = type === 'language';
    const is_embedding_type = type === 'embedding';

    const filtered_models = is_language_type ? language_models : is_embedding_type ? embedding_models : [];
    console.log(chalk.green(`\n[*] found [${filtered_models?.length}] ${type} models:\n`));

    filtered_models.forEach((model, index) => {
      console.log(chalk.blue(`[${index + 1}] ${model.split(':')[1]}`));
    });

    console.log('');
    process.exit(0);
  });
};

init_chat_command();
init_search_command();
init_list_models_command();

program.parse();
