import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";

interface FeedbackOptions {
  successMessage?: string;
  errorMessage?: string;
  onSuccessCallback?: () => void;
}

export function useMutationWithFeedback<TData, TError extends Error, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  feedback: FeedbackOptions = {},
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, "mutationFn" | "onSuccess" | "onError">
) {
  const {
    successMessage,
    errorMessage = "Ocorreu um erro. Tente novamente.",
    onSuccessCallback,
  } = feedback;

  return useMutation<TData, TError, TVariables>({
    mutationFn,
    onSuccess: () => {
      if (successMessage) toast.success(successMessage);
      haptics.medium();
      onSuccessCallback?.();
    },
    onError: (error) => {
      toast.error(error.message || errorMessage);
      haptics.error();
    },
    ...options,
  });
}
