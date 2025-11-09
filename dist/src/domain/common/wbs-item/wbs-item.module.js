"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WbsItemModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const transaction_manager_service_1 = require("../../../../libs/database/transaction-manager.service");
const wbs_item_entity_1 = require("./wbs-item.entity");
const wbs_item_service_1 = require("./wbs-item.service");
const wbs_item_test_service_1 = require("./wbs-item-test.service");
let WbsItemModule = class WbsItemModule {
};
exports.WbsItemModule = WbsItemModule;
exports.WbsItemModule = WbsItemModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([wbs_item_entity_1.WbsItem])],
        providers: [wbs_item_service_1.WbsItemService, wbs_item_test_service_1.WbsItemTestService, transaction_manager_service_1.TransactionManagerService],
        exports: [wbs_item_service_1.WbsItemService, wbs_item_test_service_1.WbsItemTestService, typeorm_1.TypeOrmModule],
    })
], WbsItemModule);
//# sourceMappingURL=wbs-item.module.js.map