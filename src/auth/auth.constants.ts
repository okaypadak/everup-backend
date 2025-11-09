import type { CookieOptions } from 'express';

export const AUTH_COOKIE_NAME = 'everup_auth_token';
const DEFAULT_TOKEN_TTL_SECONDS = 2 * 60 * 60; // 2 saat

const parsePositiveNumber = (value?: string): number | undefined => {
  if (!value) return undefined;
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return undefined;
};

export const getAuthTokenTtlSeconds = (): number => {
  const fromEnv =
    parsePositiveNumber(process.env.JWT_EXPIRES_IN_SECONDS) ??
    parsePositiveNumber(process.env.JWT_EXPIRES_IN) ??
    parsePositiveNumber(process.env.JWT_TTL_SECONDS);

  return fromEnv ?? DEFAULT_TOKEN_TTL_SECONDS;
};

export const buildAuthCookieOptions = (): CookieOptions => {
  const secure =
    process.env.AUTH_COOKIE_SECURE === 'true' ||
    process.env.NODE_ENV === 'production';

  const sameSiteEnv = (process.env.AUTH_COOKIE_SAMESITE ?? '').toLowerCase();
  let sameSite: CookieOptions['sameSite'];
  if (sameSiteEnv === 'lax' || sameSiteEnv === 'strict') {
    sameSite = sameSiteEnv;
  } else if (sameSiteEnv === 'none') {
    sameSite = 'none';
  } else {
    sameSite = secure ? 'none' : 'lax';
  }

  const maxAge = getAuthTokenTtlSeconds() * 1000;

  return {
    httpOnly: true,
    secure,
    sameSite,
    maxAge,
    path: '/',
  };
};
