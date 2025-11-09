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
var UpdateWbsItemHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateWbsItemHandler = exports.UpdateWbsItemCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const wbs_item_service_1 = require("../../../../../domain/common/wbs-item/wbs-item.service");
class UpdateWbsItemCommand {
    id;
    data;
    updatedBy;
    constructor(id, data, updatedBy) {
        this.id = id;
        this.data = data;
        this.updatedBy = updatedBy;
    }
}
exports.UpdateWbsItemCommand = UpdateWbsItemCommand;
let UpdateWbsItemHandler = UpdateWbsItemHandler_1 = class UpdateWbsItemHandler {
    wbsItemService;
    logger = new common_1.Logger(UpdateWbsItemHandler_1.name);
    constructor(wbsItemService) {
        this.wbsItemService = wbsItemService;
    }
    async execute(command) {
        const { id, data, updatedBy } = command;
        this.logger.log('WBS 항목 수정 시작', {
            wbsItemId: id,
            updateData: data,
        });
        try {
            const wbsItem = await this.wbsItemService.수정한다(id, data, updatedBy);
            this.logger.log('WBS 항목 수정 완료', {
                wbsItemId: id,
                updatedFields: Object.keys(data),
            });
            return {
                wbsItem,
            };
        }
        catch (error) {
            this.logger.error('WBS 항목 수정 실패', {
                error: error.message,
                wbsItemId: id,
            });
            throw error;
        }
    }
};
exports.UpdateWbsItemHandler = UpdateWbsItemHandler;
exports.UpdateWbsItemHandler = UpdateWbsItemHandler = UpdateWbsItemHandler_1 = __decorate([
    (0, cqrs_1.CommandHandler)(UpdateWbsItemCommand),
    __metadata("design:paramtypes", [wbs_item_service_1.WbsItemService])
], UpdateWbsItemHandler);
//# sourceMappingURL=update-wbs-item.handler.js.map