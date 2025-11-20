"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToArray = ToArray;
exports.OptionalToArray = OptionalToArray;
const class_transformer_1 = require("class-transformer");
function ToArray(emptyArrayOnUndefined = false) {
    return (0, class_transformer_1.Transform)(({ value }) => {
        if (value === undefined || value === null) {
            return emptyArrayOnUndefined ? [] : undefined;
        }
        if (Array.isArray(value)) {
            return value;
        }
        return [value];
    });
}
function OptionalToArray() {
    return ToArray(false);
}
//# sourceMappingURL=array-transform.decorator.js.map