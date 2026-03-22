import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const EXCLUDED_PATHS = ['/health', '/docs', '/auth/refresh'];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();

    if (!WRITE_METHODS.includes(req.method)) return next.handle();
    if (EXCLUDED_PATHS.some((p) => req.url.includes(p))) return next.handle();

    const user = req.user;
    const workspaceId = req.headers['x-workspace-id'] || req.params?.workspaceId;

    return next.handle().pipe(
      tap(() => {
        if (user?.sub) {
          this.audit.log({
            workspaceId,
            userId: user.sub,
            action: req.method,
            resource: req.url.split('?')[0],
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          });
        }
      }),
    );
  }
}
