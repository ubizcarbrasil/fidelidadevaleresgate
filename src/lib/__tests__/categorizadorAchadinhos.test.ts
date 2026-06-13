/**
 * categorizadorAchadinhos — categorização automática de produtos.
 *
 * Usado na importação/mirror-sync pra mapear deals externos pra
 * categorias internas do brand. Bug aqui = produtos categorizados
 * errado → analytics quebrado, "For You" recomendação ruim, UX
 * mostra Pet Shop em "Eletrônicos".
 *
 * Algoritmo (em ordem de prioridade):
 *   1. API_CATEGORY_MAP: tradução en → pt (home→casa, babies→bebe)
 *   2. Match exato normalizado (case + accents)
 *   3. Match parcial (substring em ambas direções)
 *   4. Keyword scoring com word-boundary, MIN_SCORE=4
 */
import { describe, it, expect } from "vitest";
import {
  sugerirCategoria,
  type CategoriaAchadinho,
} from "../categorizadorAchadinhos";

function cat(name: string, keywords: string[] = []): CategoriaAchadinho {
  return { id: `cat-${name}`, name, keywords };
}

describe("sugerirCategoria — API_CATEGORY_MAP (prioridade 1)", () => {
  it("home → casa", () => {
    const r = sugerirCategoria("X", null, "home", null, [cat("Casa")]);
    expect(r?.name).toBe("Casa");
  });

  it("babies → bebe (sem acento)", () => {
    const r = sugerirCategoria("X", null, "babies", null, [cat("Bebe")]);
    expect(r?.name).toBe("Bebe");
  });

  it("computers → eletronicos (multi-source mapping)", () => {
    const r = sugerirCategoria("X", null, "computers", null, [cat("Eletronicos")]);
    expect(r?.name).toBe("Eletronicos");
  });

  it("phones → eletronicos (mesmo target que computers)", () => {
    const r = sugerirCategoria("X", null, "phones", null, [cat("Eletronicos")]);
    expect(r?.name).toBe("Eletronicos");
  });

  it("food → mercado (alias de grocery)", () => {
    const r = sugerirCategoria("X", null, "food", null, [cat("Mercado")]);
    expect(r?.name).toBe("Mercado");
  });

  it("API key conhecida mas categoria interna não existe → cai pra próximo nível", () => {
    // home → mapping "casa" não está nas categorias internas → não retorna no passo 1.
    // Sem keywords e sem outro match → null.
    const r = sugerirCategoria("X", null, "home", null, [cat("Outra")]);
    expect(r).toBeNull();
  });

  it("API key case insensitive (HOME funciona como home)", () => {
    const r = sugerirCategoria("X", null, "HOME", null, [cat("Casa")]);
    expect(r?.name).toBe("Casa");
  });

  it("API key com espaços/acentos no comparado também normaliza", () => {
    const r = sugerirCategoria("X", null, "  Home  ", null, [cat("Casa")]);
    expect(r?.name).toBe("Casa");
  });
});

describe("sugerirCategoria — match exato (prioridade 2)", () => {
  it("categoriaOrigem bate nome exato após normalize (acentos)", () => {
    const r = sugerirCategoria("X", null, "Eletrônicos", null, [
      cat("Eletronicos"),
    ]);
    expect(r?.name).toBe("Eletronicos");
  });

  it("categoriaOrigem bate case insensitive", () => {
    const r = sugerirCategoria("X", null, "MODA", null, [cat("Moda")]);
    expect(r?.name).toBe("Moda");
  });

  it("trim aplicado", () => {
    const r = sugerirCategoria("X", null, "  Moda  ", null, [cat("Moda")]);
    expect(r?.name).toBe("Moda");
  });
});

describe("sugerirCategoria — match parcial (prioridade 3)", () => {
  it("categoriaOrigem contém categoria interna", () => {
    const r = sugerirCategoria("X", null, "moda feminina", null, [cat("Moda")]);
    expect(r?.name).toBe("Moda");
  });

  it("categoria interna contém categoriaOrigem", () => {
    const r = sugerirCategoria("X", null, "moda", null, [cat("Moda Praia")]);
    expect(r?.name).toBe("Moda Praia");
  });

  it("partial NÃO casa palavras totalmente diferentes", () => {
    const r = sugerirCategoria("X", null, "esportes", null, [cat("Moda")]);
    expect(r).toBeNull();
  });
});

describe("sugerirCategoria — keyword scoring (prioridade 4)", () => {
  it("título com keyword acima do MIN_SCORE retorna categoria", () => {
    // "smartphone" tem 10 chars → score 10 (>= 4)
    const r = sugerirCategoria(
      "Vendendo smartphone novo",
      null, null, null,
      [cat("Eletronicos", ["smartphone"])],
    );
    expect(r?.name).toBe("Eletronicos");
  });

  it("keyword curta (< 4 chars) não atinge MIN_SCORE sozinha", () => {
    // "pet" tem 3 chars → score 3 (< 4) → ignorado
    const r = sugerirCategoria(
      "Comida pet",
      null, null, null,
      [cat("Pet", ["pet"])],
    );
    expect(r).toBeNull();
  });

  it("múltiplas keywords curtas somam até atingir MIN_SCORE", () => {
    // "pet" (3) + "racao" (5) = 8 ≥ 4
    const r = sugerirCategoria(
      "Vendo racao para pet",
      null, null, null,
      [cat("Pet", ["pet", "racao"])],
    );
    expect(r?.name).toBe("Pet");
  });

  it("word boundary: keyword NÃO casa substring no meio de outra palavra", () => {
    // "casa" não deve casar com "casaco"
    const r = sugerirCategoria(
      "Comprei um casaco bonito",
      null, null, null,
      [cat("Casa", ["casa"])],
    );
    expect(r).toBeNull();
  });

  it("word boundary: keyword casa quando rodeada por pontuação", () => {
    const r = sugerirCategoria(
      "produto-cozinha-novo",
      null, null, null,
      [cat("Cozinha", ["cozinha"])],
    );
    expect(r?.name).toBe("Cozinha");
  });

  it("normalize: acentos no texto comparado com keyword sem acento", () => {
    // "eletrônicos" no título vs keyword "eletronicos"
    const r = sugerirCategoria(
      "Promoção em eletrônicos",
      null, null, null,
      [cat("Eletronicos", ["eletronicos"])],
    );
    expect(r?.name).toBe("Eletronicos");
  });

  it("score concatena título + descrição + categoriaOrigem + nomeLoja", () => {
    // Keyword só na descrição
    const r = sugerirCategoria(
      "Produto X",
      "Ideal para games",
      null, null,
      [cat("Games", ["games"])],
    );
    expect(r?.name).toBe("Games");
  });

  it("score concatena nomeLoja", () => {
    const r = sugerirCategoria(
      "Produto X",
      null, null,
      "Loja de Eletronicos",
      [cat("Eletronicos", ["eletronicos"])],
    );
    expect(r?.name).toBe("Eletronicos");
  });

  it("categoria com maior score vence", () => {
    // "smartphone" (10) na cat Eletronicos vs "pet" (3, abaixo do MIN) na cat Pet
    const r = sugerirCategoria(
      "Smartphone com pet sleeve",
      null, null, null,
      [
        cat("Pet", ["pet"]),
        cat("Eletronicos", ["smartphone"]),
      ],
    );
    expect(r?.name).toBe("Eletronicos");
  });

  it("empate de scores: primeira categoria que atinge o best vence (estável)", () => {
    // Ambas têm keyword "praia" (5) → score 5 cada. bestScore inicia 0,
    // primeira a passar do MIN ganha e empate posterior NÃO substitui
    // (regex usa >, não >=).
    const r = sugerirCategoria(
      "Roupa de praia",
      null, null, null,
      [
        cat("Praia 1", ["praia"]),
        cat("Praia 2", ["praia"]),
      ],
    );
    expect(r?.name).toBe("Praia 1");
  });

  it("keyword vazia (string em branco) é ignorada sem erro", () => {
    const r = sugerirCategoria(
      "smartphone novo",
      null, null, null,
      [cat("Eletronicos", ["", "smartphone"])],
    );
    expect(r?.name).toBe("Eletronicos");
  });

  it("keyword com regex special chars é escapada (não quebra)", () => {
    // Keyword "$50" não deve gerar regex inválida; deve casar literal
    const r = sugerirCategoria(
      "Por apenas $50.00 reais",
      null, null, null,
      [cat("Promo", ["$50.00"])],
    );
    expect(r?.name).toBe("Promo");
  });
});

describe("sugerirCategoria — fallback / inputs degenerados", () => {
  it("todos os inputs null → null", () => {
    const r = sugerirCategoria("", null, null, null, []);
    expect(r).toBeNull();
  });

  it("título vazio + lista de cats vazia → null", () => {
    const r = sugerirCategoria("", null, null, null, [cat("Pet", ["pet"])]);
    expect(r).toBeNull();
  });

  it("nenhuma keyword atinge MIN_SCORE → null", () => {
    const r = sugerirCategoria(
      "Pet curto",
      null, null, null,
      [cat("Pet", ["pet"])],
    );
    expect(r).toBeNull();
  });

  it("API_CATEGORY_MAP tem precedência sobre keyword scoring", () => {
    // categoriaOrigem 'home' bate API_CATEGORY_MAP → Casa, ignora keyword 'eletronicos' no título
    const r = sugerirCategoria(
      "Produto eletronicos",
      null, "home", null,
      [cat("Casa"), cat("Eletronicos", ["eletronicos"])],
    );
    expect(r?.name).toBe("Casa");
  });

  it("categoriaOrigem que NÃO está no API_CATEGORY_MAP mas bate exato vai pelo passo 2", () => {
    const r = sugerirCategoria("X", null, "saude", null, [cat("Saude")]);
    expect(r?.name).toBe("Saude");
  });
});
