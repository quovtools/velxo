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
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const core_1 = require("@nestjs/core");
const prisma_module_1 = require("./common/services/prisma.module");
const app_controller_1 = require("./app.controller");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const sellers_module_1 = require("./modules/sellers/sellers.module");
const listings_module_1 = require("./modules/listings/listings.module");
const orders_module_1 = require("./modules/orders/orders.module");
const escrow_module_1 = require("./modules/escrow/escrow.module");
const wallet_module_1 = require("./modules/wallet/wallet.module");
const payments_module_1 = require("./modules/payments/payments.module");
const messages_module_1 = require("./modules/messages/messages.module");
const reviews_module_1 = require("./modules/reviews/reviews.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const disputes_module_1 = require("./modules/disputes/disputes.module");
const support_module_1 = require("./modules/support/support.module");
const admin_module_1 = require("./modules/admin/admin.module");
const slides_module_1 = require("./modules/slides/slides.module");
const marquee_module_1 = require("./modules/marquee/marquee.module");
const topups_module_1 = require("./modules/topups/topups.module");
const gigs_module_1 = require("./modules/gigs/gigs.module");
const blog_module_1 = require("./modules/blog/blog.module");
const affiliate_module_1 = require("./modules/affiliate/affiliate.module");
const rewards_module_1 = require("./modules/rewards/rewards.module");
const gateways_1 = require("./modules/gateways");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        controllers: [app_controller_1.AppController],
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            jwt_1.JwtModule.register({
                global: true,
                secret: process.env.JWT_SECRET || 'velxo-fallback-secret-change-in-prod',
                signOptions: { expiresIn: '7d' },
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            sellers_module_1.SellersModule,
            listings_module_1.ListingsModule,
            orders_module_1.OrdersModule,
            escrow_module_1.EscrowModule,
            wallet_module_1.WalletModule,
            payments_module_1.PaymentsModule,
            messages_module_1.MessagesModule,
            reviews_module_1.ReviewsModule,
            notifications_module_1.NotificationsModule,
            disputes_module_1.DisputesModule,
            support_module_1.SupportModule,
            admin_module_1.AdminModule,
            slides_module_1.SlidesModule,
            marquee_module_1.MarqueeModule,
            topups_module_1.TopupsModule,
            gigs_module_1.GigsModule,
            blog_module_1.BlogModule,
            affiliate_module_1.AffiliateModule,
            rewards_module_1.RewardsModule,
            gateways_1.GatewayModule,
        ],
        providers: [
            {
                provide: core_1.APP_FILTER,
                useClass: all_exceptions_filter_1.AllExceptionsFilter,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map