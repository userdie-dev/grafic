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
exports.DevicesController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const user_entity_1 = require("../entities/user.entity");
const device_auth_guard_1 = require("./device-auth.guard");
const devices_service_1 = require("./devices.service");
let DevicesController = class DevicesController {
    devices;
    constructor(devices) {
        this.devices = devices;
    }
    register() {
        return this.devices.register();
    }
    regenerate(user) {
        return this.devices.regenerateCode(user);
    }
};
exports.DevicesController = DevicesController;
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    (0, common_1.Post)('devices'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "register", null);
__decorate([
    (0, common_1.UseGuards)(device_auth_guard_1.DeviceAuthGuard),
    (0, common_1.Post)('me/share-code/regenerate'),
    __param(0, (0, device_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "regenerate", null);
exports.DevicesController = DevicesController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [devices_service_1.DevicesService])
], DevicesController);
//# sourceMappingURL=devices.controller.js.map