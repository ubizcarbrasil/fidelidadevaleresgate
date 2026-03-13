import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

// Mock sonner
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
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
    renderAuth();
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("switches to signup mode", () => {
    renderAuth();
    fireEvent.click(screen.getByText(/não tem conta/i));
    expect(screen.getByLabelText("Nome completo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /criar conta/i })).toBeInTheDocument();
  });

  it("shows forgot password form", () => {
    renderAuth();
    fireEvent.click(screen.getByText(/esqueceu a senha/i));
    expect(screen.getByRole("button", { name: /enviar email/i })).toBeInTheDocument();
    // Password field should be hidden
    expect(screen.queryByLabelText("Senha")).not.toBeInTheDocument();
  });
});
