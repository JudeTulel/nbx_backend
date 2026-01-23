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
exports.CompanySchema = exports.Company = exports.PriceHistorySchema = exports.PriceHistory = exports.TeamMemberSchema = exports.TeamMember = exports.CompanyDocumentSchema = exports.CompanyDocument = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let CompanyDocument = class CompanyDocument {
    name;
    type;
    fileName;
    path;
    url;
    size;
    mimeType;
    uploadedAt;
};
exports.CompanyDocument = CompanyDocument;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CompanyDocument.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CompanyDocument.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CompanyDocument.prototype, "fileName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CompanyDocument.prototype, "path", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CompanyDocument.prototype, "url", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], CompanyDocument.prototype, "size", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CompanyDocument.prototype, "mimeType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], CompanyDocument.prototype, "uploadedAt", void 0);
exports.CompanyDocument = CompanyDocument = __decorate([
    (0, mongoose_1.Schema)({ _id: true, timestamps: false })
], CompanyDocument);
exports.CompanyDocumentSchema = mongoose_1.SchemaFactory.createForClass(CompanyDocument);
let TeamMember = class TeamMember {
    name;
    role;
    bio;
    image;
};
exports.TeamMember = TeamMember;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], TeamMember.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], TeamMember.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], TeamMember.prototype, "bio", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], TeamMember.prototype, "image", void 0);
exports.TeamMember = TeamMember = __decorate([
    (0, mongoose_1.Schema)({ _id: true, timestamps: false })
], TeamMember);
exports.TeamMemberSchema = mongoose_1.SchemaFactory.createForClass(TeamMember);
let PriceHistory = class PriceHistory {
    date;
    price;
};
exports.PriceHistory = PriceHistory;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], PriceHistory.prototype, "date", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], PriceHistory.prototype, "price", void 0);
exports.PriceHistory = PriceHistory = __decorate([
    (0, mongoose_1.Schema)({ _id: false, timestamps: false })
], PriceHistory);
exports.PriceHistorySchema = mongoose_1.SchemaFactory.createForClass(PriceHistory);
let Company = class Company extends mongoose_2.Document {
    name;
    useremail;
    ticker;
    symbol;
    sector;
    description;
    marketCap;
    price;
    totalSupply;
    circulatingSupply;
    documents;
    highlights;
    team;
    priceHistory;
    tokenId;
    treasuryAccountId;
    isTokenized;
};
exports.Company = Company;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Company.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Company.prototype, "useremail", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Company.prototype, "ticker", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Company.prototype, "symbol", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Company.prototype, "sector", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Company.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Company.prototype, "marketCap", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Company.prototype, "price", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '0' }),
    __metadata("design:type", String)
], Company.prototype, "totalSupply", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '0' }),
    __metadata("design:type", String)
], Company.prototype, "circulatingSupply", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.CompanyDocumentSchema], default: [] }),
    __metadata("design:type", Array)
], Company.prototype, "documents", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Company.prototype, "highlights", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.TeamMemberSchema], default: [] }),
    __metadata("design:type", Array)
], Company.prototype, "team", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.PriceHistorySchema], default: [] }),
    __metadata("design:type", Array)
], Company.prototype, "priceHistory", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Company.prototype, "tokenId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Company.prototype, "treasuryAccountId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Company.prototype, "isTokenized", void 0);
exports.Company = Company = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Company);
exports.CompanySchema = mongoose_1.SchemaFactory.createForClass(Company);
//# sourceMappingURL=company.schema.js.map