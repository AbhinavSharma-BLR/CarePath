const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID;

/**
 * Safely normalize Indian phone numbers to format 91XXXXXXXXXX expected by MSG91
 */
export function normalizeIndianPhone(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`;
  }
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return digitsOnly;
  }
  return digitsOnly;
}

export interface SendOTPResult {
  success: boolean;
  isMock: boolean;
  message: string;
  debugOtp?: string;
}

/**
 * Security Guard for Development OTP Mode
 */
export function isDevOtpModeEnabled(): boolean {
  return (
    process.env.ENABLE_DEV_OTP === 'true' ||
    process.env.NODE_ENV !== 'production' ||
    !process.env.MSG91_AUTH_KEY ||
    !process.env.MSG91_TEMPLATE_ID
  );
}

export async function sendOTP(phone: string, otp: string): Promise<SendOTPResult> {
  const formattedPhone = normalizeIndianPhone(phone);
  const devOtpEnabled = isDevOtpModeEnabled();

  // If MSG91 credentials are not configured or Dev OTP mode is active, use simulated OTP mode
  if (!MSG91_AUTH_KEY || !MSG91_TEMPLATE_ID || devOtpEnabled) {
    console.log('\n==================================================');
    console.log(`[DEV OTP] Mobile: +${formattedPhone}`);
    console.log(`[DEV OTP] Code: ${otp}`);
    console.log(`[DEV OTP] Expires in: 300 seconds`);
    console.log('==================================================\n');

    return {
      success: true,
      isMock: true,
      message: 'OTP sent in Development OTP Mode',
      debugOtp: otp,
    };
  }

  // Production MSG91 Request
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const url = `https://api.msg91.com/api/v5/otp?template_id=${MSG91_TEMPLATE_ID}&mobile=${formattedPhone}&otp=${otp}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        authkey: MSG91_AUTH_KEY,
        'content-type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      return { success: true, isMock: false, message: 'OTP sent successfully via MSG91' };
    }

    const errorText = await res.text();
    console.error(`❌ [MSG91 API ERROR] Status ${res.status}: ${errorText}`);

    return {
      success: false,
      isMock: false,
      message: 'OTP service temporarily unavailable. Please try again.',
    };
  } catch (err: any) {
    console.error('❌ [MSG91 EXCEPTION]', err?.message || err);
    return {
      success: false,
      isMock: false,
      message: 'Unable to reach OTP service. Please try again later.',
    };
  }
}
