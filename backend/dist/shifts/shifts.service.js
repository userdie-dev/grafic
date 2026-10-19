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
exports.ShiftsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const date_fns_1 = require("date-fns");
const lodash_1 = require("lodash");
const typeorm_2 = require("typeorm");
const events_service_1 = require("../events/events.service");
const shift_entity_1 = require("../entities/shift.entity");
const subscription_entity_1 = require("../entities/subscription.entity");
const key = (s) => `${s.date}|${s.start}`;
let ShiftsService = class ShiftsService {
    shifts;
    subs;
    events;
    constructor(shifts, subs, events) {
        this.shifts = shifts;
        this.subs = subs;
        this.events = events;
    }
    list(userId, from, to) {
        this.assertDate(from);
        this.assertDate(to);
        return this.shifts.find({
            where: { userId, ...(from && to ? { date: (0, typeorm_2.Between)(from, to) } : {}) },
            order: { date: 'ASC', start: 'ASC' },
        });
    }
    async upsert(userId, items) {
        items.forEach((i) => this.assertDate(i.date));
        const dates = (0, lodash_1.uniq)(items.map((i) => i.date));
        const existing = (0, lodash_1.keyBy)(await this.shifts.find({ where: dates.map((date) => ({ userId, date })) }), key);
        const saved = await this.shifts.save(items.map((i) => this.shifts.create({ ...existing[key(i)], userId, date: i.date, start: i.start, end: i.end, note: i.note ?? null })));
        await this.notify(userId, dates);
        return saved;
    }
    async remove(userId, id) {
        const shift = await this.shifts.findOne({ where: { id, userId } });
        if (!shift)
            return { deleted: false };
        await this.shifts.remove(shift);
        await this.notify(userId, [shift.date]);
        return { deleted: true };
    }
    async notify(ownerId, dates) {
        const subscribers = await this.subs.find({ where: { ownerId } });
        for (const { subscriberId } of subscribers) {
            this.events.emit(subscriberId, { type: 'schedule.changed', ownerId, dates });
        }
    }
    assertDate(value) {
        if (value !== undefined && !(0, date_fns_1.isValid)((0, date_fns_1.parseISO)(value))) {
            throw new common_1.BadRequestException(`Invalid date: ${value}`);
        }
    }
};
exports.ShiftsService = ShiftsService;
exports.ShiftsService = ShiftsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(shift_entity_1.Shift)),
    __param(1, (0, typeorm_1.InjectRepository)(subscription_entity_1.Subscription)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        events_service_1.EventsService])
], ShiftsService);
//# sourceMappingURL=shifts.service.js.map