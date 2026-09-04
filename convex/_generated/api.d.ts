/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as changeOrders from "../changeOrders.js";
import type * as demo from "../demo.js";
import type * as http from "../http.js";
import type * as inbound from "../inbound.js";
import type * as lib_money from "../lib/money.js";
import type * as lib_providers_index from "../lib/providers/index.js";
import type * as lib_providers_live from "../lib/providers/live.js";
import type * as lib_providers_mock from "../lib/providers/mock.js";
import type * as lib_providers_types from "../lib/providers/types.js";
import type * as lib_replyText from "../lib/replyText.js";
import type * as mail from "../mail.js";
import type * as pricing from "../pricing.js";
import type * as projects from "../projects.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  changeOrders: typeof changeOrders;
  demo: typeof demo;
  http: typeof http;
  inbound: typeof inbound;
  "lib/money": typeof lib_money;
  "lib/providers/index": typeof lib_providers_index;
  "lib/providers/live": typeof lib_providers_live;
  "lib/providers/mock": typeof lib_providers_mock;
  "lib/providers/types": typeof lib_providers_types;
  "lib/replyText": typeof lib_replyText;
  mail: typeof mail;
  pricing: typeof pricing;
  projects: typeof projects;
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
};
