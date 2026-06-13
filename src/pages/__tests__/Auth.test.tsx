import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Auth from "../Auth";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: "Invalid" } }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [] }),
    })),
  },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/contexts/BrandContext", () => ({
  useBrand: () => ({ brand: null, theme: null }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: null, roles: [] }),
  AUTH_RETURN_TO_KEY: "auth:returnTo",
}));

function renderAuth() {
  return render(
    <MemoryRouter>
      <Auth />
    </MemoryRouter>
  );
}

describe("Auth Page", () => {
  it("renders login form by default", () => {
    const { getByLabelText, getByRole } = renderAuth();
    expect(getByLabelText("E-mail")).toBeInTheDocument();
    expect(getByLabelText("Senha")).toBeInTheDocument();
    expect(getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("switches to signup mode", () => {
    const { getByText, getByLabelText, getByRole } = renderAuth();
    fireEvent.click(getByText(/não tem conta/i));
    expect(getByLabelText("Nome completo")).toBeInTheDocument();
    expect(getByRole("button", { name: /criar conta/i })).toBeInTheDocument();
  });

  it("shows forgot password form", () => {
    const { getByText, getByRole, queryByLabelText } = renderAuth();
    fireEvent.click(getByText(/esqueceu a senha/i));
    expect(getByRole("button", { name: /enviar email/i })).toBeInTheDocument();
    expect(queryByLabelText("Senha")).not.toBeInTheDocument();
  });
});
