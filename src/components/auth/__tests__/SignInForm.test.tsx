import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { SignInForm } from "@/components/auth/SignInForm";

const mockSignIn = vi.fn();
const mockAuthState = { signIn: mockSignIn, isLoading: false };

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => mockAuthState,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockAuthState.isLoading = false;
});

describe("SignInForm", () => {
  describe("rendering", () => {
    it("renders email and password fields", () => {
      render(<SignInForm />);
      expect(screen.getByLabelText(/email/i)).toBeDefined();
      expect(screen.getByLabelText(/password/i)).toBeDefined();
    });

    it("renders submit button with Sign In text", () => {
      render(<SignInForm />);
      expect(screen.getByRole("button", { name: /sign in/i })).toBeDefined();
    });

    it("does not show an error message initially", () => {
      render(<SignInForm />);
      expect(screen.queryByText(/failed/i)).toBeNull();
      expect(screen.queryByText(/invalid/i)).toBeNull();
    });

    it("shows loading text when isLoading is true", () => {
      mockAuthState.isLoading = true;
      render(<SignInForm />);
      expect(screen.getByText("Signing in...")).toBeDefined();
    });

    it("disables inputs and button when isLoading is true", () => {
      mockAuthState.isLoading = true;
      render(<SignInForm />);
      const button = screen.getByRole("button");
      expect((button as HTMLButtonElement).disabled).toBe(true);
      expect((screen.getByLabelText(/email/i) as HTMLInputElement).disabled).toBe(true);
      expect((screen.getByLabelText(/password/i) as HTMLInputElement).disabled).toBe(true);
    });
  });

  describe("successful sign in", () => {
    it("calls signIn with typed email and password", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      render(<SignInForm />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: "user@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: "password123" },
      });
      fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith("user@example.com", "password123");
      });
    });

    it("calls onSuccess callback after successful sign in", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      const onSuccess = vi.fn();
      render(<SignInForm onSuccess={onSuccess} />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: "user@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: "password123" },
      });
      fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledOnce();
      });
    });
  });

  describe("failed sign in", () => {
    it("displays the error message from the result", async () => {
      mockSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });
      render(<SignInForm />);

      fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeDefined();
      });
    });

    it("displays a fallback error when no error message is provided", async () => {
      mockSignIn.mockResolvedValue({ success: false });
      render(<SignInForm />);

      fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText("Failed to sign in")).toBeDefined();
      });
    });

    it("does not call onSuccess on failure", async () => {
      mockSignIn.mockResolvedValue({ success: false, error: "Bad creds" });
      const onSuccess = vi.fn();
      render(<SignInForm onSuccess={onSuccess} />);

      fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => expect(mockSignIn).toHaveBeenCalled());
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it("clears previous error on new submission", async () => {
      mockSignIn
        .mockResolvedValueOnce({ success: false, error: "First error" })
        .mockResolvedValueOnce({ success: true });

      render(<SignInForm />);

      fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));
      await waitFor(() => screen.getByText("First error"));

      fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));
      await waitFor(() => {
        expect(screen.queryByText("First error")).toBeNull();
      });
    });
  });
});
