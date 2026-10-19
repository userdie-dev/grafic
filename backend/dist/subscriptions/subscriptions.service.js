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
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const subscription_entity_1 = require("../entities/subscription.entity");
const user_entity_1 = require("../entities/user.entity");
const shifts_service_1 = require("../shifts/shifts.service");
let SubscriptionsService = class SubscriptionsService {
    subs;
    users;
    shifts;
    constructor(subs, users, shifts) {
        this.subs = subs;
        this.users = users;
        this.shifts = shifts;
    }
    async subscribe(user, code) {
        const owner = await this.users.findOne({ where: { shareCode: code.trim().toUpperCase() } });
        if (!owner)
            throw new common_1.NotFoundException('Unknown code');
        if (owner.id === user.id)
            throw new common_1.BadRequestException('Cannot subscribe to yourself');
        const existing = await this.subs.findOne({ where: { subscriberId: user.id, ownerId: owner.id } });
        return existing ?? this.subs.save(this.subs.create({ subscriberId: user.id, ownerId: owner.id }));
    }
    list(user) {
        return this.subs.find({ where: { subscriberId: user.id } });
    }
    async unsubscribe(user, id) {
        const res = await this.subs.delete({ id, subscriberId: user.id });
        return { deleted: !!res.affected };
    }
    async friendShifts(user, ownerId, from, to) {
        const sub = await this.subs.findOne({ where: { subscriberId: user.id, ownerId } });
        if (!sub)
            throw new common_1.ForbiddenException();
        return this.shifts.list(ownerId, from, to);
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(subscription_entity_1.Subscription)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        shifts_service_1.ShiftsService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map