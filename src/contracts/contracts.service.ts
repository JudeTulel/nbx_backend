import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import * as BlockExchangeFactoryJson from './BlockExchangeFactory.json';
import * as BlockExchangeJson from './BlockExchange.json';
import * as NBXLiquidityProviderJson from './NBXLiquidityProvider.json';
import * as NBXOrderBookJson from './NBXOrderBook.json';

@Injectable()
export class ContractsService {
  private provider: ethers.providers.Provider;
  private factoryContract: ethers.Contract;
  private factoryAddress: string;

  constructor() {
    // Initialize provider - this should be configured based on environment
    // For Hedera, we'll use the Hedera JSON RPC endpoint
    this.provider = new ethers.providers.JsonRpcProvider('https://testnet.hashio.io/api');
    
    // Factory contract address should be stored in environment variables or config
    this.factoryAddress = process.env.FACTORY_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
    
    // Initialize factory contract
    this.factoryContract = new ethers.Contract(
      this.factoryAddress,
      BlockExchangeFactoryJson.abi,
      this.provider
    );
  }

  // Connect with wallet for transactions that require signing
  private getSignedContract(contractAddress: string, abi: any, privateKey: string) {
    const wallet = new ethers.Wallet(privateKey, this.provider);
    return new ethers.Contract(contractAddress, abi, wallet);
  }

  // Get factory contract with signer
  private getSignedFactoryContract(privateKey: string) {
    return this.getSignedContract(this.factoryAddress, BlockExchangeFactoryJson.abi, privateKey);
  }

  // Deploy a new exchange for an SME
  async deployExchange(
    companyName: string,
    tokenSymbol: string,
    initialSupply: number,
    usdtTokenAddress: string,
    treasuryWallet: string,
    privateKey: string
  ) {
    const signedFactory = this.getSignedFactoryContract(privateKey);
    
    const tx = await signedFactory.deployExchange(
      companyName,
      tokenSymbol,
      initialSupply,
      usdtTokenAddress,
      treasuryWallet
    );
    
    const receipt = await tx.wait();
    
    // Extract the deployed exchange address from the event logs
    const event = receipt.events.find(e => e.event === 'ExchangeDeployed');
    const exchangeAddress = event.args.exchangeAddress;
    
    return {
      transactionHash: receipt.transactionHash,
      exchangeAddress: exchangeAddress
    };
  }

  // Get all deployed exchanges
  async getDeployedExchanges() {
    const count = await this.factoryContract.getDeployedExchangesCount();
    const exchanges = await this.factoryContract.getDeployedExchanges();
    return { count: count.toNumber(), exchanges };
  }

  // Get exchange address for a specific company
  async getSMEContract(companyName: string) {
    return await this.factoryContract.getSMEContract(companyName);
  }

  // Get exchange contract instance
  getExchangeContract(exchangeAddress: string) {
    return new ethers.Contract(
      exchangeAddress,
      BlockExchangeJson.abi,
      this.provider
    );
  }

  // Get signed exchange contract for transactions
  getSignedExchangeContract(exchangeAddress: string, privateKey: string) {
    return this.getSignedContract(exchangeAddress, BlockExchangeJson.abi, privateKey);
  }

  // Whitelist an investor
  async whitelistInvestor(exchangeAddress: string, investorAddress: string, status: boolean, privateKey: string) {
    const signedExchange = this.getSignedExchangeContract(exchangeAddress, privateKey);
    const tx = await signedExchange.whitelistInvestor(investorAddress, status);
    const receipt = await tx.wait();
    return {
      transactionHash: receipt.transactionHash,
      success: true
    };
  }

  // Transfer tokens
  async transferTokens(
    exchangeAddress: string,
    tokenAddress: string,
    fromAddress: string,
    toAddress: string,
    amount: number,
    privateKey: string
  ) {
    const signedExchange = this.getSignedExchangeContract(exchangeAddress, privateKey);
    const tx = await signedExchange.transferTokens(tokenAddress, fromAddress, toAddress, amount);
    const receipt = await tx.wait();
    return {
      transactionHash: receipt.transactionHash,
      success: true
    };
  }

  // Distribute dividends
  async distributeDividends(exchangeAddress: string, amount: number, privateKey: string) {
    const signedExchange = this.getSignedExchangeContract(exchangeAddress, privateKey);
    const tx = await signedExchange.distributeDividends(amount);
    const receipt = await tx.wait();
    return {
      transactionHash: receipt.transactionHash,
      success: true
    };
  }

  // Claim dividends
  async claimDividends(exchangeAddress: string, privateKey: string) {
    const signedExchange = this.getSignedExchangeContract(exchangeAddress, privateKey);
    const tx = await signedExchange.claimDividends();
    const receipt = await tx.wait();
    return {
      transactionHash: receipt.transactionHash,
      success: true
    };
  }

  // Cast governance vote
  async castVote(exchangeAddress: string, votes: number, privateKey: string) {
    const signedExchange = this.getSignedExchangeContract(exchangeAddress, privateKey);
    const tx = await signedExchange.castVote(votes);
    const receipt = await tx.wait();
    return {
      transactionHash: receipt.transactionHash,
      success: true
    };
  }

  // Get token balance
  async getTokenBalance(exchangeAddress: string, tokenAddress: string, accountAddress: string) {
    const exchange = this.getExchangeContract(exchangeAddress);
    const balance = await exchange.balanceOf(tokenAddress, accountAddress);
    return balance.toString();
  }

  // Get total token supply
  async getTotalTokenSupply(exchangeAddress: string, tokenAddress: string) {
    const exchange = this.getExchangeContract(exchangeAddress);
    const supply = await exchange.totalTokenSupply(tokenAddress);
    return supply.toString();
  }

  // Check if an address is whitelisted
  async isWhitelisted(exchangeAddress: string, address: string) {
    const exchange = this.getExchangeContract(exchangeAddress);
    return await exchange.isWhitelisted(address);
  }

  // Get total dividends distributed
  async getTotalDividendsDistributed(exchangeAddress: string) {
    const exchange = this.getExchangeContract(exchangeAddress);
    const dividends = await exchange.totalDividendsDistributed();
    return dividends.toString();
  }

  // Get governance votes for an address
  async getGovernanceVotes(exchangeAddress: string, address: string) {
    const exchange = this.getExchangeContract(exchangeAddress);
    const votes = await exchange.governanceVotes(address);
    return votes.toString();
  }
}
