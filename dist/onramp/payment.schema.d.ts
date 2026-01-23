import { Document } from 'mongoose';
export type PaymentDocument = Payment & Document;
export declare class Payment {
    reference: string;
    orderID: string;
    email: string;
    amount: number;
    currency: string;
    token: string;
    status: string;
    authorizationUrl: string;
    accessCode: string;
    cryptoAccount?: string;
    webhookData?: any;
    createdAt: Date;
    completedAt?: Date;
    failedAt?: Date;
    updatedAt?: Date;
    initiatedBy?: string;
}
export declare const PaymentSchema: import("mongoose").Schema<Payment, import("mongoose").Model<Payment, any, any, any, Document<unknown, any, Payment, any, {}> & Payment & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Payment, Document<unknown, {}, import("mongoose").FlatRecord<Payment>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Payment> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
