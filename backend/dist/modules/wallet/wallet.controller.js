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
var WalletController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const wallet_service_1 = require("./wallet.service");
const supabase_jwt_guard_1 = require("../../common/guards/supabase-jwt.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
const withdraw_dto_1 = require("./dto/withdraw.dto");
const library_1 = require("@prisma/client/runtime/library");
let WalletController = WalletController_1 = class WalletController {
    constructor(walletService) {
        this.walletService = walletService;
        this.logger = new common_1.Logger(WalletController_1.name);
    }
    async getWalletBalance(userId) {
        try {
            const wallet = await this.walletService.getWalletBalance(userId);
            return api_response_dto_1.ApiResponseDto.ok(wallet, 'Wallet balance retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching wallet:', error);
            throw error;
        }
    }
    async withdraw(userId, dto) {
        try {
            const result = await this.walletService.withdraw(userId, new library_1.Decimal(dto.amount), dto.method, dto.destination);
            return api_response_dto_1.ApiResponseDto.ok(result, 'Withdrawal request submitted');
        }
        catch (error) {
            this.logger.error('Error processing withdrawal:', error);
            throw error;
        }
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getWalletBalance", null);
__decorate([
    (0, common_1.Post)('withdraw'),
    (0, common_1.UseGuards)(supabase_jwt_guard_1.SupabaseJwtGuard),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, withdraw_dto_1.WithdrawDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "withdraw", null);
exports.WalletController = WalletController = WalletController_1 = __decorate([
    (0, common_1.Controller)('wallet'),
    __metadata("design:paramtypes", [wallet_service_1.WalletService])
], WalletController);
//# sourceMappingURL=wallet.controller.js.map