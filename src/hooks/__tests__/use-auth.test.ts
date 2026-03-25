import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock server actions
vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";

const mockSignInAction = vi.mocked(signInAction);
const mockSignUpAction = vi.mocked(signUpAction);
const mockGetProjects = vi.mocked(getProjects);
const mockCreateProject = vi.mocked(createProject);
const mockGetAnonWorkData = vi.mocked(getAnonWorkData);
const mockClearAnonWork = vi.mocked(clearAnonWork);

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAnonWorkData.mockReturnValue(null);
  });

  describe("initial state", () => {
    it("returns isLoading as false initially", () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);
    });

    it("exposes signIn and signUp functions", () => {
      const { result } = renderHook(() => useAuth());
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
    });
  });

  describe("signIn", () => {
    describe("happy path - no anon work, no existing projects", () => {
      it("creates a new project and redirects to it", async () => {
        mockSignInAction.mockResolvedValue({ success: true });
        mockGetProjects.mockResolvedValue([]);
        mockCreateProject.mockResolvedValue({ id: "new-project-id" } as any);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(mockCreateProject).toHaveBeenCalledWith(
          expect.objectContaining({ messages: [], data: {} })
        );
        expect(mockPush).toHaveBeenCalledWith("/new-project-id");
      });
    });

    describe("happy path - no anon work, existing projects", () => {
      it("redirects to the most recent project", async () => {
        mockSignInAction.mockResolvedValue({ success: true });
        mockGetProjects.mockResolvedValue([
          { id: "proj-1" },
          { id: "proj-2" },
        ] as any);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(mockPush).toHaveBeenCalledWith("/proj-1");
        expect(mockCreateProject).not.toHaveBeenCalled();
      });
    });

    describe("happy path - with anon work", () => {
      it("saves anon work as new project and redirects to it", async () => {
        const anonWork = {
          messages: [{ role: "user", content: "hello" }],
          fileSystemData: { "/": { type: "directory" }, "/App.tsx": "code" },
        };
        mockSignInAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(anonWork);
        mockCreateProject.mockResolvedValue({ id: "anon-project-id" } as any);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(mockCreateProject).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: anonWork.messages,
            data: anonWork.fileSystemData,
          })
        );
        expect(mockClearAnonWork).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/anon-project-id");
        expect(mockGetProjects).not.toHaveBeenCalled();
      });
    });

    describe("failed sign in", () => {
      it("returns error result without redirecting", async () => {
        mockSignInAction.mockResolvedValue({
          success: false,
          error: "Invalid credentials",
        });

        const { result } = renderHook(() => useAuth());

        let returnValue: any;
        await act(async () => {
          returnValue = await result.current.signIn(
            "user@example.com",
            "wrongpassword"
          );
        });

        expect(returnValue).toEqual({
          success: false,
          error: "Invalid credentials",
        });
        expect(mockPush).not.toHaveBeenCalled();
        expect(mockGetProjects).not.toHaveBeenCalled();
        expect(mockCreateProject).not.toHaveBeenCalled();
      });
    });

    describe("isLoading state", () => {
      it("sets isLoading to true during sign in and false after", async () => {
        let resolveSignIn!: (value: any) => void;
        mockSignInAction.mockReturnValue(
          new Promise((resolve) => {
            resolveSignIn = resolve;
          })
        );

        const { result } = renderHook(() => useAuth());

        let signInPromise: Promise<any>;
        act(() => {
          signInPromise = result.current.signIn("user@example.com", "pass");
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
          resolveSignIn({ success: false, error: "error" });
          await signInPromise!;
        });

        expect(result.current.isLoading).toBe(false);
      });

      it("sets isLoading back to false even when signIn throws", async () => {
        mockSignInAction.mockRejectedValue(new Error("Network error"));

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          try {
            await result.current.signIn("user@example.com", "pass");
          } catch {
            // expected
          }
        });

        expect(result.current.isLoading).toBe(false);
      });
    });

    it("returns the result from signInAction", async () => {
      mockSignInAction.mockResolvedValue({ success: false, error: "Oops" });

      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signIn("a@b.com", "pass");
      });

      expect(returnValue).toEqual({ success: false, error: "Oops" });
    });
  });

  describe("signUp", () => {
    describe("happy path - no anon work, no existing projects", () => {
      it("creates a new project and redirects to it", async () => {
        mockSignUpAction.mockResolvedValue({ success: true });
        mockGetProjects.mockResolvedValue([]);
        mockCreateProject.mockResolvedValue({ id: "new-project-id" } as any);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signUp("newuser@example.com", "password123");
        });

        expect(mockCreateProject).toHaveBeenCalledWith(
          expect.objectContaining({ messages: [], data: {} })
        );
        expect(mockPush).toHaveBeenCalledWith("/new-project-id");
      });
    });

    describe("happy path - with anon work", () => {
      it("saves anon work as new project on sign up", async () => {
        const anonWork = {
          messages: [{ role: "user", content: "design me an app" }],
          fileSystemData: { "/": {}, "/index.tsx": "..." },
        };
        mockSignUpAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(anonWork);
        mockCreateProject.mockResolvedValue({ id: "project-abc" } as any);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signUp("new@example.com", "password123");
        });

        expect(mockCreateProject).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: anonWork.messages,
            data: anonWork.fileSystemData,
          })
        );
        expect(mockClearAnonWork).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/project-abc");
      });
    });

    describe("failed sign up", () => {
      it("returns error result without redirecting", async () => {
        mockSignUpAction.mockResolvedValue({
          success: false,
          error: "Email already registered",
        });

        const { result } = renderHook(() => useAuth());

        let returnValue: any;
        await act(async () => {
          returnValue = await result.current.signUp(
            "existing@example.com",
            "password123"
          );
        });

        expect(returnValue).toEqual({
          success: false,
          error: "Email already registered",
        });
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    describe("isLoading state", () => {
      it("sets isLoading to true during sign up and false after", async () => {
        let resolveSignUp!: (value: any) => void;
        mockSignUpAction.mockReturnValue(
          new Promise((resolve) => {
            resolveSignUp = resolve;
          })
        );

        const { result } = renderHook(() => useAuth());

        let signUpPromise: Promise<any>;
        act(() => {
          signUpPromise = result.current.signUp("new@example.com", "pass");
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
          resolveSignUp({ success: false, error: "error" });
          await signUpPromise!;
        });

        expect(result.current.isLoading).toBe(false);
      });

      it("sets isLoading back to false even when signUp throws", async () => {
        mockSignUpAction.mockRejectedValue(new Error("Network error"));

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          try {
            await result.current.signUp("new@example.com", "pass");
          } catch {
            // expected
          }
        });

        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("anon work edge cases", () => {
    it("does not save anon work when messages array is empty", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue({ messages: [], fileSystemData: {} });
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "proj-x" } as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "pass");
      });

      // With empty messages, should skip anon work path and go to getProjects
      expect(mockGetProjects).toHaveBeenCalled();
      expect(mockClearAnonWork).not.toHaveBeenCalled();
    });

    it("does not call clearAnonWork when sign in fails", async () => {
      mockSignInAction.mockResolvedValue({ success: false, error: "Bad creds" });
      mockGetAnonWorkData.mockReturnValue({
        messages: [{ role: "user", content: "hi" }],
        fileSystemData: {},
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "bad");
      });

      expect(mockClearAnonWork).not.toHaveBeenCalled();
    });
  });
});
