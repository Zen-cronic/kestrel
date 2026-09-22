import { describe, expect, it } from "vitest";
import { FixtureFirecrawlProvider, FixtureAgentMailProvider } from "../convex/lib/providers/fixture";

describe("Firecrawl Scrape & AgentMail Ingestion Capabilities", () => {
  it("scrapes target website via Firecrawl with markdown and links extraction", async () => {
    const firecrawl = new FixtureFirecrawlProvider();
    const result = await firecrawl.scrapeUrl("https://rustickettle-example.ca");

    expect(result.url).toBe("https://rustickettle-example.ca");
    expect(result.title).toContain("The Rustic Kettle");
    expect(result.markdown).toContain("Hours of Operation");
    expect(result.markdown).toContain("7:00 AM – 6:00 PM");
    expect(result.links.length).toBeGreaterThan(0);
    expect(result.statusCode).toBe(200);
  });

  it("lists and synchronizes inbound messages from AgentMail inbox", async () => {
    const agentMail = new FixtureAgentMailProvider();
    const messages = await agentMail.listMessages("break-solutions@agentmail.to");

    expect(messages.length).toBeGreaterThanOrEqual(1);
    const welcome = messages[0];
    expect(welcome.from).toBe("admin@agentmail.to");
    expect(welcome.to).toContain("break-solutions@agentmail.to");
    expect(welcome.subject).toContain("Welcome to AgentMail");
  });
});
