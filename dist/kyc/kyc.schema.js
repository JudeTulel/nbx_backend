"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KYCSchema = exports.KYC = exports.KYCDocumentType = exports.KYCStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var KYCStatus;
(function (KYCStatus) {
    KYCStatus["PENDING"] = "pending";
    KYCStatus["UNDER_REVIEW"] = "under_review";
    KYCStatus["APPROVED"] = "approved";
    KYCStatus["REJECTED"] = "rejected";
    KYCStatus["EXPIRED"] = "expired";
})(KYCStatus || (exports.KYCStatus = KYCStatus = {}));
var KYCDocumentType;
(function (KYCDocumentType) {
    KYCDocumentType["PASSPORT"] = "passport";
    KYCDocumentType["DRIVERS_LICENSE"] = "drivers_license";
    KYCDocumentType["NATIONAL_ID"] = "national_id";
})(KYCDocumentType || (exports.KYCDocumentType = KYCDocumentType = {}));
let KYC = class KYC extends mongoose_2.Document {
    userId;
    useremail;
    fullName;
    idNumber;
    documentType;
    frontImageUrl;
    backImageUrl;
    status;
    rejectionReason;
    reviewedBy;
    reviewedAt;
    expiresAt;
    submittedAt;
};
exports.KYC = KYC;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true, unique: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], KYC.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], KYC.prototype, "useremail", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], KYC.prototype, "fullName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], KYC.prototype, "idNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: KYCDocumentType,
        default: KYCDocumentType.NATIONAL_ID
    }),
    __metadata("design:type", String)
], KYC.prototype, "documentType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], KYC.prototype, "frontImageUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], KYC.prototype, "backImageUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: KYCStatus,
        default: KYCStatus.PENDING
    }),
    __metadata("design:type", String)
], KYC.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], KYC.prototype, "rejectionReason", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], KYC.prototype, "reviewedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], KYC.prototype, "reviewedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], KYC.prototype, "expiresAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], KYC.prototype, "submittedAt", void 0);
exports.KYC = KYC = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], KYC);
exports.KYCSchema = mongoose_1.SchemaFactory.createForClass(KYC);
exports.KYCSchema.index({ userId: 1, status: 1 });
//# sourceMappingURL=kyc.schema.js.map