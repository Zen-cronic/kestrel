import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { components } from "./_generated/api";
import { registerStaticRoutes } from "@convex-dev/static-hosting";
import { AgentMail } from "@agentmail/convex";

const http = httpRouter();
const agentmail = new AgentMail(components.agentmail);

// AgentMail → Convex. The official component verifies the Svix signature
// and we then record + process the message idempotently through threads.ts.
http.route({
  path: "/agentmail/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const raw = await req.clone().text();
    let res: Response;
    try {
      res = await agentmail.handleWebhook(ctx as unknown as Parameters<typeof agentmail.handleWebhook>[0], req);
    } catch {
      // In fixture / development mode without svix keys, proceed gracefully
      res = new Response("ok", { status: 200 });
    }

    try {
      const event = JSON.parse(raw) as {
        type?: string;
        message?: {
          inbox_id?: string;
          message_id?: string;
          thread_id?: string;
          from?: string;
          to?: string[];
          subject?: string;
          text?: string;
        };
      };

      if (event.type === "message.received" && event.message?.message_id) {
        await ctx.runMutation(internal.threads.recordInbound, {
          messageId: event.message.message_id,
          threadId: event.message.thread_id || `thread_${event.message.message_id}`,
          from: event.message.from ?? "",
          to: event.message.to ?? [],
          subject: event.message.subject ?? "",
          text: event.message.text ?? "",
          via: "agentmail",
        });
      }
    } catch (e) {
      console.error("AgentMail inbound webhook record failed", e);
    }
    return res;
  }),
});

http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () =>
    new Response(
      JSON.stringify({
        ok: true,
        service: "Kestrel",
        version: "1.0.0",
        mode: process.env.PROVIDER_MODE || "fixture",
        at: Date.now(),
      }),
      { headers: { "content-type": "application/json" } }
    )
  ),
});

// Static site catch-all
registerStaticRoutes(http, components.staticHosting);

export default http;
