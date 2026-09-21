/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as campaigns from "../campaigns.js";
import type * as demo from "../demo.js";
import type * as discovery from "../discovery.js";
import type * as evidence from "../evidence.js";
import type * as followups from "../followups.js";
import type * as generator from "../generator.js";
import type * as http from "../http.js";
import type * as lib_money from "../lib/money.js";
import type * as lib_providers_fixture from "../lib/providers/fixture.js";
import type * as lib_providers_index from "../lib/providers/index.js";
import type * as lib_providers_live from "../lib/providers/live.js";
import type * as lib_providers_types from "../lib/providers/types.js";
import type * as lib_replyText from "../lib/replyText.js";
import type * as outreach from "../outreach.js";
import type * as previews from "../previews.js";
import type * as proposals from "../proposals.js";
import type * as prospects from "../prospects.js";
import type * as threads from "../threads.js";
import type * as workspaces from "../workspaces.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  campaigns: typeof campaigns;
  demo: typeof demo;
  discovery: typeof discovery;
  evidence: typeof evidence;
  followups: typeof followups;
  generator: typeof generator;
  http: typeof http;
  "lib/money": typeof lib_money;
  "lib/providers/fixture": typeof lib_providers_fixture;
  "lib/providers/index": typeof lib_providers_index;
  "lib/providers/live": typeof lib_providers_live;
  "lib/providers/types": typeof lib_providers_types;
  "lib/replyText": typeof lib_replyText;
  outreach: typeof outreach;
  previews: typeof previews;
  proposals: typeof proposals;
  prospects: typeof prospects;
  threads: typeof threads;
  workspaces: typeof workspaces;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  staticHosting: import("@convex-dev/static-hosting/_generated/component.js").ComponentApi<"staticHosting">;
  agentmail: import("@agentmail/convex/_generated/component.js").ComponentApi<"agentmail">;
  firecrawl: import("@firecrawl/firecrawl-convex/_generated/component.js").ComponentApi<"firecrawl">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  agent: import("@convex-dev/agent/_generated/component.js").ComponentApi<"agent">;
};
