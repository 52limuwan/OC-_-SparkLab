import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // 重写 handleRequest，即使认证失败也不抛出错误
  handleRequest(err: any, user: any) {
    // 如果有用户信息就返回，没有就返回 null
    return user || null;
  }

  // 重写 canActivate，总是返回 true
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch (err) {
      // 忽略认证错误
    }
    return true;
  }
}
