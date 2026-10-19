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
exports.UpsertShiftsDto = exports.ShiftDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
class ShiftDto {
    date;
    start;
    end;
    note;
}
exports.ShiftDto = ShiftDto;
__decorate([
    (0, class_validator_1.Matches)(DATE_RE, { message: 'date must be YYYY-MM-DD' }),
    __metadata("design:type", String)
], ShiftDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.Matches)(TIME_RE, { message: 'start must be HH:mm' }),
    __metadata("design:type", String)
], ShiftDto.prototype, "start", void 0);
__decorate([
    (0, class_validator_1.Matches)(TIME_RE, { message: 'end must be HH:mm' }),
    __metadata("design:type", String)
], ShiftDto.prototype, "end", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], ShiftDto.prototype, "note", void 0);
class UpsertShiftsDto {
    shifts;
}
exports.UpsertShiftsDto = UpsertShiftsDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(366),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ShiftDto),
    __metadata("design:type", Array)
], UpsertShiftsDto.prototype, "shifts", void 0);
//# sourceMappingURL=shifts.dto.js.map