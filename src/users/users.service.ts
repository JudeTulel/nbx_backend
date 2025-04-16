// user.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Client, PrivateKey, AccountCreateTransaction, EvmAddress, AccountId, Transaction } from '@hashgraph/sdk';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async createUser(username: string, password: string, client: Client) {
    const passwordHash = await bcrypt.hash(password, 10);

    // Create Hedera account
    const privateKey = PrivateKey.generateECDSA();
  const publicKey = privateKey.publicKey;

    const tx = new AccountCreateTransaction()
      .setKey(publicKey)
      .setInitialBalance(10)
      .setMaxAutomaticTokenAssociations(10);

    const response = await tx.execute(client);
    const receipt = await response.getReceipt(client);
    const accountId = receipt.accountId!.toString();
    // Getting evm adress
    const getEVMddress = (accountId: string) => {
     let accID = AccountId.fromString(accountId);
     const HederaEVMAddress =  accID.evmAddress!;
      return HederaEVMAddress.toString();
    }
    // Encrypt private key
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(password, salt, 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(privateKey.toString(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // Create user
    
    const newUser = new this.userModel({
      username,
      passwordHash,
      hederaAccountId: accountId,
      hederaEVMAccount: getEVMddress(accountId),
      encryptedWallet: {
        encryptedKey: encrypted,
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
      },
    });

    return await newUser.save();
  }
  //Login
  async login(username: string, password: string) {
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new Error('Invalid credentials');
    }
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }
    return user;
}
//Sign Transaction
async signTransaction(username: string, transaction: string, password: string) {
  const user = await this.userModel.findOne({ username });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const { encryptedWallet } = user;
  const { encryptedKey, salt, iv } = encryptedWallet;

  // Decrypt the private key
  const key = crypto.scryptSync(password, Buffer.from(salt, 'hex'), 32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  const privateKey = PrivateKey.fromString(decrypted);
  const client = Client.forTestnet().setOperator(user.hederaAccountId, privateKey);

  const transactionObj = Transaction.fromBytes(Buffer.from(transaction, 'base64'));

  // Sign the transaction with the user's private key
  const signTx = await transactionObj.sign(privateKey);

  // Execute the transaction
  const response = await signTx.execute(client);
  const receipt = await response.getReceipt(client);

  return receipt;
}
}
