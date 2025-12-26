import { tool } from 'ai';
import { type CheerioAPI, load } from 'cheerio';
import { OrganicResult, type OrganicResultNode, search } from 'google-sr';
import fetch from 'node-fetch';
import { z } from 'zod';
import type { Element } from 'domhandler';

// ? deprecation notice: `google-sr` was permanently deprecated on december 20, 2025.
// ? see https://github.com/typicalninja/google-sr/issues/103.

const is_content_valid = (content: string) => content.length > 20 && !/^[\s\d\W]+$/.test(content) && !/cookie|privacy|terms|advertisement|subscribe|login|sign[- ]?up|read more/i.test(content);

const is_search_result_valid = ({ title, type, link, isAd }: Partial<OrganicResultNode>) => type === 'ORGANIC' && !isAd && link !== null && !!title;

const safe_text = ($: CheerioAPI, element: Element) => $(element).contents().filter((_, node) => node.type === 'text').map((_, node) => (node.data || '').trim()).get().join(' ');

const extract_content_from = (html: string) => {
  const $ = load(html);

  $('script, style, nav, footer, header, noscript, iframe, svg, form, button, input, aside, [aria-hidden=\'true\'], .ad, .advertisement, [class*=\'cookie\'], [class*=\'popup\'], [class*=\'nav\'], [class*=\'menu\'], [class*=\'sidebar\']').remove();

  const container = $('article, main, [role=\'main\'], section, div[class*=\'content\'], div[class*=\'article\'], div[class*=\'post\'], div[class*=\'body\'], body').first();
  if (!container?.length) return '';

  const text_elements = container.find('p, h1, h2, h3, h4, h5, h6, li, blockquote, figcaption, td, th, dt, dd');

  const content = text_elements.map((_index, element) => safe_text($, element)).get().filter(is_content_valid);
  if (!content?.length) return '';

  return content.join(' ').replace(/\s+/g, ' ').trim();
};

const search_and_scrape = async (query: string, count: number) => {
  const search_results = await search({ query, parsers: [OrganicResult] });
  const top_results = search_results.filter(is_search_result_valid).slice(0, count);

  const response = await Promise.all(top_results.map(async (results) => {
    const { link: url = '', description } = results;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const content_as_html = await fetch(url, {
      headers: { 'user-agent': 'mozilla/5.0 (compatible)', 'cache-control': 'no-cache' }, redirect: 'follow', signal: controller.signal,
    }).then(res => res.text()).catch(() => null).finally(() => clearTimeout(timeout));

    if (!content_as_html) return description ? { url, content: description } : null;

    const content = extract_content_from(content_as_html);
    if (!content) return description ? { url, content: description } : null;

    return { url, content };
  }));

  return response.filter(Boolean);
};

const web_search_tool = tool({
  description: 'a web search and scraping tool that performs google-based queries and extracts meaningful content from the resulting pages. designed for open-ended information gathering, fact-finding. prefer this tool for discovering new information from the live web. this tool queries the broader internet and returns summarized content with associated urls.',
  inputSchema: z.object({
    queries: z.array(z.string()).nonempty().describe('one or more focused search queries. for complex questions, split the original query into multiple sub-queries and pass them here as an array.'),
    count: z.number().min(1).max(20).default(5).describe('the number of search results to return per query'),
  }).describe('the input to the web search tool'),
  outputSchema: z.array(z.object({
    url: z.url().describe('the url of the web page'),
    content: z.string().describe('the content of the web page'),
  }).describe('a single search result')).describe('an array of search results'),
  execute: async ({ queries, count }) => {
    const promises = queries.map(async query => await search_and_scrape(query, count));
    const searched = await Promise.all(promises) || [];

    return searched.flat();
  },
});

export { web_search_tool };
