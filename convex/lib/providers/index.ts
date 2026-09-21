import {
  PlacesProvider,
  FirecrawlProvider,
  OpenAIProvider,
  AgentMailProvider,
  getProviderMode,
} from "./types";
import {
  FixturePlacesProvider,
  FixtureFirecrawlProvider,
  FixtureOpenAIProvider,
  FixtureAgentMailProvider,
} from "./fixture";
import {
  LivePlacesProvider,
  LiveFirecrawlProvider,
  LiveOpenAIProvider,
  LiveAgentMailProvider,
} from "./live";

export * from "./types";
export * from "./fixture";

let placesProviderInstance: PlacesProvider | null = null;
let firecrawlProviderInstance: FirecrawlProvider | null = null;
let openAiProviderInstance: OpenAIProvider | null = null;
let agentMailProviderInstance: AgentMailProvider | null = null;

export function getPlacesProvider(): PlacesProvider {
  if (!placesProviderInstance) {
    placesProviderInstance =
      getProviderMode() === "live" && process.env.GOOGLE_PLACES_API_KEY
        ? new LivePlacesProvider()
        : new FixturePlacesProvider();
  }
  return placesProviderInstance;
}

export function getFirecrawlProvider(): FirecrawlProvider {
  if (!firecrawlProviderInstance) {
    firecrawlProviderInstance =
      getProviderMode() === "live" && process.env.FIRECRAWL_API_KEY
        ? new LiveFirecrawlProvider()
        : new FixtureFirecrawlProvider();
  }
  return firecrawlProviderInstance;
}

export function getOpenAIProvider(): OpenAIProvider {
  if (!openAiProviderInstance) {
    openAiProviderInstance =
      getProviderMode() === "live" && process.env.OPENAI_API_KEY
        ? new LiveOpenAIProvider()
        : new FixtureOpenAIProvider();
  }
  return openAiProviderInstance;
}

export function getAgentMailProvider(): AgentMailProvider {
  if (!agentMailProviderInstance) {
    agentMailProviderInstance =
      getProviderMode() === "live" && process.env.AGENTMAIL_API_KEY && process.env.AGENTMAIL_INBOX_ID
        ? new LiveAgentMailProvider()
        : new FixtureAgentMailProvider();
  }
  return agentMailProviderInstance;
}
