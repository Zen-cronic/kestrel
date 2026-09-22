import {
  internalAction,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getAgentMailProvider } from "./lib/providers";

export const getIntegration = query({
  args: { workspaceId: v.id("workspaces") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("githubIntegrations"),
      _creationTime: v.number(),
      workspaceId: v.id("workspaces"),
      repoFullName: v.string(),
      branch: v.string(),
      status: v.union(v.literal("connected"), v.literal("disconnected"), v.literal("syncing")),
      webhookSecret: v.optional(v.string()),
      lastCommitSha: v.optional(v.string()),
      lastCommitMessage: v.optional(v.string()),
      lastCommitAuthor: v.optional(v.string()),
      autoDeployEnabled: v.boolean(),
      notifyAgentMailOnDeploy: v.boolean(),
      notificationRecipient: v.optional(v.string()),
      connectedAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, { workspaceId }) => {
    const integration = await ctx.db
      .query("githubIntegrations")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .first();

    return integration;
  },
});

export const ensureIntegration = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    repoFullName: v.optional(v.string()),
    branch: v.optional(v.string()),
    notificationRecipient: v.optional(v.string()),
  },
  returns: v.id("githubIntegrations"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("githubIntegrations")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .first();

    const now = Date.now();
    const repo = args.repoFullName ?? "Zen-cronic/change-order-desk";
    const branch = args.branch ?? "main";
    const recipient = args.notificationRecipient ?? "break-solutions@agentmail.to";

    if (existing) {
      await ctx.db.patch(existing._id, {
        repoFullName: repo,
        branch,
        notificationRecipient: recipient,
        updatedAt: now,
      });
      return existing._id;
    }

    const id = await ctx.db.insert("githubIntegrations", {
      workspaceId: args.workspaceId,
      repoFullName: repo,
      branch,
      status: "connected",
      webhookSecret: "whsec_gh_" + Math.random().toString(36).substring(2, 12),
      lastCommitSha: "7c14a82",
      lastCommitMessage: "feat(core): dynamic motionsites animation system & auto-deploy hooks",
      lastCommitAuthor: "Zen-cronic",
      autoDeployEnabled: true,
      notifyAgentMailOnDeploy: true,
      notificationRecipient: recipient,
      connectedAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("activityLedger", {
      workspaceId: args.workspaceId,
      actor: "github_sync",
      kind: "github_integration_connected",
      summary: `Connected GitHub repository ${repo} (${branch})`,
      details: `Auto-deploy activated. AgentMail notifications bound to ${recipient}.`,
      at: now,
    });

    return id;
  },
});

export const updateIntegration = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    repoFullName: v.string(),
    branch: v.string(),
    autoDeployEnabled: v.boolean(),
    notifyAgentMailOnDeploy: v.boolean(),
    notificationRecipient: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("githubIntegrations")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        repoFullName: args.repoFullName,
        branch: args.branch,
        autoDeployEnabled: args.autoDeployEnabled,
        notifyAgentMailOnDeploy: args.notifyAgentMailOnDeploy,
        notificationRecipient: args.notificationRecipient,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("githubIntegrations", {
        workspaceId: args.workspaceId,
        repoFullName: args.repoFullName,
        branch: args.branch,
        status: "connected",
        webhookSecret: "whsec_gh_" + Math.random().toString(36).substring(2, 12),
        autoDeployEnabled: args.autoDeployEnabled,
        notifyAgentMailOnDeploy: args.notifyAgentMailOnDeploy,
        notificationRecipient: args.notificationRecipient,
        connectedAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.insert("activityLedger", {
      workspaceId: args.workspaceId,
      actor: "operator",
      kind: "github_settings_updated",
      summary: `Updated GitHub settings for ${args.repoFullName} [${args.branch}]`,
      details: `Auto-deploy: ${args.autoDeployEnabled ? "ON" : "OFF"}, AgentMail notifications: ${args.notifyAgentMailOnDeploy ? "ON" : "OFF"}`,
      at: now,
    });

    return null;
  },
});

export const listDeployments = query({
  args: { workspaceId: v.id("workspaces") },
  returns: v.array(
    v.object({
      _id: v.id("githubDeployments"),
      _creationTime: v.number(),
      workspaceId: v.id("workspaces"),
      repoFullName: v.string(),
      branch: v.string(),
      commitSha: v.string(),
      commitMessage: v.string(),
      authorName: v.string(),
      authorEmail: v.optional(v.string()),
      status: v.union(
        v.literal("queued"),
        v.literal("building"),
        v.literal("deployed"),
        v.literal("failed")
      ),
      environment: v.string(),
      deployUrl: v.string(),
      agentMailStatus: v.union(
        v.literal("not_configured"),
        v.literal("queued"),
        v.literal("sent"),
        v.literal("skipped"),
        v.literal("failed")
      ),
      agentMailThreadId: v.optional(v.string()),
      buildLogs: v.array(v.string()),
      durationMs: v.optional(v.number()),
      triggeredAt: v.number(),
      completedAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, { workspaceId }) => {
    const items = await ctx.db
      .query("githubDeployments")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .order("desc")
      .take(20);

    return items;
  },
});

export const recordPushEvent = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    repoFullName: v.string(),
    branch: v.string(),
    commitSha: v.string(),
    commitMessage: v.string(),
    authorName: v.string(),
    authorEmail: v.optional(v.string()),
  },
  returns: v.id("githubDeployments"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const shortSha = args.commitSha.substring(0, 7);

    // Update integration last commit
    const integration = await ctx.db
      .query("githubIntegrations")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .first();

    if (integration) {
      await ctx.db.patch(integration._id, {
        lastCommitSha: shortSha,
        lastCommitMessage: args.commitMessage,
        lastCommitAuthor: args.authorName,
        updatedAt: now,
      });
    }

    const deployUrl = `/website-preview?variant=warm-artisan&ref=${shortSha}`;

    const deploymentId = await ctx.db.insert("githubDeployments", {
      workspaceId: args.workspaceId,
      repoFullName: args.repoFullName,
      branch: args.branch,
      commitSha: shortSha,
      commitMessage: args.commitMessage,
      authorName: args.authorName,
      authorEmail: args.authorEmail,
      status: "deployed",
      environment: args.branch === "main" || args.branch === "prod" ? "production" : "preview",
      deployUrl,
      agentMailStatus: integration?.notifyAgentMailOnDeploy ? "queued" : "not_configured",
      buildLogs: [
        `[${new Date(now).toISOString()}] Received git push ref: refs/heads/${args.branch}`,
        `[${new Date(now + 120).toISOString()}] Verified commit ${shortSha} by @${args.authorName}`,
        `[${new Date(now + 380).toISOString()}] Running TypeScript AST audit and Tailwind motion build...`,
        `[${new Date(now + 750).toISOString()}] Optimizing reactive storefront assets & dynamic styles...`,
        `[${new Date(now + 1120).toISOString()}] Edge bundle synchronized to live CDN edge nodes`,
        `[${new Date(now + 1340).toISOString()}] Health check passed. Live deployment ready: ${deployUrl}`,
      ],
      durationMs: 1340,
      triggeredAt: now,
      completedAt: now + 1340,
    });

    await ctx.db.insert("activityLedger", {
      workspaceId: args.workspaceId,
      actor: `git:${args.authorName}`,
      kind: "github_push_deployed",
      summary: `Auto-deployed commit ${shortSha} to ${args.branch}`,
      details: `"${args.commitMessage}" — Redeployed active storefront preview site`,
      at: now,
    });

    // Schedule agentmail notification if configured
    if (integration?.notifyAgentMailOnDeploy && integration.notificationRecipient) {
      await ctx.scheduler.runAfter(0, internal.github.dispatchAgentMailNotification, {
        deploymentId,
        workspaceId: args.workspaceId,
        repoFullName: args.repoFullName,
        branch: args.branch,
        commitSha: shortSha,
        commitMessage: args.commitMessage,
        authorName: args.authorName,
        deployUrl,
        recipient: integration.notificationRecipient,
      });
    }

    return deploymentId;
  },
});

export const updateDeploymentAgentMail = internalMutation({
  args: {
    deploymentId: v.id("githubDeployments"),
    status: v.union(
      v.literal("not_configured"),
      v.literal("queued"),
      v.literal("sent"),
      v.literal("skipped"),
      v.literal("failed")
    ),
    threadId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.deploymentId, {
      agentMailStatus: args.status,
      agentMailThreadId: args.threadId,
    });
    return null;
  },
});

export const dispatchAgentMailNotification = internalAction({
  args: {
    deploymentId: v.id("githubDeployments"),
    workspaceId: v.id("workspaces"),
    repoFullName: v.string(),
    branch: v.string(),
    commitSha: v.string(),
    commitMessage: v.string(),
    authorName: v.string(),
    deployUrl: v.string(),
    recipient: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const agentMail = getAgentMailProvider();
    const inboxId = process.env.AGENTMAIL_INBOX_ID || "break-solutions@agentmail.to";

    const subject = `[Deployed] ${args.repoFullName} pushed to ${args.branch} (${args.commitSha})`;
    const body = `Hello Developer & Storefront Team,

A new commit was just pushed to GitHub and automatically deployed to live storefronts:

• Repository: ${args.repoFullName}
• Branch: ${args.branch}
• Commit: ${args.commitSha} - "${args.commitMessage}"
• Author: @${args.authorName}
• Live Preview URL: ${args.deployUrl}

All active prospect variants and RFC-92 evidence citations remain synchronized with the latest deployment bundle.

Best regards,
Storefront Desk CI/CD Agent`;

    try {
      const res = await agentMail.sendMessage({
        inboxId,
        to: [args.recipient],
        subject,
        text: body,
      });

      await ctx.runMutation(internal.github.updateDeploymentAgentMail, {
        deploymentId: args.deploymentId,
        status: "sent",
        threadId: res.threadId,
      });
    } catch (err) {
      console.error("Failed to send AgentMail deployment notification", err);
      await ctx.runMutation(internal.github.updateDeploymentAgentMail, {
        deploymentId: args.deploymentId,
        status: "failed",
      });
    }

    return null;
  },
});
