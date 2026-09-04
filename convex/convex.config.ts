import { defineApp } from "convex/server";
import { v } from "convex/values";
import staticHosting from "@convex-dev/static-hosting/convex.config";
import agentmail from "@agentmail/convex/convex.config";
import firecrawl from "@firecrawl/firecrawl-convex/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";

// Deployment env contract for components. FIRECRAWL_API_KEY must exist at push
// time (a placeholder is fine in PROVIDER_MODE=mock; see BUILD_CHECKPOINT.md).
const app = defineApp({
  env: {
    FIRECRAWL_API_KEY: v.string(),
    FIRECRAWL_WEBHOOK_SECRET: v.optional(v.string()),
  },
});

// App-owned root routing: our own HTTP routes (/agentmail/webhook, /health) are
// registered first in convex/http.ts; the static site is the catch-all
// (registerStaticRoutes). "Exact routes win over the static catch-all."
app.use(staticHosting);
app.use(agentmail);
app.use(firecrawl, {
  httpPrefix: "/firecrawl/",
  env: { FIRECRAWL_API_KEY: app.env.FIRECRAWL_API_KEY, FIRECRAWL_WEBHOOK_SECRET: app.env.FIRECRAWL_WEBHOOK_SECRET },
});
app.use(rateLimiter);

export default app;
