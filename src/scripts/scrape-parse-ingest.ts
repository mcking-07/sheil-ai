import process from 'node:process';
import { Output } from 'ai';
import { type CheerioAPI, load } from 'cheerio';
import fetch from 'node-fetch';
import { z } from 'zod';
import type { Element } from 'domhandler';
import { config } from '../config';
import { services } from '../modules';
import { is_main } from '../utils';
import type { AIService, VectorStore } from '../services';
import type { KnowledgeBaseArticle, KnowledgeBaseCategory, MetadataType } from '../types';

const sanitize_for_tags = (text: string) => text.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().replace(/\s+/g, '-');

const fetch_page = async (url: string) => {
  const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36', 'cache-control': 'no-cache' }, redirect: 'follow' });

  if (!response.ok) {
    throw new Error(`failed to fetch [${url}]: [${response.status}]`);
  }

  return await response.text() as string;
};

const fetch_article_content = async (url: string) => {
  console.log(`[~] fetching article content from [${url}]`);
  const page_data = await fetch_page(url);
  const $ = load(page_data);

  return $('#eckb-article-content-body').text().trim().replace(/\s+/g, ' ');
};

const scrape_articles = async ($: CheerioAPI, category_section: Element) => {
  const articles = await Promise.all(
    $(category_section).find('ul.epkb-articles > li').map(async (_index, section) => {
      const id = $(section).attr('data-kb-article-id') || '';
      const title = $(section).find('.eckb-article-title__text').text().trim();

      const url = $(section).find('a.epkb-mp-article').attr('href') as string;
      const content = await fetch_article_content(url);

      return { title, id, url, content } as KnowledgeBaseArticle;
    }).get(),
  );

  return articles;
};

const scrape_categories = async (url: string) => {
  const page_data = await fetch_page(url);
  const $ = load(page_data);

  const categories = await Promise.all(
    $('section.epkb-top-category-box').map(async (_index, section) => {
      const category = $(section).find('h2.epkb-cat-name').text().trim();
      const id = $(section).find('.epkb-category-level-1').attr('data-kb-category-id') || '';

      const articles = await scrape_articles($, section);
      console.log(`[+] fetched [${articles?.length}] articles from category [${category.toLowerCase()}]`);

      return { category, id, articles } as KnowledgeBaseCategory;
    }).get(),
  );

  return categories;
};

const generate_metadata = (article: KnowledgeBaseArticle) => ({
  source: 'website', url: article?.url, language: 'en', tags: [sanitize_for_tags(article?.title)],
}) as MetadataType;

const generate_content_pairs_schema = z.array(z.object({
  question: z.string().describe('a clear, self-contained question generated from the article content'),
  answer: z.string().describe('a concise, factual answer derived solely from the article content'),
}).describe('a single question and answer pair')).min(10).describe('an array of question and answer pairs');

const generate_content_pairs_output_schema = Output.object({ schema: generate_content_pairs_schema });

const generate_content_pairs = async (article: KnowledgeBaseArticle) => {
  const ai_service = services.find<AIService>(`ai:${config?.scripts?.ingest?.model}`);

  const { output: pairs } = await ai_service.generate_object({
    messages: [{ role: 'user', parts: [{ type: 'text', text: `generate question-answer pairs for the following article [${article?.title}]: ${article?.content}` }] }],
    system: config?.prompts?.generate_content_pairs, options: { reasoning: false }, params: { temperature: 0.3 }, output: generate_content_pairs_output_schema,
  });

  return pairs as z.infer<typeof generate_content_pairs_schema>;
};

const ingest = async (article: KnowledgeBaseArticle) => {
  const pairs = await generate_content_pairs(article);
  const metadata = generate_metadata(article);

  const vector_store = services.find<VectorStore>('vector-store');
  console.log(`[+] generated [${pairs.length}] pairs for article [${sanitize_for_tags(article?.title)}]`);

  for await (const { question, answer } of pairs) {
    const content = `${question}\n${answer}`;

    const { success, message } = await vector_store.ingest({ content, metadata });
    if (!success) console.log(`[-] failed to ingest part question: [${question}] and answer: [${answer}] with message: [${message}]`);
  }
};

const scrape_and_ingest = async (start_url: string) => {
  const categories = await scrape_categories(start_url);
  console.log(`\n[+] fetched [${categories.length}] categories from [${start_url}]`);

  const articles = categories.flatMap(({ articles }) => articles).filter(({ content }) => content?.trim()?.length);
  console.log(`[+] parsed [${articles.length}] articles within [${categories.length}] categories from [${start_url}]`);

  for await (const article of articles) {
    await ingest(article);
  }

  console.log(`\n[+] ingestion completed for [${articles.length}] articles within [${categories.length}] categories from [${start_url}]`);
};

if (is_main(import.meta.url)) {
  const knowledge_base_url = config?.scripts?.ingest?.remote;

  if (!knowledge_base_url) {
    console.log(`\n[!] no knowledge base url specified`);
    process.exit(1);
  }

  await scrape_and_ingest(knowledge_base_url).catch(console.error);
  process.exit(0);
}

export { scrape_and_ingest };
