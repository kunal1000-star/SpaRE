import { createAuthClient } from '@neon/auth';

const authUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NEON_AUTH_BASE_URL) 
  ? import.meta.env.VITE_NEON_AUTH_BASE_URL 
  : 'https://ep-wandering-band-bdibtiqf.neonauth.c-8.us-east-2.aws.neon.tech/neondb/auth';

export const auth = createAuthClient(authUrl);

/**
 * Sign in with email and password via Neon Managed Auth
 */
export const signInWithEmail = async (email, password) => {
  try {
    const res = await auth.signIn.email({ email, password });
    if (res?.error) {
      const errMsg = res.error.message || 'Invalid email or password.';
      const isVerification = errMsg.toLowerCase().includes('verification') || res.error.status === 403;
      return { 
        success: false, 
        error: errMsg, 
        requiresVerification: isVerification,
        email 
      };
    }
    const user = res?.data?.user;
    if (!user?.id) {
      return { success: false, error: 'Sign in succeeded but no authenticated user session was returned. Please try again.' };
    }
    try {
      localStorage.setItem('spare_auth_user', JSON.stringify(user));
    } catch {}
    return { success: true, user, data: res?.data };
  } catch (err) {
    const errMsg = err.message || 'Sign in failed. Please check credentials.';
    const isVerification = errMsg.toLowerCase().includes('verification');
    return { 
      success: false, 
      error: errMsg, 
      requiresVerification: isVerification,
      email 
    };
  }
};

/**
 * Sign up with email, password and name via Neon Managed Auth
 */
export const signUpWithEmail = async (email, password, name) => {
  try {
    const res = await auth.signUp.email({
      email,
      password,
      name: name?.trim() || email.split('@')[0],
    });
    if (res?.error) {
      const errMsg = res.error.message || 'Registration failed.';
      const isVerification = errMsg.toLowerCase().includes('verification') || res.error.status === 403;
      return { 
        success: false, 
        error: errMsg, 
        requiresVerification: isVerification,
        email 
      };
    }
    const user = res?.data?.user;
    if (!user?.id) {
      return { success: false, error: 'Account was created but no authenticated user session was returned. Please sign in again.' };
    }
    try {
      localStorage.setItem('spare_auth_user', JSON.stringify(user));
    } catch {}
    return { success: true, user, data: res?.data };
  } catch (err) {
    const errMsg = err.message || 'Registration failed. Please try again.';
    const isVerification = errMsg.toLowerCase().includes('verification');
    return { 
      success: false, 
      error: errMsg, 
      requiresVerification: isVerification,
      email 
    };
  }
};

/**
 * Verify Email with 6-digit OTP code sent to user's email
 */
export const verifyEmailOtp = async (email, otp) => {
  try {
    const res = await auth.emailOtp.verifyEmail({
      email: email.trim(),
      otp: otp.trim(),
    });
    if (res?.error) {
      return { success: false, error: res.error.message || 'Invalid or expired verification code.' };
    }
    const user = res?.data?.user;
    if (!user?.id) {
      return { success: false, error: 'Email was verified but no authenticated user session was returned. Please sign in again.' };
    }
    try {
      localStorage.setItem('spare_auth_user', JSON.stringify(user));
    } catch {}
    return { success: true, user, data: res?.data };
  } catch (err) {
    return { success: false, error: err.message || 'Verification failed. Please check the code.' };
  }
};

/**
 * Resend verification OTP code to user's email
 */
export const resendVerificationOtp = async (email) => {
  try {
    const res = await auth.emailOtp.sendVerificationOtp({
      email: email.trim(),
      type: 'email-verification',
    });
    if (res?.error) {
      return { success: false, error: res.error.message || 'Failed to resend code.' };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || 'Could not resend verification code.' };
  }
};

/**
 * Social sign in (Google)
 */
export const signInWithSocial = async (provider = 'google') => {
  try {
    const res = await auth.signIn.social({ 
      provider,
      callbackURL: typeof window !== 'undefined' ? window.location.origin : undefined
    });
    return { success: true, res };
  } catch (err) {
    return { success: false, error: err.message || `Failed to sign in with ${provider}.` };
  }
};

/**
 * Sign out user and clear stored session
 */
export const signOutUser = async () => {
  try {
    await auth.signOut();
  } catch (err) {
    console.warn('Sign out error:', err.message);
  } finally {
    try {
      localStorage.removeItem('spare_auth_user');
      sessionStorage.removeItem('spare_guest_mode');
    } catch {}
  }
  return { success: true };
};

/**
 * Helper to get current user session safely
 */
export const getCurrentSession = async () => {
  try {
    const res = await auth.getSession();
    if (res?.data?.session?.user) {
      const user = res.data.session.user;
      try {
        localStorage.setItem('spare_auth_user', JSON.stringify(user));
      } catch {}
      return user;
    }
  } catch (err) {
    console.warn('Neon Auth session check failed:', err.message);
  }

  // Never treat localStorage as authentication. It is only a display/cache
  // value and may belong to a previous account on this browser.
  try {
    localStorage.removeItem('spare_auth_user');
  } catch {}
  return null;
};
