import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { extractTokenFromRequest } from './utils/auth-token.util';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const token = extractTokenFromRequest(request);
    if (!token) {
      throw new UnauthorizedException('Authorization bilgisi alınamadı');
    }

    // 2. JWT doğrula ve kullanıcıyı ekle
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      request.user = decoded;
    } catch (err) {
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş token');
    }

    // 3. @Roles() decorator'undan beklenen rolleri al
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      'roles',
      [context.getHandler(), context.getClass()]
    );

    // Eğer rol kontrolü istenmiyorsa sadece JWT yeterli
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 4. Kullanıcı rolünü kontrol et (case-insensitive)
    const userRole = (decoded.role || '').toLowerCase();
    const allowedRoles = requiredRoles.map(role => role.toLowerCase());

    if (!userRole || !allowedRoles.includes(userRole)) {
      throw new ForbiddenException(`Rol yetkisi yok: Gerekli → ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
