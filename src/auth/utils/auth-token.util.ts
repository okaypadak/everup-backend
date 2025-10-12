import type { Request } from 'express';
import { AUTH_COOKIE_NAME } from '../../common/constants/auth.constants';

type HeadersLike = Record<string, unknown> | undefined;

type RequestLike = Partial<Request> & {
  headers?: HeadersLike;
  cookies?: Record<string, string>;
};

const getHeaderValue = (headers: HeadersLike, key: string): string | undefined => {
  if (!headers) return undefined;
  const direct = headers[key];
  if (typeof direct === 'string') {
    return direct;
  }

  const lowerKey = key.toLowerCase();
  for (const headerName of Object.keys(headers)) {
    if (headerName.toLowerCase() === lowerKey) {
      const value = headers[headerName];
      if (typeof value === 'string') {
        return value;
      }
      if (Array.isArray(value)) {
        return value[0];
      }
    }
  }
  return undefined;
};

const parseCookieHeader = (cookieHeader?: string): Record<string, string> => {
  if (!cookieHeader) return {};

  return cookieHeader.split(';').reduce<Record<string, string>>((acc, raw) => {
    const [name, ...rest] = raw.split('=');
    if (!name) return acc;
    const value = rest.join('=').trim();
    if (!value) return acc;
    acc[name.trim()] = decodeURIComponent(value);
    return acc;
  }, {});
};

const extractBearerToken = (authorizationHeader?: string): string | undefined => {
  if (!authorizationHeader || typeof authorizationHeader !== 'string') {
    return undefined;
  }
  if (!authorizationHeader.startsWith('Bearer ')) {
    return undefined;
  }
  const token = authorizationHeader.slice(7).trim();
  return token.length > 0 ? token : undefined;
};

export const extractTokenFromRequest = (request: RequestLike): string | undefined => {
  const authorization = getHeaderValue(request.headers, 'authorization');
  const fromHeader = extractBearerToken(authorization);
  if (fromHeader) {
    return fromHeader;
  }

  const fromCookies = request.cookies?.[AUTH_COOKIE_NAME];
  if (fromCookies && typeof fromCookies === 'string' && fromCookies.length > 0) {
    return fromCookies;
  }

  const cookieHeader = getHeaderValue(request.headers, 'cookie');
  if (cookieHeader) {
    const parsed = parseCookieHeader(cookieHeader);
    const candidate = parsed[AUTH_COOKIE_NAME];
    if (candidate) {
      return candidate;
    }
  }

  return undefined;
};
