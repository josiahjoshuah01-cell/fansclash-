export function mapPlaceBetError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("insufficient")) {
    return "Insufficient balance for this stake. Add funds to your wallet first.";
  }

  if (lower.includes("not open") || lower.includes("not open for betting")) {
    return "This event is already locked for betting.";
  }

  return message;
}

export function mapOtpError(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("unsupported phone provider") ||
    lower.includes("phone_provider_disabled") ||
    lower.includes("phone provider")
  ) {
    return "SMS sign-in is not configured yet. Enable Phone auth and an SMS provider in the FansClash Supabase dashboard (Authentication → Providers → Phone).";
  }

  if (lower.includes("expired") || lower.includes("otp_expired")) {
    return "That code has expired. Request a new one.";
  }

  if (lower.includes("invalid") || lower.includes("token")) {
    return "Invalid code. Check the 6 digits and try again.";
  }

  return message;
}

export function mapPhoneValidationError(): string {
  return "Enter a valid Kenyan mobile number (9 digits after +254).";
}
