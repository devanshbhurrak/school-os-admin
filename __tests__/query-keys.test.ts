import { describe, it, expect } from "vitest";
import { platformKeys } from "@/lib/query-keys";

describe("platform query keys", () => {
  it("builds distinct org audit keys per org", () => {
    expect(platformKeys.orgAudit("org-1")).not.toEqual(platformKeys.orgAudit("org-2"));
  });

  it("builds outbox monitoring keys", () => {
    expect(platformKeys.outboxSummary()).toContain("outbox");
    expect(platformKeys.outboxEvents({ limit: 10 })).not.toEqual(
      platformKeys.outboxEvents({ limit: 20 }),
    );
    expect(platformKeys.outboxSummary()).not.toEqual(platformKeys.outboxEvents());
  });

  it("builds feature-flag keys", () => {
    expect(JSON.stringify(platformKeys.featureFlags({ limit: 50 }))).toContain("feature-flags");
    expect(platformKeys.featureFlags()).not.toEqual(platformKeys.outboxEvents());
  });

  it("keeps user, school, and audit keys distinct", () => {
    expect(platformKeys.user("u-1")).not.toEqual(platformKeys.user("u-2"));
    expect(platformKeys.school("s-1")).not.toEqual(platformKeys.schoolAudit("s-1"));
    expect(platformKeys.audit({ limit: 10 })).not.toEqual(platformKeys.orgAudit("org-1"));
  });

  it("builds platform stats keys", () => {
    expect(platformKeys.platformStats()).toContain("platform");
    expect(platformKeys.platformStats()).toContain("stats");
  });

  it("passes server-side audit params through (no client-side filtering)", () => {
    const params = { organization_id: "org-9", action: "USER_CREATED", limit: 25 };
    const key = platformKeys.audit(params);
    expect(JSON.stringify(key)).toContain("org-9");
    expect(JSON.stringify(key)).toContain("USER_CREATED");
  });
});
