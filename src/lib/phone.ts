const KENYAN_MOBILE_DIGITS = /^[17]\d{8}$/;

/** Strip to local 9-digit mobile number (without +254). */
export function normalizeKenyanDigits(input: string): string {
  const digits = input.replace(/\D/g, "");

  if (digits.startsWith("254") && digits.length === 12) {
    return digits.slice(3);
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return digits.slice(1);
  }

  return digits;
}

export function isValidKenyanPhone(digits: string): boolean {
  return KENYAN_MOBILE_DIGITS.test(digits);
}

export function toE164KenyanPhone(digits: string): string {
  return `+254${digits}`;
}

export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
  ) {
    age -= 1;
  }

  return age;
}

export function isAtLeast18(dateOfBirth: Date): boolean {
  return calculateAge(dateOfBirth) >= 18;
}
