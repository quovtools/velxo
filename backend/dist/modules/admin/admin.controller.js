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
var AdminController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const admin_password_guard_1 = require("../../common/guards/admin-password.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
let AdminController = AdminController_1 = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
        this.logger = new common_1.Logger(AdminController_1.name);
    }
    async getDashboard() {
        try {
            const stats = await this.adminService.getDashboardStats();
            return api_response_dto_1.ApiResponseDto.ok(stats, 'Dashboard stats retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching dashboard:', error);
            throw error;
        }
    }
    async getPendingListings(limit) {
        try {
            const listings = await this.adminService.getPendingListings(limit);
            return api_response_dto_1.ApiResponseDto.ok(listings, 'Pending listings retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching pending listings:', error);
            throw error;
        }
    }
    async approveListing(listingId, moderatorId) {
        try {
            const listing = await this.adminService.approveListing(listingId, moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(listing, 'Listing approved successfully');
        }
        catch (error) {
            this.logger.error('Error approving listing:', error);
            throw error;
        }
    }
    async rejectListing(listingId, moderatorId, reason) {
        try {
            const listing = await this.adminService.rejectListing(listingId, moderatorId, reason);
            return api_response_dto_1.ApiResponseDto.ok(listing, 'Listing rejected successfully');
        }
        catch (error) {
            this.logger.error('Error rejecting listing:', error);
            throw error;
        }
    }
    async getFlaggedListings(limit) {
        try {
            const listings = await this.adminService.getFlaggedListings(limit);
            return api_response_dto_1.ApiResponseDto.ok(listings, 'Flagged listings retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching flagged listings:', error);
            throw error;
        }
    }
    async getSuspiciousUsers(limit) {
        try {
            const users = await this.adminService.getSuspiciousUsers(limit);
            return api_response_dto_1.ApiResponseDto.ok(users, 'Suspicious users retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching suspicious users:', error);
            throw error;
        }
    }
    async getRevenueAnalytics(startDate, endDate) {
        try {
            const analytics = await this.adminService.getRevenueAnalytics(new Date(startDate), new Date(endDate));
            return api_response_dto_1.ApiResponseDto.ok(analytics, 'Revenue analytics retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching revenue analytics:', error);
            throw error;
        }
    }
    async getSellerMetrics(sellerId) {
        try {
            const metrics = await this.adminService.getSellerMetrics(sellerId);
            return api_response_dto_1.ApiResponseDto.ok(metrics, 'Seller metrics retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching seller metrics:', error);
            throw error;
        }
    }
    async getPendingKyc(limit) {
        try {
            const submissions = await this.adminService.getPendingKyc(limit);
            return api_response_dto_1.ApiResponseDto.ok(submissions, 'Pending KYC submissions retrieved');
        }
        catch (error) {
            this.logger.error('Error fetching pending KYC:', error);
            throw error;
        }
    }
    async approveKyc(sellerId, moderatorId) {
        try {
            const seller = await this.adminService.approveKyc(sellerId, moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(seller, 'KYC approved successfully');
        }
        catch (error) {
            this.logger.error('Error approving KYC:', error);
            throw error;
        }
    }
    async rejectKyc(sellerId, moderatorId, reason) {
        try {
            const seller = await this.adminService.rejectKyc(sellerId, moderatorId, reason);
            return api_response_dto_1.ApiResponseDto.ok(seller, 'KYC rejected');
        }
        catch (error) {
            this.logger.error('Error rejecting KYC:', error);
            throw error;
        }
    }
    async listUsers(search, role, status, page, limit) {
        try {
            const result = await this.adminService.listUsers({ search, role, status, page, limit });
            return api_response_dto_1.ApiResponseDto.ok(result.items, 'Users retrieved', result.pagination);
        }
        catch (error) {
            this.logger.error('Error listing users:', error);
            throw error;
        }
    }
    async getUser(id) {
        try {
            const user = await this.adminService.getUser(id);
            return api_response_dto_1.ApiResponseDto.ok(user, user ? 'User retrieved' : 'User not found');
        }
        catch (error) {
            this.logger.error('Error fetching user:', error);
            throw error;
        }
    }
    async banUser(id, moderatorId, reason) {
        try {
            const user = await this.adminService.setUserBan(id, true, reason, moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(user, 'User banned');
        }
        catch (error) {
            this.logger.error('Error banning user:', error);
            throw error;
        }
    }
    async unbanUser(id, moderatorId) {
        try {
            const user = await this.adminService.setUserBan(id, false, undefined, moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(user, 'User unbanned');
        }
        catch (error) {
            this.logger.error('Error unbanning user:', error);
            throw error;
        }
    }
    async setUserActive(id, moderatorId, active) {
        try {
            const user = await this.adminService.setUserActive(id, active, moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(user, `User ${active ? 'activated' : 'deactivated'}`);
        }
        catch (error) {
            this.logger.error('Error updating user active state:', error);
            throw error;
        }
    }
    async changeUserRole(id, moderatorId, role) {
        try {
            const user = await this.adminService.changeUserRole(id, role, moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(user, 'User role updated');
        }
        catch (error) {
            this.logger.error('Error changing user role:', error);
            throw error;
        }
    }
    async verifyUserEmail(id, moderatorId) {
        try {
            const user = await this.adminService.verifyUserEmail(id, moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(user, 'User email verified');
        }
        catch (error) {
            this.logger.error('Error verifying user email:', error);
            throw error;
        }
    }
    async listSellers(search, status, page, limit) {
        try {
            const result = await this.adminService.listSellers({ search, status, page, limit });
            return api_response_dto_1.ApiResponseDto.ok(result.items, 'Sellers retrieved', result.pagination);
        }
        catch (error) {
            this.logger.error('Error listing sellers:', error);
            throw error;
        }
    }
    async getSeller(id) {
        try {
            const seller = await this.adminService.getSellerAdmin(id);
            return api_response_dto_1.ApiResponseDto.ok(seller, seller ? 'Seller retrieved' : 'Seller not found');
        }
        catch (error) {
            this.logger.error('Error fetching seller:', error);
            throw error;
        }
    }
    async verifySeller(id, moderatorId, verified) {
        try {
            const seller = await this.adminService.setSellerVerified(id, verified ?? true, moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(seller, 'Seller verification updated');
        }
        catch (error) {
            this.logger.error('Error updating seller verification:', error);
            throw error;
        }
    }
    async suspendSeller(id, moderatorId, suspended, reason) {
        try {
            const seller = await this.adminService.setSellerSuspended(id, suspended ?? true, reason || '', moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(seller, `Seller ${suspended ? 'suspended' : 'reinstated'}`);
        }
        catch (error) {
            this.logger.error('Error updating seller suspension:', error);
            throw error;
        }
    }
    async featureSeller(id, moderatorId, featured) {
        try {
            const seller = await this.adminService.setSellerFeatured(id, featured ?? true, moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(seller, 'Seller featured state updated');
        }
        catch (error) {
            this.logger.error('Error updating seller featured state:', error);
            throw error;
        }
    }
    async listListings(search, status, game, page, limit) {
        try {
            const result = await this.adminService.listListings({ search, status, game, page, limit });
            return api_response_dto_1.ApiResponseDto.ok(result.items, 'Listings retrieved', result.pagination);
        }
        catch (error) {
            this.logger.error('Error listing listings:', error);
            throw error;
        }
    }
    async getListing(id) {
        try {
            const listing = await this.adminService.getListingAdmin(id);
            return api_response_dto_1.ApiResponseDto.ok(listing, listing ? 'Listing retrieved' : 'Listing not found');
        }
        catch (error) {
            this.logger.error('Error fetching listing:', error);
            throw error;
        }
    }
    async featureListing(id, moderatorId, featured) {
        try {
            const listing = await this.adminService.setListingFeatured(id, featured ?? true, moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(listing, 'Listing featured state updated');
        }
        catch (error) {
            this.logger.error('Error featuring listing:', error);
            throw error;
        }
    }
    async suspendListing(id, moderatorId, reason) {
        try {
            const listing = await this.adminService.suspendListing(id, reason || '', moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(listing, 'Listing suspended');
        }
        catch (error) {
            this.logger.error('Error suspending listing:', error);
            throw error;
        }
    }
    async forceApproveListing(id, moderatorId) {
        try {
            const listing = await this.adminService.forceApproveListing(id, moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(listing, 'Listing approved');
        }
        catch (error) {
            this.logger.error('Error approving listing:', error);
            throw error;
        }
    }
    async deleteListing(id, moderatorId) {
        try {
            const result = await this.adminService.deleteListing(id, moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(result, 'Listing deleted');
        }
        catch (error) {
            this.logger.error('Error deleting listing:', error);
            throw error;
        }
    }
    async listOrders(status, page, limit) {
        try {
            const result = await this.adminService.listOrders({ status, page, limit });
            return api_response_dto_1.ApiResponseDto.ok(result.items, 'Orders retrieved', result.pagination);
        }
        catch (error) {
            this.logger.error('Error listing orders:', error);
            throw error;
        }
    }
    async getOrder(id) {
        try {
            const order = await this.adminService.getOrderAdmin(id);
            return api_response_dto_1.ApiResponseDto.ok(order, order ? 'Order retrieved' : 'Order not found');
        }
        catch (error) {
            this.logger.error('Error fetching order:', error);
            throw error;
        }
    }
    async cancelOrder(id, moderatorId, reason) {
        try {
            const order = await this.adminService.cancelOrder(id, reason || '', moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(order, 'Order cancelled');
        }
        catch (error) {
            this.logger.error('Error cancelling order:', error);
            throw error;
        }
    }
    async refundOrder(id, moderatorId, amount, reason) {
        try {
            const order = await this.adminService.refundOrder(id, amount, reason || '', moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(order, 'Order refunded');
        }
        catch (error) {
            this.logger.error('Error refunding order:', error);
            throw error;
        }
    }
    async listWithdrawals(status, page, limit) {
        try {
            const result = await this.adminService.listWithdrawals({ status, page, limit });
            return api_response_dto_1.ApiResponseDto.ok(result.items, 'Withdrawals retrieved', result.pagination);
        }
        catch (error) {
            this.logger.error('Error listing withdrawals:', error);
            throw error;
        }
    }
    async getWithdrawal(id) {
        try {
            const withdrawal = await this.adminService.getWithdrawal(id);
            return api_response_dto_1.ApiResponseDto.ok(withdrawal, withdrawal ? 'Withdrawal retrieved' : 'Withdrawal not found');
        }
        catch (error) {
            this.logger.error('Error fetching withdrawal:', error);
            throw error;
        }
    }
    async approveWithdrawal(id, moderatorId) {
        try {
            const withdrawal = await this.adminService.approveWithdrawal(id, moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(withdrawal, 'Withdrawal approved');
        }
        catch (error) {
            this.logger.error('Error approving withdrawal:', error);
            throw error;
        }
    }
    async rejectWithdrawal(id, moderatorId, reason) {
        try {
            const withdrawal = await this.adminService.rejectWithdrawal(id, reason || '', moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(withdrawal, 'Withdrawal rejected');
        }
        catch (error) {
            this.logger.error('Error rejecting withdrawal:', error);
            throw error;
        }
    }
    async listTickets(status, category, priority, page, limit) {
        try {
            const result = await this.adminService.listTickets({ status, category, priority, page, limit });
            return api_response_dto_1.ApiResponseDto.ok(result.items, 'Tickets retrieved', result.pagination);
        }
        catch (error) {
            this.logger.error('Error listing tickets:', error);
            throw error;
        }
    }
    async getTicket(id) {
        try {
            const ticket = await this.adminService.getTicket(id);
            return api_response_dto_1.ApiResponseDto.ok(ticket, ticket ? 'Ticket retrieved' : 'Ticket not found');
        }
        catch (error) {
            this.logger.error('Error fetching ticket:', error);
            throw error;
        }
    }
    async updateTicketStatus(id, moderatorId, status) {
        try {
            const ticket = await this.adminService.updateTicketStatus(id, status, moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(ticket, 'Ticket status updated');
        }
        catch (error) {
            this.logger.error('Error updating ticket status:', error);
            throw error;
        }
    }
    async updateTicketPriority(id, moderatorId, priority) {
        try {
            const ticket = await this.adminService.updateTicketPriority(id, priority, moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(ticket, 'Ticket priority updated');
        }
        catch (error) {
            this.logger.error('Error updating ticket priority:', error);
            throw error;
        }
    }
    async assignTicket(id, moderatorId, assigneeId) {
        try {
            const ticket = await this.adminService.assignTicket(id, assigneeId, moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(ticket, 'Ticket assigned');
        }
        catch (error) {
            this.logger.error('Error assigning ticket:', error);
            throw error;
        }
    }
    async listCategories() {
        try {
            const categories = await this.adminService.listCategories();
            return api_response_dto_1.ApiResponseDto.ok(categories, 'Categories retrieved');
        }
        catch (error) {
            this.logger.error('Error listing categories:', error);
            throw error;
        }
    }
    async createCategory(dto, moderatorId) {
        try {
            const category = await this.adminService.createCategory(dto);
            return api_response_dto_1.ApiResponseDto.ok(category, 'Category created');
        }
        catch (error) {
            this.logger.error('Error creating category:', error);
            throw error;
        }
    }
    async updateCategory(id, dto, moderatorId) {
        try {
            const category = await this.adminService.updateCategory(id, dto, moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(category, 'Category updated');
        }
        catch (error) {
            this.logger.error('Error updating category:', error);
            throw error;
        }
    }
    async deleteCategory(id, moderatorId) {
        try {
            const result = await this.adminService.deleteCategory(id, moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(result, 'Category deleted');
        }
        catch (error) {
            this.logger.error('Error deleting category:', error);
            throw error;
        }
    }
    async createSubcategory(categoryId, dto, moderatorId) {
        try {
            const sub = await this.adminService.createSubcategory(categoryId, dto, moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(sub, 'Subcategory created');
        }
        catch (error) {
            this.logger.error('Error creating subcategory:', error);
            throw error;
        }
    }
    async updateSubcategory(id, dto, moderatorId) {
        try {
            const sub = await this.adminService.updateSubcategory(id, dto, moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(sub, 'Subcategory updated');
        }
        catch (error) {
            this.logger.error('Error updating subcategory:', error);
            throw error;
        }
    }
    async deleteSubcategory(id, moderatorId) {
        try {
            const result = await this.adminService.deleteSubcategory(id, moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(result, 'Subcategory deleted');
        }
        catch (error) {
            this.logger.error('Error deleting subcategory:', error);
            throw error;
        }
    }
    async listTopups() {
        try {
            const products = await this.adminService.listTopups();
            return api_response_dto_1.ApiResponseDto.ok(products, 'Topup products retrieved');
        }
        catch (error) {
            this.logger.error('Error listing topups:', error);
            throw error;
        }
    }
    async createTopup(dto, moderatorId) {
        try {
            const product = await this.adminService.createTopup(dto);
            return api_response_dto_1.ApiResponseDto.ok(product, 'Topup product created');
        }
        catch (error) {
            this.logger.error('Error creating topup:', error);
            throw error;
        }
    }
    async updateTopup(id, dto, moderatorId) {
        try {
            const product = await this.adminService.updateTopup(id, dto, moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(product, 'Topup product updated');
        }
        catch (error) {
            this.logger.error('Error updating topup:', error);
            throw error;
        }
    }
    async deleteTopup(id, moderatorId) {
        try {
            const result = await this.adminService.deleteTopup(id, moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(result, 'Topup product deleted');
        }
        catch (error) {
            this.logger.error('Error deleting topup:', error);
            throw error;
        }
    }
    async listBlogPosts() {
        try {
            const posts = await this.adminService.listBlogPosts();
            return api_response_dto_1.ApiResponseDto.ok(posts, 'Blog posts retrieved');
        }
        catch (error) {
            this.logger.error('Error listing blog posts:', error);
            throw error;
        }
    }
    async createBlogPost(dto, moderatorId) {
        try {
            const post = await this.adminService.createBlogPost(dto);
            return api_response_dto_1.ApiResponseDto.ok(post, 'Blog post created');
        }
        catch (error) {
            this.logger.error('Error creating blog post:', error);
            throw error;
        }
    }
    async updateBlogPost(id, dto, moderatorId) {
        try {
            const post = await this.adminService.updateBlogPost(id, dto, moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(post, 'Blog post updated');
        }
        catch (error) {
            this.logger.error('Error updating blog post:', error);
            throw error;
        }
    }
    async deleteBlogPost(id, moderatorId) {
        try {
            const result = await this.adminService.deleteBlogPost(id, moderatorId);
            return api_response_dto_1.ApiResponseDto.ok(result, 'Blog post deleted');
        }
        catch (error) {
            this.logger.error('Error deleting blog post:', error);
            throw error;
        }
    }
    async listAuditLogs(action, entityType, actorId, page, limit) {
        try {
            const result = await this.adminService.listAuditLogs({ action, entityType, actorId, page, limit });
            return api_response_dto_1.ApiResponseDto.ok(result.items, 'Audit logs retrieved', result.pagination);
        }
        catch (error) {
            this.logger.error('Error listing audit logs:', error);
            throw error;
        }
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('listings/pending'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPendingListings", null);
__decorate([
    (0, common_1.Patch)('listings/:id/approve'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveListing", null);
__decorate([
    (0, common_1.Patch)('listings/:id/reject'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectListing", null);
__decorate([
    (0, common_1.Get)('fraud/flagged-listings'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getFlaggedListings", null);
__decorate([
    (0, common_1.Get)('fraud/suspicious-users'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSuspiciousUsers", null);
__decorate([
    (0, common_1.Get)('analytics/revenue'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRevenueAnalytics", null);
__decorate([
    (0, common_1.Get)('sellers/:sellerId/metrics'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('sellerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSellerMetrics", null);
__decorate([
    (0, common_1.Get)('kyc/pending'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPendingKyc", null);
__decorate([
    (0, common_1.Patch)('kyc/:sellerId/approve'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('sellerId')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveKyc", null);
__decorate([
    (0, common_1.Patch)('kyc/:sellerId/reject'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('sellerId')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectKyc", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('role')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUser", null);
__decorate([
    (0, common_1.Patch)('users/:id/ban'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "banUser", null);
__decorate([
    (0, common_1.Patch)('users/:id/unban'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "unbanUser", null);
__decorate([
    (0, common_1.Patch)('users/:id/active'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __param(2, (0, common_1.Body)('active')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Boolean]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "setUserActive", null);
__decorate([
    (0, common_1.Patch)('users/:id/role'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __param(2, (0, common_1.Body)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "changeUserRole", null);
__decorate([
    (0, common_1.Patch)('users/:id/verify-email'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "verifyUserEmail", null);
__decorate([
    (0, common_1.Get)('sellers'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listSellers", null);
__decorate([
    (0, common_1.Get)('sellers/:id'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSeller", null);
__decorate([
    (0, common_1.Patch)('sellers/:id/verify'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __param(2, (0, common_1.Body)('verified')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Boolean]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "verifySeller", null);
__decorate([
    (0, common_1.Patch)('sellers/:id/suspend'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __param(2, (0, common_1.Body)('suspended')),
    __param(3, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Boolean, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "suspendSeller", null);
__decorate([
    (0, common_1.Patch)('sellers/:id/feature'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __param(2, (0, common_1.Body)('featured')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Boolean]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "featureSeller", null);
__decorate([
    (0, common_1.Get)('listings'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('game')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listListings", null);
__decorate([
    (0, common_1.Get)('listings/:id'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getListing", null);
__decorate([
    (0, common_1.Patch)('listings/:id/feature'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __param(2, (0, common_1.Body)('featured')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Boolean]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "featureListing", null);
__decorate([
    (0, common_1.Patch)('listings/:id/suspend'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "suspendListing", null);
__decorate([
    (0, common_1.Patch)('listings/:id/approve'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "forceApproveListing", null);
__decorate([
    (0, common_1.Delete)('listings/:id'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteListing", null);
__decorate([
    (0, common_1.Get)('orders'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listOrders", null);
__decorate([
    (0, common_1.Get)('orders/:id'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Patch)('orders/:id/cancel'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "cancelOrder", null);
__decorate([
    (0, common_1.Patch)('orders/:id/refund'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __param(2, (0, common_1.Body)('amount')),
    __param(3, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "refundOrder", null);
__decorate([
    (0, common_1.Get)('withdrawals'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listWithdrawals", null);
__decorate([
    (0, common_1.Get)('withdrawals/:id'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getWithdrawal", null);
__decorate([
    (0, common_1.Patch)('withdrawals/:id/approve'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveWithdrawal", null);
__decorate([
    (0, common_1.Patch)('withdrawals/:id/reject'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectWithdrawal", null);
__decorate([
    (0, common_1.Get)('tickets'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('priority')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listTickets", null);
__decorate([
    (0, common_1.Get)('tickets/:id'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTicket", null);
__decorate([
    (0, common_1.Patch)('tickets/:id/status'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __param(2, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateTicketStatus", null);
__decorate([
    (0, common_1.Patch)('tickets/:id/priority'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __param(2, (0, common_1.Body)('priority')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateTicketPriority", null);
__decorate([
    (0, common_1.Patch)('tickets/:id/assign'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __param(2, (0, common_1.Body)('assigneeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "assignTicket", null);
__decorate([
    (0, common_1.Get)('categories'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listCategories", null);
__decorate([
    (0, common_1.Post)('categories'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Patch)('categories/:id'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateCategory", null);
__decorate([
    (0, common_1.Delete)('categories/:id'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteCategory", null);
__decorate([
    (0, common_1.Post)('categories/:categoryId/subcategories'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('categoryId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createSubcategory", null);
__decorate([
    (0, common_1.Patch)('subcategories/:id'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateSubcategory", null);
__decorate([
    (0, common_1.Delete)('subcategories/:id'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteSubcategory", null);
__decorate([
    (0, common_1.Get)('topup'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listTopups", null);
__decorate([
    (0, common_1.Post)('topup'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createTopup", null);
__decorate([
    (0, common_1.Patch)('topup/:id'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateTopup", null);
__decorate([
    (0, common_1.Delete)('topup/:id'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteTopup", null);
__decorate([
    (0, common_1.Get)('blog'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listBlogPosts", null);
__decorate([
    (0, common_1.Post)('blog'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createBlogPost", null);
__decorate([
    (0, common_1.Patch)('blog/:id'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateBlogPost", null);
__decorate([
    (0, common_1.Delete)('blog/:id'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteBlogPost", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    (0, common_1.UseGuards)(admin_password_guard_1.AdminPasswordGuard),
    __param(0, (0, common_1.Query)('action')),
    __param(1, (0, common_1.Query)('entityType')),
    __param(2, (0, common_1.Query)('actorId')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listAuditLogs", null);
exports.AdminController = AdminController = AdminController_1 = __decorate([
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map