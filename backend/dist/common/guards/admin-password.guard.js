"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AdminPasswordGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPasswordGuard = void 0;
const common_1 = require("@nestjs/common");
let AdminPasswordGuard = AdminPasswordGuard_1 = class AdminPasswordGuard {
    constructor() {
        this.logger = new common_1.Logger(AdminPasswordGuard_1.name);
        this.adminPassword = process.env.ADMIN_PASSWORD || 'Fadekemi123@';
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const provided = request.headers['x-admin-password'];
        if (!this.adminPassword || !provided || provided !== this.adminPassword) {
            throw new common_1.UnauthorizedException('Invalid admin password');
        }
        request['userId'] = 'admin-console';
        request['userRole'] = 'ADMIN';
        return true;
    }
};
exports.AdminPasswordGuard = AdminPasswordGuard;
exports.AdminPasswordGuard = AdminPasswordGuard = AdminPasswordGuard_1 = __decorate([
    (0, common_1.Injectable)()
], AdminPasswordGuard);
//# sourceMappingURL=admin-password.guard.js.map