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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftsController = void 0;
const common_1 = require("@nestjs/common");
const device_auth_guard_1 = require("../devices/device-auth.guard");
const user_entity_1 = require("../entities/user.entity");
const shifts_dto_1 = require("./shifts.dto");
const shifts_service_1 = require("./shifts.service");
let ShiftsController = class ShiftsController {
    shifts;
    constructor(shifts) {
        this.shifts = shifts;
    }
    list(user, from, to) {
        return this.shifts.list(user.id, from, to);
    }
    upsert(user, dto) {
        return this.shifts.upsert(user.id, dto.shifts);
    }
    remove(user, id) {
        return this.shifts.remove(user.id, id);
    }
};
exports.ShiftsController = ShiftsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, device_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, String, String]),
    __metadata("design:returntype", void 0)
], ShiftsController.prototype, "list", null);
__decorate([
    (0, common_1.Put)(),
    __param(0, (0, device_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, shifts_dto_1.UpsertShiftsDto]),
    __metadata("design:returntype", void 0)
], ShiftsController.prototype, "upsert", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, device_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, String]),
    __metadata("design:returntype", void 0)
], ShiftsController.prototype, "remove", null);
exports.ShiftsController = ShiftsController = __decorate([
    (0, common_1.UseGuards)(device_auth_guard_1.DeviceAuthGuard),
    (0, common_1.Controller)('me/shifts'),
    __metadata("design:paramtypes", [shifts_service_1.ShiftsService])
], ShiftsController);
//# sourceMappingURL=shifts.controller.js.map