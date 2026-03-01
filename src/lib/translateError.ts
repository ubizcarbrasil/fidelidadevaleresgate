const ERROR_MAP: Record<string, string> = {
  "User already registered": "Este e-mail já está cadastrado",
  "Invalid login credentials": "E-mail ou senha incorretos",
  "Email not confirmed": "E-mail ainda não confirmado",
  "Token has expired or is invalid": "Código expirado ou inválido",
  "token has expired or is invalid": "Código expirado ou inválido",
  "User not found": "Usuário não encontrado",
  "Password should be at least 6 characters": "A senha deve ter pelo menos 6 caracteres",
  "Signup requires a valid password": "Informe uma senha válida",
  "Email rate limit exceeded": "Muitas tentativas. Aguarde um momento",
  "For security purposes, you can only request this after": "Por segurança, aguarde antes de tentar novamente",
  "new row violates row-level security policy": "Permissão negada para esta operação",
  "Unable to validate email address: invalid format": "Formato de e-mail inválido",
  "A user with this email address has already been registered": "Este e-mail já está cadastrado",
};

export function translateError(message: string): string {
  if (!message) return "Ocorreu um erro inesperado";

  // Exact match
  if (ERROR_MAP[message]) return ERROR_MAP[message];

  // Partial match
  for (const [key, translation] of Object.entries(ERROR_MAP)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return translation;
    }
  }

  return message;
}
