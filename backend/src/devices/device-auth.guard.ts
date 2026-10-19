import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { User } from '../entities/user.entity';
import { DevicesService } from './devices.service';

@Injectable()
export class DeviceAuthGuard implements CanActivate {
  constructor(private readonly devices: DevicesService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const header: string | undefined = req.headers.authorization;
    // EventSource cannot set headers, so SSE clients may pass ?token=
    const token = header?.startsWith('Bearer ') ? header.slice(7) : req.query?.token;
    if (typeof token !== 'string' || !token) throw new UnauthorizedException();

    const user = await this.devices.findByToken(token);
    if (!user) throw new UnauthorizedException();
    req.user = user;
    return true;
  }
}

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): User => ctx.switchToHttp().getRequest().user,
);
