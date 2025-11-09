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
var CreateWbsItemHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateWbsItemHandler = exports.CreateWbsItemCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const wbs_item_service_1 = require("../../../../../domain/common/wbs-item/wbs-item.service");
class CreateWbsItemCommand {
    data;
    createdBy;
    constructor(data, createdBy) {
        this.data = data;
        this.createdBy = createdBy;
    }
}
exports.CreateWbsItemCommand = CreateWbsItemCommand;
let CreateWbsItemHandler = CreateWbsItemHandler_1 = class CreateWbsItemHandler {
    wbsItemService;
    logger = new common_1.Logger(CreateWbsItemHandler_1.name);
    constructor(wbsItemService) {
        this.wbsItemService = wbsItemService;
    }
    async execute(command) {
        const { data, createdBy } = command;
        this.logger.log('WBS 항목 생성 시작', {
            wbsCode: data.wbsCode,
            title: data.title,
            projectId: data.projectId,
        });
        try {
            const wbsItem = await this.wbsItemService.생성한다(data, createdBy);
            this.logger.log('WBS 항목 생성 완료', {
                wbsItemId: wbsItem.id,
                wbsCode: wbsItem.wbsCode,
            });
            return {
                wbsItem,
            };
        }
        catch (error) {
            this.logger.error('WBS 항목 생성 실패', {
                error: error.message,
                wbsCode: data.wbsCode,
                projectId: data.projectId,
            });
            throw error;
        }
    }
};
exports.CreateWbsItemHandler = CreateWbsItemHandler;
exports.CreateWbsItemHandler = CreateWbsItemHandler = CreateWbsItemHandler_1 = __decorate([
    (0, cqrs_1.CommandHandler)(CreateWbsItemCommand),
    __metadata("design:paramtypes", [wbs_item_service_1.WbsItemService])
], CreateWbsItemHandler);
//# sourceMappingURL=create-wbs-item.handler.js.map