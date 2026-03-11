import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProposalStatus = 'active' | 'closed';
export type ProposalVoteChoice = 'for' | 'against';

@Schema({ _id: false })
export class ProposalVote {
  @Prop({ required: true })
  voterAccountId: string;

  @Prop()
  voterEmail?: string;

  @Prop({ required: true, enum: ['for', 'against'] })
  choice: ProposalVoteChoice;

  @Prop({ required: true, default: Date.now })
  votedAt: Date;
}

export const ProposalVoteSchema = SchemaFactory.createForClass(ProposalVote);

@Schema({ timestamps: true })
export class Proposal extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Equity' })
  equityId?: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, default: 'governance' })
  proposalType: string;

  @Prop({ required: true, enum: ['active', 'closed'], default: 'active' })
  status: ProposalStatus;

  @Prop({ required: true, default: Date.now })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true, default: 0 })
  votesFor: number;

  @Prop({ required: true, default: 0 })
  votesAgainst: number;

  @Prop({ required: true, default: 0 })
  totalVotes: number;

  @Prop({ type: [ProposalVoteSchema], default: [] })
  votes: ProposalVote[];

  @Prop()
  createdByAccountId?: string;

  @Prop()
  createdByEmail?: string;
}

export const ProposalSchema = SchemaFactory.createForClass(Proposal);

