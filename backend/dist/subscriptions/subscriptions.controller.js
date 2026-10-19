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
exports.SubscriptionsController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const class_validator_1 = require("class-validator");
const device_auth_guard_1 = require("../devices/device-auth.guard");
const user_entity_1 = require("../entities/user.entity");
const subscriptions_service_1 = require("./subscriptions.service");
class SubscribeDto {
    code;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(4, 6),
    __metadata("design:type", String)
], SubscribeDto.prototype, "code", void 0);
let SubscriptionsController = class SubscriptionsController {
    subs;
    constructor(subs) {
        this.subs = subs;
    }
    subscribe(user, dto) {
        return this.subs.subscribe(user, dto.code);
    }
    list(user) {
        return this.subs.list(user);
    }
    unsubscribe(user, id) {
        return this.subs.unsubscribe(user, id);
    }
    friendShifts(user, ownerId, from, to) {
        return this.subs.friendShifts(user, ownerId, from, to);
    }
};
exports.SubscriptionsController = SubscriptionsController;
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    (0, common_1.Post)('subscriptions'),
    __param(0, (0, device_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, SubscribeDto]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "subscribe", null);
__decorate([
    (0, common_1.Get)('subscriptions'),
    __param(0, (0, device_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "list", null);
__decorate([
    (0, common_1.Delete)('subscriptions/:id'),
    __param(0, (0, device_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, String]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "unsubscribe", null);
__decorate([
    (0, common_1.Get)('friends/:ownerId/shifts'),
    __param(0, (0, device_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('ownerId')),
    __param(2, (0, common_1.Query)('from')),
    __param(3, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, String, String, String]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "friendShifts", null);
exports.SubscriptionsController = SubscriptionsController = __decorate([
    (0, common_1.UseGuards)(device_auth_guard_1.DeviceAuthGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [subscriptions_service_1.SubscriptionsService])
], SubscriptionsController);
//# sourceMappingURL=subscriptions.controller.js.map