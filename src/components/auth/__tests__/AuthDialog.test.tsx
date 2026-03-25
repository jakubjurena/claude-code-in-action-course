import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AuthDialog } from "@/components/auth/AuthDialog";

// Stub out forms so we don't need to set up the full auth chain
vi.mock("@/components/auth/SignInForm", () => ({
  SignInForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <div data-testid="sign-in-form">
      <button onClick={onSuccess}>Mock Sign In</button>
    </div>
  ),
}));

vi.mock("@/components/auth/SignUpForm", () => ({
  SignUpForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <div data-testid="sign-up-form">
      <button onClick={onSuccess}>Mock Sign Up</button>
    </div>
  ),
}));

afterEach(cleanup);

describe("AuthDialog", () => {
  describe("when closed", () => {
    it("does not render dialog content when open=false", () => {
      render(
        <AuthDialog open={false} onOpenChange={vi.fn()} />
      );
      expect(screen.queryByTestId("sign-in-form")).toBeNull();
      expect(screen.queryByTestId("sign-up-form")).toBeNull();
    });
  });

  describe("sign in mode (default)", () => {
    it("renders SignInForm in signin mode by default", () => {
      render(<AuthDialog open={true} onOpenChange={vi.fn()} />);
      expect(screen.getByTestId("sign-in-form")).toBeDefined();
      expect(screen.queryByTestId("sign-up-form")).toBeNull();
    });

    it("shows 'Welcome back' title in signin mode", () => {
      render(<AuthDialog open={true} onOpenChange={vi.fn()} />);
      expect(screen.getByText("Welcome back")).toBeDefined();
    });

    it("shows 'Sign in to your account' description in signin mode", () => {
      render(<AuthDialog open={true} onOpenChange={vi.fn()} />);
      expect(screen.getByText(/sign in to your account/i)).toBeDefined();
    });

    it("shows a link to switch to sign up", () => {
      render(<AuthDialog open={true} onOpenChange={vi.fn()} />);
      expect(screen.getByRole("button", { name: /sign up/i })).toBeDefined();
    });
  });

  describe("sign up mode", () => {
    it("renders SignUpForm when defaultMode is signup", () => {
      render(
        <AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signup" />
      );
      expect(screen.getByTestId("sign-up-form")).toBeDefined();
      expect(screen.queryByTestId("sign-in-form")).toBeNull();
    });

    it("shows 'Create an account' title in signup mode", () => {
      render(
        <AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signup" />
      );
      expect(screen.getByText("Create an account")).toBeDefined();
    });

    it("shows a link to switch to sign in", () => {
      render(
        <AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signup" />
      );
      expect(screen.getByRole("button", { name: /sign in/i })).toBeDefined();
    });
  });

  describe("mode switching", () => {
    it("switches to signup form when 'Sign up' link is clicked", () => {
      render(<AuthDialog open={true} onOpenChange={vi.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

      expect(screen.getByTestId("sign-up-form")).toBeDefined();
      expect(screen.queryByTestId("sign-in-form")).toBeNull();
    });

    it("switches back to signin form when 'Sign in' link is clicked", () => {
      render(
        <AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signup" />
      );

      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      expect(screen.getByTestId("sign-in-form")).toBeDefined();
      expect(screen.queryByTestId("sign-up-form")).toBeNull();
    });
  });

  describe("success handling", () => {
    it("calls onOpenChange(false) when sign in form succeeds", () => {
      const onOpenChange = vi.fn();
      render(<AuthDialog open={true} onOpenChange={onOpenChange} />);

      fireEvent.click(screen.getByRole("button", { name: /mock sign in/i }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("calls onOpenChange(false) when sign up form succeeds", () => {
      const onOpenChange = vi.fn();
      render(
        <AuthDialog open={true} onOpenChange={onOpenChange} defaultMode="signup" />
      );

      fireEvent.click(screen.getByRole("button", { name: /mock sign up/i }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("defaultMode prop update", () => {
    it("resets to new defaultMode when prop changes", () => {
      const { rerender } = render(
        <AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signin" />
      );
      expect(screen.getByTestId("sign-in-form")).toBeDefined();

      rerender(
        <AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signup" />
      );
      expect(screen.getByTestId("sign-up-form")).toBeDefined();
    });
  });
});
