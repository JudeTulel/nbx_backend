import { CanActivate, ExecutionContext } from '@nestjs/common';
import { KYCService } from './kyc.service';
export declare class KYCGuard implements CanActivate {
    private readonly kycService;
    constructor(kycService: KYCService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
