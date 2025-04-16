import { Prop,Schema,SchemaFactory } from "@nestjs/mongoose";
import { Document} from "mongoose";

@Schema()
export class Company extends Document {
    @Prop({ required: true, unique: true })
    companyName: string;

    @Prop({required:true,unique:true})
    RegistrationNumber:string
  
    @Prop({required:true,unique:true})
    companyEmail:string
    
    @Prop({required:true,default:false})
    listingStatus:boolean
    
    @Prop({ required: true })
    initialTokenSupply: Number;
  
    @Prop()
    stableCoinAddress: string;
  
    @Prop()
    tresuaryAddress:string
  }
  
  export const CompanySchema = SchemaFactory.createForClass(Company);
  