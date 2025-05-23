import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company } from '../schemas/company.schema';
import { ContractsService } from '../contracts/contracts.service';
import { User } from '../schemas/user.schema';

@Injectable()
export class GovernanceService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<Company>,
    @InjectModel(User.name) private userModel: Model<User>,
    private contractsService: ContractsService
  ) {}

  // Cast a vote for a specific company governance
  async castVote(
    companyName: string, 
    username: string, 
    votes: number, 
    privateKey: string
  ) {
    // Verify company exists and is listed
    const company = await this.companyModel.findOne({ 
      companyName, 
      listingStatus: true 
    });
    
    if (!company) {
      throw new Error('Company not found or not listed');
    }

    // Verify user exists
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new Error('User not found');
    }

    // Get the exchange contract address
    const exchangeAddress = await this.contractsService.getSMEContract(companyName);
    
    if (exchangeAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('Company has no deployed exchange contract');
    }

    // Verify user is whitelisted
    const isWhitelisted = await this.contractsService.isWhitelisted(
      exchangeAddress, 
      user.hederaEVMAccount
    );
    
    if (!isWhitelisted) {
      throw new Error('User is not whitelisted for this company');
    }

    // Cast the vote
    const result = await this.contractsService.castVote(
      exchangeAddress,
      votes,
      privateKey
    );

    return {
      success: true,
      transactionHash: result.transactionHash,
      votes: votes.toString()
    };
  }

  // Get current votes for a user in a specific company
  async getUserVotes(companyName: string, username: string) {
    // Verify company exists and is listed
    const company = await this.companyModel.findOne({ 
      companyName, 
      listingStatus: true 
    });
    
    if (!company) {
      throw new Error('Company not found or not listed');
    }

    // Verify user exists
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new Error('User not found');
    }

    // Get the exchange contract address
    const exchangeAddress = await this.contractsService.getSMEContract(companyName);
    
    if (exchangeAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('Company has no deployed exchange contract');
    }

    // Get user's votes
    const votes = await this.contractsService.getGovernanceVotes(
      exchangeAddress,
      user.hederaEVMAccount
    );

    return {
      username,
      companyName,
      votes
    };
  }

  // Get all governance votes for a specific company
  async getCompanyVotes(companyName: string) {
    // Verify company exists and is listed
    const company = await this.companyModel.findOne({ 
      companyName, 
      listingStatus: true 
    });
    
    if (!company) {
      throw new Error('Company not found or not listed');
    }

    // Get the exchange contract address
    const exchangeAddress = await this.contractsService.getSMEContract(companyName);
    
    if (exchangeAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('Company has no deployed exchange contract');
    }

    // Get all whitelisted users
    // Note: In a real implementation, we would need to query all whitelisted addresses
    // from events or maintain a separate database of whitelisted users
    const users = await this.userModel.find();
    const votingData = [];

    for (const user of users) {
      try {
        // Check if user is whitelisted
        const isWhitelisted = await this.contractsService.isWhitelisted(
          exchangeAddress, 
          user.hederaEVMAccount
        );
        
        if (isWhitelisted) {
          // Get user's votes
          const votes = await this.contractsService.getGovernanceVotes(
            exchangeAddress,
            user.hederaEVMAccount
          );
          
          if (votes !== '0') {
            votingData.push({
              username: user.username,
              address: user.hederaEVMAccount,
              votes
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching votes for ${user.username}:`, error);
        // Continue with next user if there's an error
      }
    }

    return {
      companyName,
      exchangeAddress,
      votingData
    };
  }

  // Create a governance proposal
  // Note: This would typically be expanded with actual proposal logic
  async createProposal(
    companyName: string,
    username: string,
    title: string,
    description: string,
    privateKey: string
  ) {
    // Verify company exists and is listed
    const company = await this.companyModel.findOne({ 
      companyName, 
      listingStatus: true 
    });
    
    if (!company) {
      throw new Error('Company not found or not listed');
    }

    // Verify user exists
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new Error('User not found');
    }

    // Get the exchange contract address
    const exchangeAddress = await this.contractsService.getSMEContract(companyName);
    
    if (exchangeAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('Company has no deployed exchange contract');
    }

    // Verify user is whitelisted
    const isWhitelisted = await this.contractsService.isWhitelisted(
      exchangeAddress, 
      user.hederaEVMAccount
    );
    
    if (!isWhitelisted) {
      throw new Error('User is not whitelisted for this company');
    }

    // In a real implementation, this would create an actual proposal on-chain
    // For now, we'll return a placeholder success response
    
    return {
      success: true,
      proposalId: `PROP-${Date.now()}`,
      title,
      description,
      creator: username,
      createdAt: new Date().toISOString()
    };
  }
}
