/** Same rule as the mobile sign-up form and the backend's change-password. */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return "Use at least 8 characters.";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) return "Use both lowercase and uppercase letters.";
  if (!/\d/.test(password)) return "Include at least one number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Include at least one symbol, such as ! or #.";
  return null;
}
