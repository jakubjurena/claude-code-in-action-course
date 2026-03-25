import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { HeaderActions } from "@/components/HeaderActions";

// cmdk (Command) uses ResizeObserver internally
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signOut: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

vi.mock("@/components/auth/AuthDialog", () => ({
  AuthDialog: ({
    open,
    defaultMode,
  }: {
    open: boolean;
    defaultMode: string;
  }) =>
    open ? (
      <div data-testid="auth-dialog" data-mode={defaultMode}>
        AuthDialog
      </div>
    ) : null,
}));

import { signOut } from "@/actions";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

const mockSignOut = vi.mocked(signOut);
const mockGetProjects = vi.mocked(getProjects);
const mockCreateProject = vi.mocked(createProject);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("HeaderActions", () => {
  describe("unauthenticated user (no user prop)", () => {
    it("renders Sign In and Sign Up buttons", () => {
      render(<HeaderActions />);
      expect(screen.getByRole("button", { name: /sign in/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /sign up/i })).toBeDefined();
    });

    it("does not render New Design button", () => {
      render(<HeaderActions />);
      expect(screen.queryByRole("button", { name: /new design/i })).toBeNull();
    });

    it("opens auth dialog in signin mode when Sign In is clicked", () => {
      render(<HeaderActions />);
      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
      const dialog = screen.getByTestId("auth-dialog");
      expect(dialog).toBeDefined();
      expect(dialog.getAttribute("data-mode")).toBe("signin");
    });

    it("opens auth dialog in signup mode when Sign Up is clicked", () => {
      render(<HeaderActions />);
      fireEvent.click(screen.getByRole("button", { name: /sign up/i }));
      const dialog = screen.getByTestId("auth-dialog");
      expect(dialog.getAttribute("data-mode")).toBe("signup");
    });

    it("does not call getProjects for anonymous users", () => {
      render(<HeaderActions />);
      expect(mockGetProjects).not.toHaveBeenCalled();
    });
  });

  describe("authenticated user", () => {
    const user = { id: "user-1", email: "user@example.com" };

    beforeEach(() => {
      mockGetProjects.mockResolvedValue([]);
    });

    it("renders New Design button", async () => {
      render(<HeaderActions user={user} projectId="proj-1" />);
      await waitFor(() =>
        expect(screen.getByRole("button", { name: /new design/i })).toBeDefined()
      );
    });

    it("renders sign out button", async () => {
      render(<HeaderActions user={user} projectId="proj-1" />);
      await waitFor(() => expect(mockGetProjects).toHaveBeenCalled());
      expect(screen.getByTitle("Sign out")).toBeDefined();
    });

    it("does not render Sign In / Sign Up buttons", async () => {
      render(<HeaderActions user={user} projectId="proj-1" />);
      await waitFor(() => expect(mockGetProjects).toHaveBeenCalled());
      expect(screen.queryByRole("button", { name: /^sign in$/i })).toBeNull();
      expect(screen.queryByRole("button", { name: /^sign up$/i })).toBeNull();
    });

    it("calls createProject and navigates on New Design click", async () => {
      mockCreateProject.mockResolvedValue({ id: "new-proj" } as any);
      render(<HeaderActions user={user} projectId="proj-1" />);
      await waitFor(() => expect(mockGetProjects).toHaveBeenCalled());

      fireEvent.click(screen.getByRole("button", { name: /new design/i }));

      await waitFor(() => {
        expect(mockCreateProject).toHaveBeenCalledWith(
          expect.objectContaining({ messages: [], data: {} })
        );
        expect(mockPush).toHaveBeenCalledWith("/new-proj");
      });
    });

    it("calls signOut when sign out button is clicked", async () => {
      mockSignOut.mockResolvedValue(undefined as any);
      render(<HeaderActions user={user} projectId="proj-1" />);
      await waitFor(() => expect(mockGetProjects).toHaveBeenCalled());

      fireEvent.click(screen.getByTitle("Sign out"));

      await waitFor(() => expect(mockSignOut).toHaveBeenCalled());
    });

    it("loads and displays projects from getProjects", async () => {
      mockGetProjects.mockResolvedValue([
        { id: "p1", name: "My Design", createdAt: new Date(), updatedAt: new Date() },
        { id: "p2", name: "Another Design", createdAt: new Date(), updatedAt: new Date() },
      ] as any);

      render(<HeaderActions user={user} projectId="p1" />);
      await waitFor(() => expect(mockGetProjects).toHaveBeenCalled());

      // Project combobox should display current project name
      expect(screen.getByText("My Design")).toBeDefined();
    });

    it("does not fetch projects when user is not provided", () => {
      render(<HeaderActions projectId="proj-1" />);
      expect(mockGetProjects).not.toHaveBeenCalled();
    });
  });

  describe("project display", () => {
    const user = { id: "user-1", email: "user@example.com" };

    it("shows 'Select Project' when projectId does not match any loaded project", async () => {
      mockGetProjects.mockResolvedValue([
        { id: "p1", name: "My Design", createdAt: new Date(), updatedAt: new Date() },
      ] as any);

      render(<HeaderActions user={user} projectId="unknown-id" />);
      await waitFor(() => expect(mockGetProjects).toHaveBeenCalled());

      expect(screen.getByText("Select Project")).toBeDefined();
    });

    it("refetches projects when component mounts with a user and projectId", async () => {
      mockGetProjects.mockResolvedValue([]);
      render(<HeaderActions user={user} projectId="proj-1" />);
      await waitFor(() => expect(mockGetProjects).toHaveBeenCalledOnce());
    });
  });
});
