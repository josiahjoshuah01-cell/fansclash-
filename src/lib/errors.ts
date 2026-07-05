import { MIN_PASSWORD_LENGTH } from "@/lib/email";

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

  if (lower.includes("email rate limit") || lower.includes("over_email_send_rate_limit")) {
    return "Too many emails sent. Wait a few minutes and try again.";
  }

  if (lower.includes("signup") && lower.includes("disabled")) {
    return "New sign-ups are disabled. Contact support if you need access.";
  }

  if (lower.includes("expired") || lower.includes("otp_expired")) {
    return "That code has expired. Request a new one.";
  }

  if (lower.includes("invalid") || lower.includes("token")) {
    return "Invalid code. Check the digits and try again.";
  }

  return message;
}

export function mapEmailValidationError(): string {
  return "Enter a valid email address.";
}

export function mapPasswordValidationError(): string {
  return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
}

export function mapPasswordAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }

  if (lower.includes("email not confirmed")) {
    return "Confirm your email first — check your inbox for the verification link.";
  }

  if (lower.includes("user already registered")) {
    return "An account with this email already exists. Sign in instead.";
  }

  if (lower.includes("signup") && lower.includes("disabled")) {
    return "New sign-ups are disabled. Contact support if you need access.";
  }

  if (lower.includes("weak") || lower.includes("password")) {
    return "Choose a stronger password (at least 8 characters).";
  }

  return message;
}

export function mapPhoneValidationError(): string {
  return "Enter a valid Kenyan mobile number (9 digits after +254).";
}
