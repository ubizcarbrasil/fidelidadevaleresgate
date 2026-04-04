import { useState, useCallback } from "react";

interface ConfirmState {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmLabel?: string;
  variant?: "destructive" | "default";
}

const INITIAL: ConfirmState = {
  open: false,
  title: "",
  description: "",
  onConfirm: () => {},
};

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmState>(INITIAL);

  const confirm = useCallback(
    (options: Omit<ConfirmState, "open">) => {
      setState({ ...options, open: true });
    },
    [],
  );

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  return { state, confirm, close };
}
