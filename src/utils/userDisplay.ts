const PLACEHOLDER_NAMES = new Set(["user", "usuario"]);

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function isPlaceholderName(name?: string) {
  if (!name) return false;
  return PLACEHOLDER_NAMES.has(normalizeName(name));
}

export function getEmailPrefix(email?: string) {
  if (!email) return "";
  return email.split("@")[0]?.trim() || "";
}

export function getPreferredFirstName(name?: string, email?: string) {
  const trimmedName = name?.trim();
  if (trimmedName && !isPlaceholderName(trimmedName)) {
    return trimmedName.split(/\s+/)[0];
  }

  const emailPrefix = getEmailPrefix(email);
  if (emailPrefix) return emailPrefix;

  return "Usuário";
}
