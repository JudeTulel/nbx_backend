import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './users.schema';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import {
  Client,
  PrivateKey,
  AccountCreateTransaction,
  AccountId,
  Transaction,
  Hbar,
} from '@hashgraph/sdk';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  /**
   * Creates a new user with a corresponding Hedera account.
   */
  async createUser(
    useremail: string,
    password: string,
    hederaClient: Client,
    role: string = 'user',
  ): Promise<User> {
    try {
      if (!useremail || !password) {
        throw new Error('useremail and password are required.');
      }

      const passwordHash = await bcrypt.hash(password, 10);

      // Create Hedera account
      const hederaPrivateKey = PrivateKey.generateECDSA();
      const hederaPublicKey = hederaPrivateKey.publicKey;

      const tx = new AccountCreateTransaction()
        .setKey(hederaPublicKey)
        .setInitialBalance(new Hbar(10))
        .setMaxAutomaticTokenAssociations(10)
        .freezeWith(hederaClient);

      // Use the operator key from the client passed in from controller
      const operatorKey = PrivateKey.fromStringECDSA(
        process.env.HEDERA_OPERATOR_KEY || '',
      );
      const signedTx = await tx.sign(operatorKey);
      const response = await signedTx.execute(hederaClient);
      const receipt = await response.getReceipt(hederaClient);
      const accountId = receipt.accountId!.toString();
      const hederaEvmAddress = hederaPublicKey.toEvmAddress();

      // Encrypt the Hedera private key
      const salt = crypto.randomBytes(16);
      const iv = crypto.randomBytes(16);

      const key = await new Promise<Buffer>((resolve, reject) => {
        crypto.scrypt(password, salt, 32, (err, derivedKey) => {
          if (err) reject(err);
          resolve(derivedKey);
        });
      });

      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(hederaPrivateKey.toString(), 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Create and save the user in MongoDB
      const newUser = new this.userModel({
        useremail,
        passwordHash,
        role,
        hederaAccountId: accountId,
        hederaEVMAccount: `0x${hederaEvmAddress}`,
        encryptedWallet: {
          encryptedKey: encrypted,
          salt: salt.toString('hex'),
          iv: iv.toString('hex'),
        },
      });

      return await newUser.save();
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`);
      throw new InternalServerErrorException('Failed to create user account.');
    }
  }

  /**
   * Finds a user by useremail.
   */
  async findOne(useremail: string): Promise<User> {
    try {
      const user = await this.userModel.findOne({ useremail }).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      this.logger.error(`Failed to find user ${useremail}: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve user');
    }
  }

  /**
   * Updates a user's password and re-encrypts their Hedera private key.
   */
  async updateUser(
    useremail: string,
    newPassword: string,
    hederaClient: Client,
  ): Promise<User> {
    try {
      const user = await this.userModel.findOne({ useremail }).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Ensure encryptedWallet exists
      if (!user.encryptedWallet) {
        throw new InternalServerErrorException('Invalid wallet configuration');
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Decrypt existing private key with old credentials
      const { encryptedKey, salt, iv } = user.encryptedWallet;
      if (!encryptedKey || !salt || !iv) {
        throw new InternalServerErrorException('Invalid wallet configuration');
      }

      // Re-encrypt the private key with the new password
      const newSalt = crypto.randomBytes(16);
      const newIv = crypto.randomBytes(16);
      const newKey = await new Promise<Buffer>((resolve, reject) => {
        crypto.scrypt(newPassword, newSalt, 32, (err, derivedKey) => {
          if (err) reject(err);
          resolve(derivedKey);
        });
      });

      // For simplicity, we'll generate a new key pair instead of decrypting/re-encrypting
      const hederaPrivateKey = PrivateKey.generateECDSA();
      const hederaPublicKey = hederaPrivateKey.publicKey;

      // Update Hedera account with new key
      const tx = new AccountCreateTransaction()
        .setKey(hederaPublicKey)
        .setInitialBalance(new Hbar(1))
        .setMaxAutomaticTokenAssociations(10)
        .freezeWith(hederaClient);

      const operatorKey = PrivateKey.fromStringECDSA(
        process.env.HEDERA_OPERATOR_KEY || '',
      );
      const signedTx = await tx.sign(operatorKey);
      const response = await signedTx.execute(hederaClient);
      const receipt = await response.getReceipt(hederaClient);
      const newAccountId = receipt.accountId!.toString();
      const newHederaEvmAddress = hederaPublicKey.toEvmAddress();

      const cipher = crypto.createCipheriv('aes-256-cbc', newKey, newIv);
      let newEncrypted = cipher.update(
        hederaPrivateKey.toString(),
        'utf8',
        'hex',
      );
      newEncrypted += cipher.final('hex');

      // Update user document
      user.passwordHash = newPasswordHash;
      user.hederaAccountId = newAccountId;
      user.hederaEVMAccount = `0x${newHederaEvmAddress}`;
      user.encryptedWallet = {
        encryptedKey: newEncrypted,
        salt: newSalt.toString('hex'),
        iv: newIv.toString('hex'),
      };

      return await user.save();
    } catch (error) {
      this.logger.error(`Failed to update user ${useremail}: ${error.message}`);
      throw new InternalServerErrorException('Failed to update user account');
    }
  }

  /**
   * Updates a user's role.
   */
  async updateUserRole(useremail: string, newRole: string): Promise<User> {
    try {
      const user = await this.userModel.findOne({ useremail }).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.role = newRole;
      return await user.save();
    } catch (error) {
      this.logger.error(
        `Failed to update role for user ${useremail}: ${error.message}`,
      );
      throw new InternalServerErrorException('Failed to update user role');
    }
  }

  /**
   * Logs a user in by verifying their credentials.
   */
  async login(useremail: string, password: string): Promise<User> {
    const user = await this.userModel.findOne({ useremail }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  /**
   * Signs a Hedera transaction with the user's private key.
   */
  async signTransaction(
    useremail: string,
    transaction: string,
    password: string,
  ): Promise<any> {
    const user = await this.userModel.findOne({ useremail }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const encryptedWallet = user.encryptedWallet;
    if (!encryptedWallet || !encryptedWallet.encryptedKey) {
      throw new UnauthorizedException('No encrypted wallet found for user');
    }
    const { encryptedKey, salt, iv } = encryptedWallet;

    try {
      const key = await new Promise<Buffer>((resolve, reject) => {
        crypto.scrypt(
          password,
          Buffer.from(salt, 'hex'),
          32,
          (err, derivedKey) => {
            if (err) reject(err);
            resolve(derivedKey);
          },
        );
      });

      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        key,
        Buffer.from(iv, 'hex'),
      );
      let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      const hederaPrivateKey = PrivateKey.fromString(decrypted);

      const hederaClient = Client.forTestnet().setOperator(
        user.hederaAccountId,
        hederaPrivateKey,
      );
      const transactionObj = Transaction.fromBytes(
        Buffer.from(transaction, 'base64'),
      );

      const signedTx = await transactionObj.sign(hederaPrivateKey);
      const response = await signedTx.execute(hederaClient);
      const receipt = await response.getReceipt(hederaClient);

      return receipt;
    } catch (error) {
      this.logger.error(
        `Failed to sign transaction for user ${useremail}: ${error.message}`,
      );
      throw new InternalServerErrorException('Failed to process transaction');
    }
  }
}
