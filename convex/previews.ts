import { query } from "./_generated/server";
import { v } from "convex/values";

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      slug: v.string(),
      version: v.number(),
      businessIdentity: v.object({
        name: v.string(),
        tagline: v.string(),
        vertical: v.string(),
        neighborhood: v.string(),
        city: v.string(),
      }),
      theme: v.object({
        primaryColor: v.string(),
        accentColor: v.string(),
        fontHeading: v.string(),
        fontBody: v.string(),
        styleVariant: v.string(),
      }),
      navigation: v.array(v.object({ label: v.string(), anchor: v.string() })),
      hero: v.object({
        badge: v.string(),
        headline: v.string(),
        subheadline: v.string(),
        primaryCta: v.object({ label: v.string(), action: v.string() }),
        secondaryCta: v.optional(v.object({ label: v.string(), action: v.string() })),
      }),
      aboutSection: v.object({
        title: v.string(),
        storyParagraphs: v.array(v.string()),
        highlights: v.array(v.string()),
      }),
      offeringsSection: v.object({
        title: v.string(),
        description: v.string(),
        items: v.array(
          v.object({
            name: v.string(),
            description: v.string(),
            priceDisplay: v.optional(v.string()),
            badge: v.optional(v.string()),
          })
        ),
      }),
      hoursAndLocation: v.object({
        address: v.string(),
        hours: v.array(
          v.object({
            days: v.string(),
            open: v.string(),
            close: v.string(),
          })
        ),
        note: v.optional(v.string()),
      }),
      contactSection: v.object({
        email: v.string(),
        phone: v.optional(v.string()),
        reservationNotice: v.string(),
      }),
      unknownItems: v.array(v.string()),
      publishedAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, { slug }) => {
    const spec = await ctx.db
      .query("websiteSpecs")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (!spec || !spec.isPublished) return null;

    // Return ONLY safe, public-facing website presentation data
    return {
      slug: spec.slug,
      version: spec.version,
      businessIdentity: spec.businessIdentity,
      theme: spec.theme,
      navigation: spec.navigation,
      hero: {
        badge: spec.hero.badge,
        headline: spec.hero.headline,
        subheadline: spec.hero.subheadline,
        primaryCta: spec.hero.primaryCta,
        secondaryCta: spec.hero.secondaryCta,
      },
      aboutSection: {
        title: spec.aboutSection.title,
        storyParagraphs: spec.aboutSection.storyParagraphs,
        highlights: spec.aboutSection.highlights,
      },
      offeringsSection: {
        title: spec.offeringsSection.title,
        description: spec.offeringsSection.description,
        items: spec.offeringsSection.items.map((it) => ({
          name: it.name,
          description: it.description,
          priceDisplay: it.priceDisplay,
          badge: it.badge,
        })),
      },
      hoursAndLocation: {
        address: spec.hoursAndLocation.address,
        hours: spec.hoursAndLocation.hours,
        note: spec.hoursAndLocation.note,
      },
      contactSection: {
        email: spec.contactSection.email,
        phone: spec.contactSection.phone,
        reservationNotice: spec.contactSection.reservationNotice,
      },
      unknownItems: spec.unknownItems,
      publishedAt: spec.publishedAt,
    };
  },
});

export const listVersions = query({
  args: { prospectId: v.id("prospects") },
  returns: v.array(
    v.object({
      _id: v.id("websiteSpecs"),
      version: v.number(),
      slug: v.string(),
      isPublished: v.boolean(),
      publishedAt: v.optional(v.number()),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, { prospectId }) => {
    const specs = await ctx.db
      .query("websiteSpecs")
      .withIndex("by_prospectId", (q) => q.eq("prospectId", prospectId))
      .order("desc")
      .collect();

    return specs.map((s) => ({
      _id: s._id,
      version: s.version,
      slug: s.slug,
      isPublished: s.isPublished,
      publishedAt: s.publishedAt,
      createdAt: s.createdAt,
    }));
  },
});
