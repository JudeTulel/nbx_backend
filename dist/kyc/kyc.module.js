"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KYCModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const kyc_controller_1 = require("./kyc.controller");
const kyc_service_1 = require("./kyc.service");
const kyc_schema_1 = require("./kyc.schema");
const users_schema_1 = require("../users/users.schema");
const uploads_module_1 = require("../uploads/uploads.module");
let KYCModule = class KYCModule {
};
exports.KYCModule = KYCModule;
exports.KYCModule = KYCModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: kyc_schema_1.KYC.name, schema: kyc_schema_1.KYCSchema },
                { name: users_schema_1.User.name, schema: users_schema_1.UserSchema },
            ]),
            uploads_module_1.UploadsModule,
        ],
        controllers: [kyc_controller_1.KYCController],
        providers: [kyc_service_1.KYCService],
        exports: [kyc_service_1.KYCService],
    })
], KYCModule);
//# sourceMappingURL=kyc.module.js.map