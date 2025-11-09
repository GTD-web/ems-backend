"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandHandlers = void 0;
__exportStar(require("./generate-seed-data.command"), exports);
__exportStar(require("./clear-seed-data.command"), exports);
const generate_seed_data_command_1 = require("./generate-seed-data.command");
const clear_seed_data_command_1 = require("./clear-seed-data.command");
exports.CommandHandlers = [generate_seed_data_command_1.GenerateSeedDataHandler, clear_seed_data_command_1.ClearSeedDataHandler];
//# sourceMappingURL=index.js.map