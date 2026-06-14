/**
 * sanitizar_landing — defesa em profundidade contra React error #31
 * (render de objeto cru). Aceita só shapes esperados, descarta o resto.
 *
 * Bug aqui = passa undefined/null/objeto sem title → JSX explode com
 * "Objects are not valid as a React child", strings vazias renderizadas
 * como `<li></li>` quebram layout.
 */
import { describe, it, expect } from "vitest";
import {
  sanitizarStrings,
  sanitizarBenefits,
  sanitizarMetrics,
  sanitizarTestimonials,
  sanitizarFaq,
  sanitizarScreenshots,
} from "../sanitizar_landing";

describe("sanitizarStrings", () => {
  it("array de strings: filtra não-string e vazias", () => {
    expect(sanitizarStrings(["a", "", "b", null, 123, "c"])).toEqual(["a", "b", "c"]);
  });

  it("string só whitespace: descarta", () => {
    expect(sanitizarStrings(["   ", "x"])).toEqual(["x"]);
  });

  it("não-array: []", () => {
    expect(sanitizarStrings("not array")).toEqual([]);
    expect(sanitizarStrings(null)).toEqual([]);
    expect(sanitizarStrings(undefined)).toEqual([]);
  });
});

describe("sanitizarBenefits", () => {
  it("string direta: aceita", () => {
    expect(sanitizarBenefits(["benefit A", "benefit B"])).toEqual(["benefit A", "benefit B"]);
  });

  it("objeto { title }: aceita", () => {
    expect(sanitizarBenefits([{ title: "X" }])).toEqual([{ title: "X" }]);
  });

  it("objeto { title, description, icon }: preserva opcionais", () => {
    const input = [{ title: "X", description: "desc", icon: "star" }];
    expect(sanitizarBenefits(input)).toEqual([{ title: "X", description: "desc", icon: "star" }]);
  });

  it("objeto sem title: descarta", () => {
    expect(sanitizarBenefits([{ description: "desc" }])).toEqual([]);
  });

  it("mix válido + inválido: filtra", () => {
    expect(sanitizarBenefits([
      "OK",
      { title: "Y" },
      { description: "no title" },
      null,
      42,
    ])).toEqual(["OK", { title: "Y" }]);
  });

  it("não-array: []", () => {
    expect(sanitizarBenefits({ foo: "bar" })).toEqual([]);
  });
});

describe("sanitizarMetrics", () => {
  it("value + label ambos string: aceita", () => {
    expect(sanitizarMetrics([{ value: "50%", label: "Conversão" }])).toEqual([
      { value: "50%", label: "Conversão" },
    ]);
  });

  it("value vazio: descarta", () => {
    expect(sanitizarMetrics([{ value: "", label: "x" }])).toEqual([]);
  });

  it("label ausente: descarta", () => {
    expect(sanitizarMetrics([{ value: "x" }])).toEqual([]);
  });

  it("array misto: filtra os inválidos", () => {
    expect(sanitizarMetrics([
      { value: "100", label: "OK" },
      "string solta",
      { value: "200", label: "Outra" },
    ])).toEqual([
      { value: "100", label: "OK" },
      { value: "200", label: "Outra" },
    ]);
  });
});

describe("sanitizarTestimonials", () => {
  it("name + quote obrigatórios", () => {
    expect(sanitizarTestimonials([{ name: "Maria", quote: "Top!" }])).toEqual([
      { name: "Maria", quote: "Top!" },
    ]);
  });

  it("role + avatar_url opcionais preservados", () => {
    const input = [{ name: "Ana", quote: "Boa", role: "Cliente", avatar_url: "//x" }];
    expect(sanitizarTestimonials(input)).toEqual(input);
  });

  it("sem quote: descarta", () => {
    expect(sanitizarTestimonials([{ name: "Sem Quote" }])).toEqual([]);
  });

  it("avatar_url number: NÃO preserva (string only)", () => {
    expect(sanitizarTestimonials([{ name: "X", quote: "Y", avatar_url: 123 }])).toEqual([
      { name: "X", quote: "Y" },
    ]);
  });
});

describe("sanitizarFaq", () => {
  it("question + answer ambos string não-vazia", () => {
    expect(sanitizarFaq([{ question: "Q?", answer: "A" }])).toEqual([
      { question: "Q?", answer: "A" },
    ]);
  });

  it("answer vazio: descarta", () => {
    expect(sanitizarFaq([{ question: "Q?", answer: "" }])).toEqual([]);
  });
});

describe("sanitizarScreenshots", () => {
  it("url obrigatória", () => {
    expect(sanitizarScreenshots([{ url: "//x" }])).toEqual([{ url: "//x" }]);
  });

  it("caption opcional preservada", () => {
    expect(sanitizarScreenshots([{ url: "//x", caption: "img1" }])).toEqual([
      { url: "//x", caption: "img1" },
    ]);
  });

  it("sem url: descarta", () => {
    expect(sanitizarScreenshots([{ caption: "no url" }])).toEqual([]);
  });

  it("não-array: []", () => {
    expect(sanitizarScreenshots(null)).toEqual([]);
  });
});
