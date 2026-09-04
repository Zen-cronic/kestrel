import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { components } from "./_generated/api";
import { registerStaticRoutes } from "@convex-dev/static-hosting";
import { AgentMail } from "@agentmail/convex";

const http = httpRouter();
const agentmail = new AgentMail(components.agentmail);

// AgentMail → Convex. The component verifies the Svix signature and persists the
// thread; we then record + process the message idempotently through our own path.
http.route({
  path: "/agentmail/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const raw = await req.clone().text();
    const res = await agentmail.handleWebhook(ctx as unknown as Parameters<typeof agentmail.handleWebhook>[0], req);
    try {
      const event = JSON.parse(raw) as { type?: string; message?: { inbox_id?: string; message_id?: string; thread_id?: string; from?: string; subject?: string; text?: string; attachments?: Array<{ filename?: string; content_type?: string }> } };
      if (event.type === "message.received" && event.message?.message_id && event.message.inbox_id) {
        await ctx.runMutation(internal.inbound.record, {
          inboxId: event.message.inbox_id,
          messageId: event.message.message_id,
          threadId: event.message.thread_id,
          from: event.message.from ?? "",
          subject: event.message.subject ?? "",
          text: event.message.text ?? "",
          via: "agentmail",
          attachments: (event.message.attachments ?? []).map((a) => ({ filename: a.filename ?? "attachment", contentType: a.content_type ?? "application/octet-stream" })),
        });
      }
    } catch (e) {
      console.error("inbound record failed", e);
    }
    return res;
  }),
});

http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => new Response(JSON.stringify({ ok: true, at: Date.now() }), { headers: { "content-type": "application/json" } })),
});

// Static site catch-all last: exact routes above win.
registerStaticRoutes(http, components.staticHosting);

export default http;
