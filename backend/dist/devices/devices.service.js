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
exports.DevicesService = exports.hashToken = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const crypto_1 = require("crypto");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../entities/user.entity");
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const hashToken = (token) => (0, crypto_1.createHash)('sha256').update(token).digest('hex');
exports.hashToken = hashToken;
let DevicesService = class DevicesService {
    users;
    constructor(users) {
        this.users = users;
    }
    async register() {
        const token = (0, crypto_1.randomBytes)(32).toString('base64url');
        const user = await this.users.save(this.users.create({ tokenHash: (0, exports.hashToken)(token), shareCode: await this.uniqueCode() }));
        return { userId: user.id, token, shareCode: user.shareCode };
    }
    findByToken(token) {
        return this.users.findOne({ where: { tokenHash: (0, exports.hashToken)(token) } });
    }
    async regenerateCode(user) {
        user.shareCode = await this.uniqueCode();
        await this.users.save(user);
        return { shareCode: user.shareCode };
    }
    async uniqueCode() {
        for (;;) {
            const bytes = (0, crypto_1.randomBytes)(CODE_LENGTH);
            const code = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
            if (!(await this.users.exists({ where: { shareCode: code } })))
                return code;
        }
    }
};
exports.DevicesService = DevicesService;
exports.DevicesService = DevicesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DevicesService);
//# sourceMappingURL=devices.service.js.map