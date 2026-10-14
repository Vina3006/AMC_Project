// The password rules. The SAME rules are checked again on the server
// (server/src/utils/passwordRules.js), because the browser can be bypassed.

export const passwordRules = [
  { id: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { id: "upper", label: "One uppercase letter (A to Z)", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter (a to z)", test: (p) => /[a-z]/.test(p) },
  { id: "number", label: "One number (0 to 9)", test: (p) => /\d/.test(p) },
  { id: "symbol", label: "One special character, like ! @ # $", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

// Passwords that start with one of these words are guessed first by attackers
// and show up in almost every data breach list.
const COMMON_STARTS = [
  "password", "qwerty", "welcome", "letmein", "iloveyou",
  "admin", "changeme", "abcdef", "login", "master",
];

// Returns a message when the password is a bad idea, otherwise null.
function weakPasswordProblem(password, context = {}) {
  const lettersOnly = password.toLowerCase().replace(/[^a-z]/g, "");

  if (COMMON_STARTS.some((word) => lettersOnly.startsWith(word))) {
    return "This password is too common. Please choose something less guessable.";
  }
  if (/(.)\1{3,}/.test(password)) {
    return "Please avoid repeating the same character many times.";
  }

  const lower = password.toLowerCase();
  const emailName = String(context.email || "").split("@")[0].toLowerCase();
  const firstName = String(context.name || "").trim().split(/\s+/)[0].toLowerCase();
  if ((emailName.length >= 3 && lower.includes(emailName)) || (firstName.length >= 3 && lower.includes(firstName))) {
    return "Your password should not contain your name or email.";
  }
  return null;
}

// Returns the first problem as a message, or null when the password is fine.
export function validatePassword(password, context = {}) {
  for (const rule of passwordRules) {
    if (!rule.test(password)) return `Password needs: ${rule.label.toLowerCase()}.`;
  }
  return weakPasswordProblem(password, context);
}