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
exports.EventsController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const rxjs_1 = require("rxjs");
const device_auth_guard_1 = require("../devices/device-auth.guard");
const user_entity_1 = require("../entities/user.entity");
const events_service_1 = require("./events.service");
let EventsController = class EventsController {
    events;
    constructor(events) {
        this.events = events;
    }
    stream(user) {
        return this.events.stream(user.id).pipe((0, rxjs_1.map)((m) => ({ type: m.type, data: m.data })));
    }
};
exports.EventsController = EventsController;
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.UseGuards)(device_auth_guard_1.DeviceAuthGuard),
    (0, common_1.Sse)('events'),
    __param(0, (0, device_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", rxjs_1.Observable)
], EventsController.prototype, "stream", null);
exports.EventsController = EventsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [events_service_1.EventsService])
], EventsController);
//# sourceMappingURL=events.controller.js.map