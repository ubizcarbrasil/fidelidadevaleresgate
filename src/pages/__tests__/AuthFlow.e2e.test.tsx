/**
 * E2E Integration Tests — Auth Flow
 * Tests: login, signup, password reset, role-based redirect
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
// @ts-expect-error — test-only imports resolved by vitest
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Auth from "../Auth";

// ── Mocks ────────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockResetPassword = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: any[]) => mockSignIn(...args),
      signUp: (...args: any[]) => mockSignUp(...args),
      resetPasswordForEmail: (...args: any[]) => mockResetPassword(...args),
    },
    from: (...args: any[]) => mockFrom(...args),
  },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/contexts/BrandContext", () => ({
  useBrand: () => ({ brand: null, theme: null }),
}));

function renderAuth() {
  return render(
    <MemoryRouter>
      <Auth />
    </MemoryRouter>
  );
}

describe("Auth Flow E2E", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Login ──────────────────────────────────────────────
  describe("Login", () => {
    it("successful login as admin redirects to /", async () => {
      mockSignIn.mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      });
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ role: "brand_admin" }],
          }),
        }),
      });

      renderAuth();
      fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "admin@test.com" } });
      fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "password123" } });
      fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({ email: "admin@test.com", password: "password123" });
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });

    it("successful login as store_admin redirects to /store-panel", async () => {
      mockSignIn.mockResolvedValue({
        data: { user: { id: "store-user-1" } },
        error: null,
      });
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ role: "store_admin" }],
          }),
        }),
      });

      renderAuth();
      fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "store@test.com" } });
      fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "password123" } });
      fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/store-panel");
      });
    });

    it("login error shows toast", async () => {
      mockSignIn.mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid login credentials" },
      });

      renderAuth();
      fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "bad@test.com" } });
      fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "wrong" } });
      fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({ email: "bad@test.com", password: "wrong" });
      });
    });
  });

  // ── Signup ─────────────────────────────────────────────
  describe("Signup", () => {
    it("successful signup shows success and navigates", async () => {
      mockSignUp.mockResolvedValue({ data: {}, error: null });

      renderAuth();
      fireEvent.click(screen.getByText(/não tem conta/i));

      fireEvent.change(screen.getByLabelText("Nome completo"), { target: { value: "João Silva" } });
      fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "joao@test.com" } });
      fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "password123" } });
      fireEvent.click(screen.getByRole("button", { name: /criar conta/i }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          expect.objectContaining({
            email: "joao@test.com",
            password: "password123",
          })
        );
      });
    });
  });

  // ── Password Reset ─────────────────────────────────────
  describe("Password Reset", () => {
    it("sends reset email successfully", async () => {
      mockResetPassword.mockResolvedValue({ error: null });

      renderAuth();
      fireEvent.click(screen.getByText(/esqueceu a senha/i));
      fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "reset@test.com" } });
      fireEvent.click(screen.getByRole("button", { name: /enviar email/i }));

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith("reset@test.com", expect.objectContaining({
          redirectTo: expect.stringContaining("/reset-password"),
        }));
        const { toast } = require("sonner");
        expect(toast.success).toHaveBeenCalledWith("Email de recuperação enviado!");
      });
    });
  });
});
