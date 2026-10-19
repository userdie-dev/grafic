"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const typeorm_1 = require("@nestjs/typeorm");
const devices_module_1 = require("./devices/devices.module");
const shift_entity_1 = require("./entities/shift.entity");
const subscription_entity_1 = require("./entities/subscription.entity");
const user_entity_1 = require("./entities/user.entity");
const events_module_1 = require("./events/events.module");
const shifts_module_1 = require("./shifts/shifts.module");
const subscriptions_module_1 = require("./subscriptions/subscriptions.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot({
                type: 'better-sqlite3',
                database: process.env.DB_PATH ?? 'grafic.sqlite',
                entities: [user_entity_1.User, shift_entity_1.Shift, subscription_entity_1.Subscription],
                synchronize: true,
            }),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
            devices_module_1.DevicesModule,
            events_module_1.EventsModule,
            shifts_module_1.ShiftsModule,
            subscriptions_module_1.SubscriptionsModule,
        ],
        providers: [{ provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard }],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map