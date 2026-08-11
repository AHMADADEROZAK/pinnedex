export interface NewsItemView {
  guid: string;
  title: string;
  link: string;
  creator: string;
  categories: string[];
  contentSnippet: string;
  enclosureUrl?: string;
  pubDate?: string;
}