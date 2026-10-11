import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PermissionGate } from "@/components/ui/permission-gate";
import { usePermissions } from "@/hooks/use-permissions";

vi.mock("@/hooks/use-permissions", () => ({
  usePermissions: vi.fn(),
}));

const mockUsePermissions = vi.mocked(usePermissions);

function grant(codes: string[]) {
  mockUsePermissions.mockReturnValue({
    hasPermission: (code: string) => codes.includes(code),
    hasAnyPermission: (list: string[]) => list.some((c) => codes.includes(c)),
    hasAllPermissions: (list: string[]) => list.every((c) => codes.includes(c)),
    permissions: codes,
    isPlatformAdmin: false,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PermissionGate", () => {
  it("renders children when the user holds the permission", () => {
    grant(["students.student.list"]);
    render(
      <PermissionGate permission="students.student.list">
        <span>student list</span>
      </PermissionGate>,
    );
    expect(screen.getByText("student list")).toBeDefined();
  });

  it("hides children when the user lacks the permission", () => {
    grant([]);
    const { container } = render(
      <PermissionGate permission="students.student.create">
        <span>secret form</span>
      </PermissionGate>,
    );
    expect(screen.queryByText("secret form")).toBeNull();
    expect(container.textContent).toBe("");
  });

  it("renders the fallback when permission is missing", () => {
    grant([]);
    render(
      <PermissionGate permission="x" fallback={<span>no access</span>}>
        <span>hidden</span>
      </PermissionGate>,
    );
    expect(screen.getByText("no access")).toBeDefined();
  });

  it("supports anyOf semantics", () => {
    grant(["b"]);
    render(
      <PermissionGate anyOf={["a", "b"]}>
        <span>any content</span>
      </PermissionGate>,
    );
    expect(screen.getByText("any content")).toBeDefined();
  });

  it("supports allOf semantics", () => {
    grant(["a"]);
    const { container } = render(
      <PermissionGate allOf={["a", "b"]}>
        <span>all content</span>
      </PermissionGate>,
    );
    expect(container.textContent).toBe("");
  });
});
