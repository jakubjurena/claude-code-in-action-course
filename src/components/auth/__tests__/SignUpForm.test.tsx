import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { SignUpForm } from "@/components/auth/SignUpForm";

const mockSignUp = vi.fn();
const mockAuthState = { signUp: mockSignUp, isLoading: false };

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => mockAuthState,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockAuthState.isLoading = false;
});

describe("SignUpForm", () => {
  describe("rendering", () => {
    it("renders email, password, and confirm password fields", () => {
      render(<SignUpForm />);
      expect(screen.getByLabelText(/^email/i)).toBeDefined();
      expect(screen.getByLabelText(/^password/i)).toBeDefined();
      expect(screen.getByLabelText(/confirm password/i)).toBeDefined();
    });

    it("renders submit button with Sign Up text", () => {
      render(<SignUpForm />);
      expect(screen.getByRole("button", { name: /sign up/i })).toBeDefined();
    });

    it("shows password length hint", () => {
      render(<SignUpForm />);
      expect(screen.getByText(/at least 8 characters/i)).toBeDefined();
    });

    it("shows loading text when isLoading is true", () => {
      mockAuthState.isLoading = true;
      render(<SignUpForm />);
      expect(screen.getByText("Creating account...")).toBeDefined();
    });

    it("disables inputs and button when isLoading is true", () => {
      mockAuthState.isLoading = true;
      render(<SignUpForm />);
      expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
      expect((screen.getByLabelText(/^email/i) as HTMLInputElement).disabled).toBe(true);
    });
  });

  describe("password confirmation validation", () => {
    it("shows error when passwords do not match", async () => {
      render(<SignUpForm />);

      fireEvent.change(screen.getByLabelText(/^email/i), {
        target: { value: "user@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: "password123" },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: "differentpassword" },
      });
      fireEvent.submit(screen.getByRole("button", { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText("Passwords do not match")).toBeDefined();
      });
    });

    it("does not call signUp when passwords do not match", async () => {
      render(<SignUpForm />);

      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: "password123" },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: "other" },
      });
      fireEvent.submit(screen.getByRole("button", { name: /sign up/i }));

      await waitFor(() => screen.getByText("Passwords do not match"));
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("proceeds when passwords match", async () => {
      mockSignUp.mockResolvedValue({ success: true });
      render(<SignUpForm />);

      fireEvent.change(screen.getByLabelText(/^email/i), {
        target: { value: "user@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: "password123" },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: "password123" },
      });
      fireEvent.submit(screen.getByRole("button", { name: /sign up/i }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith("user@example.com", "password123");
      });
    });
  });

  describe("successful sign up", () => {
    it("calls onSuccess callback after successful sign up", async () => {
      mockSignUp.mockResolvedValue({ success: true });
      const onSuccess = vi.fn();
      render(<SignUpForm onSuccess={onSuccess} />);

      fireEvent.change(screen.getByLabelText(/^email/i), {
        target: { value: "new@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: "password123" },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: "password123" },
      });
      fireEvent.submit(screen.getByRole("button", { name: /sign up/i }));

      await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    });
  });

  describe("failed sign up", () => {
    it("displays error message from result", async () => {
      mockSignUp.mockResolvedValue({ success: false, error: "Email already registered" });
      render(<SignUpForm />);

      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: "password123" },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: "password123" },
      });
      fireEvent.submit(screen.getByRole("button", { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText("Email already registered")).toBeDefined();
      });
    });

    it("displays fallback error when no error message provided", async () => {
      mockSignUp.mockResolvedValue({ success: false });
      render(<SignUpForm />);

      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: "password123" },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: "password123" },
      });
      fireEvent.submit(screen.getByRole("button", { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText("Failed to sign up")).toBeDefined();
      });
    });

    it("does not call onSuccess on failure", async () => {
      mockSignUp.mockResolvedValue({ success: false, error: "Error" });
      const onSuccess = vi.fn();
      render(<SignUpForm onSuccess={onSuccess} />);

      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: "password123" },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: "password123" },
      });
      fireEvent.submit(screen.getByRole("button", { name: /sign up/i }));

      await waitFor(() => expect(mockSignUp).toHaveBeenCalled());
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });
});
