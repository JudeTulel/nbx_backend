"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnrampModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const onramp_controller_1 = require("./onramp.controller");
const onramp_service_1 = require("./onramp.service");
const payment_schema_1 = require("./payment.schema");
const users_module_1 = require("../users/users.module");
let OnrampModule = class OnrampModule {
};
exports.OnrampModule = OnrampModule;
exports.OnrampModule = OnrampModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            mongoose_1.MongooseModule.forFeature([
                { name: payment_schema_1.Payment.name, schema: payment_schema_1.PaymentSchema },
            ]),
            users_module_1.UsersModule,
        ],
        controllers: [onramp_controller_1.OnrampController],
        providers: [onramp_service_1.OnrampService],
        exports: [onramp_service_1.OnrampService],
    })
], OnrampModule);
//# sourceMappingURL=onramp.module.js.map