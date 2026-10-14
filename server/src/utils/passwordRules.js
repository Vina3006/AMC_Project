// The same password rules as the React form. The server checks them again
// because anyone can skip the browser and send a request directly.

const rules = [
  { label: 'at least 8 characters', test: (p) => p.length >= 8 },
  { label: 'one uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'one lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'one number', test: (p) => /\d/.test(p) },
  { label: 'one special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const COMMON_STARTS = [
  'password', 'qwerty', 'welcome', 'letmein', 'iloveyou',
  'admin', 'changeme', 'abcdef', 'login', 'master',
];

// Returns a message when the password is not acceptable, otherwise null.
exports.validatePassword = (password, context = {}) => {
  if (typeof password !== 'string') return 'Password is required';
  if (password.length > 64) return 'Password must be 64 characters or fewer';

  for (const rule of rules) {
    if (!rule.test(password)) return `Password needs ${rule.label}`;
  }

  const lettersOnly = password.toLowerCase().replace(/[^a-z]/g, '');
  if (COMMON_STARTS.some((word) => lettersOnly.startsWith(word))) {
    return 'This password is too common. Please choose a less guessable one';
  }
  if (/(.)\1{3,}/.test(password)) {
    return 'Please avoid repeating the same character many times';
  }

  const lower = password.toLowerCase();
  const emailName = String(context.email || '').split('@')[0].toLowerCase();
  const firstName = String(context.name || '').trim().split(/\s+/)[0].toLowerCase();
  if ((emailName.length >= 3 && lower.includes(emailName)) || (firstName.length >= 3 && lower.includes(firstName))) {
    return 'Your password should not contain your name or email';
  }
  return null;
};