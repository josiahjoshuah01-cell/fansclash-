const KENYAN_MSISDN = /^254[17]\d{8}$/;

/** Internal placeholders — never show as a verified M-Pesa number. */
const PLACEHOLDER_PHONE = /^(admin-|user-|placeholder-)/i;

export function isVerifiedMsisdn(phone: string | null | undefined): phone is string {
  if (!phone) return false;
  const trimmed = phone.trim();
  if (!trimmed || PLACEHOLDER_PHONE.test(trimmed)) return false;

  const digits = trimmed.replace(/\D/g, "");
  if (PLACEHOLDER_PHONE.test(digits)) return false;

  if (digits.startsWith("254") && digits.length === 12) {
    return KENYAN_MSISDN.test(digits);
  }

  if (digits.length === 9 && /^[17]\d{8}$/.test(digits)) {
    return true;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return KENYAN_MSISDN.test(`254${digits.slice(1)}`);
  }

  return false;
}

export function formatVerifiedMsisdn(phone: string | null | undefined): string {
  if (!isVerifiedMsisdn(phone)) {
    return "Not set";
  }

  const digits = phone.replace(/\D/g, "");
  const msisdn = digits.startsWith("254") ? digits : `254${digits}`;
  return `+${msisdn.slice(0, 3)} ${msisdn.slice(3)}`;
}
