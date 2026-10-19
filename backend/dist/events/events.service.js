"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
let EventsService = class EventsService {
    streams = new Map();
    stream(userId) {
        const subject = new rxjs_1.Subject();
        const set = this.streams.get(userId) ?? new Set();
        set.add(subject);
        this.streams.set(userId, set);
        const heartbeat = (0, rxjs_1.interval)(25000).pipe((0, rxjs_1.map)(() => ({ type: 'ping', data: {} })));
        return (0, rxjs_1.merge)(subject, heartbeat).pipe((0, rxjs_1.finalize)(() => {
            set.delete(subject);
            if (set.size === 0)
                this.streams.delete(userId);
        }));
    }
    emit(userId, event) {
        this.streams.get(userId)?.forEach((s) => s.next({ type: event.type, data: event }));
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)()
], EventsService);
//# sourceMappingURL=events.service.js.map