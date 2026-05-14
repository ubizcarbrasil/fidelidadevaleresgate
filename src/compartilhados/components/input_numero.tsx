import { forwardRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

interface Props
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: number | null | undefined;
  onChange: (v: number) => void;
  defaultOnEmpty?: number;
}

/**
 * Input numérico controlado que evita o bug de "0" persistente:
 * - mantém string local (permite vazio durante edição)
 * - remove zeros à esquerda
 * - ao focar, seleciona todo o conteúdo
 * - ao desfocar, normaliza para número (defaultOnEmpty se vazio)
 */
const InputNumero = forwardRef<HTMLInputElement, Props>(function InputNumero(
  { value, onChange, defaultOnEmpty = 0, onFocus, onBlur, ...rest },
  ref,
) {
  const [texto, setTexto] = useState<string>(
    value === null || value === undefined ? "" : String(value),
  );

  useEffect(() => {
    const externo = value === null || value === undefined ? "" : String(value);
    setTexto((atual) => {
      const numAtual = atual === "" ? defaultOnEmpty : Number(atual);
      if (numAtual === Number(externo)) return atual;
      return externo;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Input
      {...rest}
      ref={ref}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={texto}
      onFocus={(e) => {
        e.currentTarget.select();
        onFocus?.(e);
      }}
      onChange={(e) => {
        const limpo = e.target.value.replace(/[^0-9]/g, "");
        const semZero = limpo.replace(/^0+(?=\d)/, "");
        setTexto(semZero);
        if (semZero === "") {
          onChange(defaultOnEmpty);
        } else {
          onChange(Number(semZero));
        }
      }}
      onBlur={(e) => {
        if (texto === "") {
          setTexto(String(defaultOnEmpty));
          onChange(defaultOnEmpty);
        }
        onBlur?.(e);
      }}
    />
  );
});

export default InputNumero;