import { mockCrawl, mockLlm, mockMail } from "./mock";
import { liveLlm } from "./live";
import { providerMode } from "./types";
import type { Crawl, Llm, Mail } from "./types";

// Selection is per provider so partial credentials still work; the UI shows
// which providers are live so nobody mistakes a fixture for the real thing.
export function getLlm(): Llm {
  return providerMode() === "live" && process.env.OPENAI_API_KEY ? liveLlm : mockLlm;
}
export function getCrawl(): Crawl {
  return mockCrawl; // live Firecrawl (component from an action) lands in the crawl packet
}
export function getMail(): Mail {
  return mockMail; // live AgentMail (component sendMessage) lands in the mail packet
}
export function activeProviders() {
  return {
    llm: providerMode() === "live" && process.env.OPENAI_API_KEY ? "openai" : "mock",
    crawl: "mock",
    mail: "mock",
  } as const;
}
