import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  ForbiddenException 
} from '@nestjs/common';
import { KYCService } from './kyc.service';

@Injectable()
export class KYCGuard implements CanActivate {
  constructor(private readonly kycService: KYCService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Assumes JWT auth is implemented

    if (!user || !user._id) {
      throw new ForbiddenException('User not authenticated');
    }

    const isApproved = await this.kycService.isKYCApproved(user._id);

    if (!isApproved) {
      throw new ForbiddenException('KYC verification required to access this resource');
    }

    return true;
  }
}