import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsString,Matches,IsIn, IsBoolean } from 'class-validator';
export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  useremail: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString({ message: 'Hedera account ID must be a string' })
  @IsNotEmpty({ message: 'Hedera account ID is required' })
  @Matches(/^\d+\.\d+\.\d+$/, { 
    message: 'Invalid Hedera account ID format. Expected format: 0.0.12345' 
  })
  accountId: string;

  @IsOptional()
  @IsString()
  @IsIn(['investor', 'company', 'auditor'], { 
    message: 'Role must be either investor, company, or auditor'
  })
  role?: string; 

  @IsOptional()
  @IsBoolean({ message: 'isKYC must be a boolean value' })
  isKYC: boolean;

}
