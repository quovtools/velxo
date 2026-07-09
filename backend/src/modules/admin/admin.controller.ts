import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common'
import { AdminService } from './admin.service'
import { AdminPasswordGuard } from '@/common/guards/admin-password.guard'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name)

  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  @UseGuards(AdminPasswordGuard)
  async getDashboard() {
    try {
      const stats = await this.adminService.getDashboardStats()
      return ApiResponseDto.ok(stats, 'Dashboard stats retrieved')
    } catch (error) {
      this.logger.error('Error fetching dashboard:', error)
      throw error
    }
  }

  @Get('listings/pending')
  @UseGuards(AdminPasswordGuard)
  async getPendingListings(@Query('limit') limit?: number) {
    try {
      const listings = await this.adminService.getPendingListings(limit)
      return ApiResponseDto.ok(listings, 'Pending listings retrieved')
    } catch (error) {
      this.logger.error('Error fetching pending listings:', error)
      throw error
    }
  }

  @Patch('listings/:id/approve')
  @UseGuards(AdminPasswordGuard)
  async approveListing(@Param('id') listingId: string, @CurrentUserId() moderatorId: string) {
    try {
      const listing = await this.adminService.approveListing(listingId, moderatorId)
      return ApiResponseDto.ok(listing, 'Listing approved successfully')
    } catch (error) {
      this.logger.error('Error approving listing:', error)
      throw error
    }
  }

  @Patch('listings/:id/reject')
  @UseGuards(AdminPasswordGuard)
  async rejectListing(
    @Param('id') listingId: string,
    @CurrentUserId() moderatorId: string,
    @Body('reason') reason: string,
  ) {
    try {
      const listing = await this.adminService.rejectListing(listingId, moderatorId, reason)
      return ApiResponseDto.ok(listing, 'Listing rejected successfully')
    } catch (error) {
      this.logger.error('Error rejecting listing:', error)
      throw error
    }
  }

  @Get('fraud/flagged-listings')
  @UseGuards(AdminPasswordGuard)
  async getFlaggedListings(@Query('limit') limit?: number) {
    try {
      const listings = await this.adminService.getFlaggedListings(limit)
      return ApiResponseDto.ok(listings, 'Flagged listings retrieved')
    } catch (error) {
      this.logger.error('Error fetching flagged listings:', error)
      throw error
    }
  }

  @Get('fraud/suspicious-users')
  @UseGuards(AdminPasswordGuard)
  async getSuspiciousUsers(@Query('limit') limit?: number) {
    try {
      const users = await this.adminService.getSuspiciousUsers(limit)
      return ApiResponseDto.ok(users, 'Suspicious users retrieved')
    } catch (error) {
      this.logger.error('Error fetching suspicious users:', error)
      throw error
    }
  }

  @Get('analytics/revenue')
  @UseGuards(AdminPasswordGuard)
  async getRevenueAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    try {
      const analytics = await this.adminService.getRevenueAnalytics(
        new Date(startDate),
        new Date(endDate),
      )
      return ApiResponseDto.ok(analytics, 'Revenue analytics retrieved')
    } catch (error) {
      this.logger.error('Error fetching revenue analytics:', error)
      throw error
    }
  }

  @Get('sellers/:sellerId/metrics')
  @UseGuards(AdminPasswordGuard)
  async getSellerMetrics(@Param('sellerId') sellerId: string) {
    try {
      const metrics = await this.adminService.getSellerMetrics(sellerId)
      return ApiResponseDto.ok(metrics, 'Seller metrics retrieved')
    } catch (error) {
      this.logger.error('Error fetching seller metrics:', error)
      throw error
    }
  }

  @Get('kyc/pending')
  @UseGuards(AdminPasswordGuard)
  async getPendingKyc(@Query('limit') limit?: number) {
    try {
      const submissions = await this.adminService.getPendingKyc(limit)
      return ApiResponseDto.ok(submissions, 'Pending KYC submissions retrieved')
    } catch (error) {
      this.logger.error('Error fetching pending KYC:', error)
      throw error
    }
  }

  @Patch('kyc/:sellerId/approve')
  @UseGuards(AdminPasswordGuard)
  async approveKyc(
    @Param('sellerId') sellerId: string,
    @CurrentUserId() moderatorId: string,
  ) {
    try {
      const seller = await this.adminService.approveKyc(sellerId, moderatorId)
      return ApiResponseDto.ok(seller, 'KYC approved successfully')
    } catch (error) {
      this.logger.error('Error approving KYC:', error)
      throw error
    }
  }

  @Patch('kyc/:sellerId/reject')
  @UseGuards(AdminPasswordGuard)
  async rejectKyc(
    @Param('sellerId') sellerId: string,
    @CurrentUserId() moderatorId: string,
    @Body('reason') reason: string,
  ) {
    try {
      const seller = await this.adminService.rejectKyc(sellerId, moderatorId, reason)
      return ApiResponseDto.ok(seller, 'KYC rejected')
    } catch (error) {
      this.logger.error('Error rejecting KYC:', error)
      throw error
    }
  }

  // ---------------------------------------------------------------------------
  // USERS
  // ---------------------------------------------------------------------------
  @Get('users')
  @UseGuards(AdminPasswordGuard)
  async listUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const result = await this.adminService.listUsers({ search, role, status, page, limit })
      return ApiResponseDto.ok(result.items, 'Users retrieved', result.pagination)
    } catch (error) {
      this.logger.error('Error listing users:', error)
      throw error
    }
  }

  @Get('users/:id')
  @UseGuards(AdminPasswordGuard)
  async getUser(@Param('id') id: string) {
    try {
      const user = await this.adminService.getUser(id)
      return ApiResponseDto.ok(user, user ? 'User retrieved' : 'User not found')
    } catch (error) {
      this.logger.error('Error fetching user:', error)
      throw error
    }
  }

  @Patch('users/:id/ban')
  @UseGuards(AdminPasswordGuard)
  async banUser(
    @Param('id') id: string,
    @CurrentUserId() moderatorId: string,
    @Body('reason') reason?: string,
  ) {
    try {
      const user = await this.adminService.setUserBan(id, true, reason, moderatorId)
      return ApiResponseDto.ok(user, 'User banned')
    } catch (error) {
      this.logger.error('Error banning user:', error)
      throw error
    }
  }

  @Patch('users/:id/unban')
  @UseGuards(AdminPasswordGuard)
  async unbanUser(@Param('id') id: string, @CurrentUserId() moderatorId: string) {
    try {
      const user = await this.adminService.setUserBan(id, false, undefined, moderatorId)
      return ApiResponseDto.ok(user, 'User unbanned')
    } catch (error) {
      this.logger.error('Error unbanning user:', error)
      throw error
    }
  }

  @Patch('users/:id/active')
  @UseGuards(AdminPasswordGuard)
  async setUserActive(
    @Param('id') id: string,
    @CurrentUserId() moderatorId: string,
    @Body('active') active: boolean,
  ) {
    try {
      const user = await this.adminService.setUserActive(id, active, moderatorId)
      return ApiResponseDto.ok(user, `User ${active ? 'activated' : 'deactivated'}`)
    } catch (error) {
      this.logger.error('Error updating user active state:', error)
      throw error
    }
  }

  @Patch('users/:id/role')
  @UseGuards(AdminPasswordGuard)
  async changeUserRole(
    @Param('id') id: string,
    @CurrentUserId() moderatorId: string,
    @Body('role') role: string,
  ) {
    try {
      const user = await this.adminService.changeUserRole(id, role as any, moderatorId)
      return ApiResponseDto.ok(user, 'User role updated')
    } catch (error) {
      this.logger.error('Error changing user role:', error)
      throw error
    }
  }

  @Patch('users/:id/verify-email')
  @UseGuards(AdminPasswordGuard)
  async verifyUserEmail(@Param('id') id: string, @CurrentUserId() moderatorId: string) {
    try {
      const user = await this.adminService.verifyUserEmail(id, moderatorId)
      return ApiResponseDto.ok(user, 'User email verified')
    } catch (error) {
      this.logger.error('Error verifying user email:', error)
      throw error
    }
  }

  // ---------------------------------------------------------------------------
  // SELLERS
  // ---------------------------------------------------------------------------
  @Get('sellers')
  @UseGuards(AdminPasswordGuard)
  async listSellers(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const result = await this.adminService.listSellers({ search, status, page, limit })
      return ApiResponseDto.ok(result.items, 'Sellers retrieved', result.pagination)
    } catch (error) {
      this.logger.error('Error listing sellers:', error)
      throw error
    }
  }

  @Get('sellers/:id')
  @UseGuards(AdminPasswordGuard)
  async getSeller(@Param('id') id: string) {
    try {
      const seller = await this.adminService.getSellerAdmin(id)
      return ApiResponseDto.ok(seller, seller ? 'Seller retrieved' : 'Seller not found')
    } catch (error) {
      this.logger.error('Error fetching seller:', error)
      throw error
    }
  }

  @Patch('sellers/:id/verify')
  @UseGuards(AdminPasswordGuard)
  async verifySeller(
    @Param('id') id: string,
    @CurrentUserId() moderatorId: string,
    @Body('verified') verified: boolean,
  ) {
    try {
      const seller = await this.adminService.setSellerVerified(id, verified ?? true, moderatorId)
      return ApiResponseDto.ok(seller, 'Seller verification updated')
    } catch (error) {
      this.logger.error('Error updating seller verification:', error)
      throw error
    }
  }

  @Patch('sellers/:id/suspend')
  @UseGuards(AdminPasswordGuard)
  async suspendSeller(
    @Param('id') id: string,
    @CurrentUserId() moderatorId: string,
    @Body('suspended') suspended: boolean,
    @Body('reason') reason?: string,
  ) {
    try {
      const seller = await this.adminService.setSellerSuspended(id, suspended ?? true, reason || '', moderatorId)
      return ApiResponseDto.ok(seller, `Seller ${suspended ? 'suspended' : 'reinstated'}`)
    } catch (error) {
      this.logger.error('Error updating seller suspension:', error)
      throw error
    }
  }

  @Patch('sellers/:id/feature')
  @UseGuards(AdminPasswordGuard)
  async featureSeller(
    @Param('id') id: string,
    @CurrentUserId() moderatorId: string,
    @Body('featured') featured: boolean,
  ) {
    try {
      const seller = await this.adminService.setSellerFeatured(id, featured ?? true, moderatorId)
      return ApiResponseDto.ok(seller, 'Seller featured state updated')
    } catch (error) {
      this.logger.error('Error updating seller featured state:', error)
      throw error
    }
  }

  // ---------------------------------------------------------------------------
  // LISTINGS
  // ---------------------------------------------------------------------------
  @Get('listings')
  @UseGuards(AdminPasswordGuard)
  async listListings(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('game') game?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const result = await this.adminService.listListings({ search, status, game, page, limit })
      return ApiResponseDto.ok(result.items, 'Listings retrieved', result.pagination)
    } catch (error) {
      this.logger.error('Error listing listings:', error)
      throw error
    }
  }

  @Get('listings/:id')
  @UseGuards(AdminPasswordGuard)
  async getListing(@Param('id') id: string) {
    try {
      const listing = await this.adminService.getListingAdmin(id)
      return ApiResponseDto.ok(listing, listing ? 'Listing retrieved' : 'Listing not found')
    } catch (error) {
      this.logger.error('Error fetching listing:', error)
      throw error
    }
  }

  @Patch('listings/:id/feature')
  @UseGuards(AdminPasswordGuard)
  async featureListing(
    @Param('id') id: string,
    @CurrentUserId() moderatorId: string,
    @Body('featured') featured: boolean,
  ) {
    try {
      const listing = await this.adminService.setListingFeatured(id, featured ?? true, moderatorId)
      return ApiResponseDto.ok(listing, 'Listing featured state updated')
    } catch (error) {
      this.logger.error('Error featuring listing:', error)
      throw error
    }
  }

  @Patch('listings/:id/suspend')
  @UseGuards(AdminPasswordGuard)
  async suspendListing(
    @Param('id') id: string,
    @CurrentUserId() moderatorId: string,
    @Body('reason') reason?: string,
  ) {
    try {
      const listing = await this.adminService.suspendListing(id, reason || '', moderatorId)
      return ApiResponseDto.ok(listing, 'Listing suspended')
    } catch (error) {
      this.logger.error('Error suspending listing:', error)
      throw error
    }
  }

  @Patch('listings/:id/approve')
  @UseGuards(AdminPasswordGuard)
  async forceApproveListing(@Param('id') id: string, @CurrentUserId() moderatorId: string) {
    try {
      const listing = await this.adminService.forceApproveListing(id, moderatorId)
      return ApiResponseDto.ok(listing, 'Listing approved')
    } catch (error) {
      this.logger.error('Error approving listing:', error)
      throw error
    }
  }

  @Delete('listings/:id')
  @UseGuards(AdminPasswordGuard)
  async deleteListing(@Param('id') id: string, @CurrentUserId() moderatorId: string) {
    try {
      const result = await this.adminService.deleteListing(id, moderatorId)
      return ApiResponseDto.ok(result, 'Listing deleted')
    } catch (error) {
      this.logger.error('Error deleting listing:', error)
      throw error
    }
  }

  // ---------------------------------------------------------------------------
  // ORDERS
  // ---------------------------------------------------------------------------
  @Get('orders')
  @UseGuards(AdminPasswordGuard)
  async listOrders(
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const result = await this.adminService.listOrders({ status, page, limit })
      return ApiResponseDto.ok(result.items, 'Orders retrieved', result.pagination)
    } catch (error) {
      this.logger.error('Error listing orders:', error)
      throw error
    }
  }

  @Get('orders/:id')
  @UseGuards(AdminPasswordGuard)
  async getOrder(@Param('id') id: string) {
    try {
      const order = await this.adminService.getOrderAdmin(id)
      return ApiResponseDto.ok(order, order ? 'Order retrieved' : 'Order not found')
    } catch (error) {
      this.logger.error('Error fetching order:', error)
      throw error
    }
  }

  @Patch('orders/:id/cancel')
  @UseGuards(AdminPasswordGuard)
  async cancelOrder(
    @Param('id') id: string,
    @CurrentUserId() moderatorId: string,
    @Body('reason') reason?: string,
  ) {
    try {
      const order = await this.adminService.cancelOrder(id, reason || '', moderatorId)
      return ApiResponseDto.ok(order, 'Order cancelled')
    } catch (error) {
      this.logger.error('Error cancelling order:', error)
      throw error
    }
  }

  @Patch('orders/:id/refund')
  @UseGuards(AdminPasswordGuard)
  async refundOrder(
    @Param('id') id: string,
    @CurrentUserId() moderatorId: string,
    @Body('amount') amount: number,
    @Body('reason') reason?: string,
  ) {
    try {
      const order = await this.adminService.refundOrder(id, amount, reason || '', moderatorId)
      return ApiResponseDto.ok(order, 'Order refunded')
    } catch (error) {
      this.logger.error('Error refunding order:', error)
      throw error
    }
  }

  // ---------------------------------------------------------------------------
  // WITHDRAWALS / PAYOUTS
  // ---------------------------------------------------------------------------
  @Get('withdrawals')
  @UseGuards(AdminPasswordGuard)
  async listWithdrawals(
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const result = await this.adminService.listWithdrawals({ status, page, limit })
      return ApiResponseDto.ok(result.items, 'Withdrawals retrieved', result.pagination)
    } catch (error) {
      this.logger.error('Error listing withdrawals:', error)
      throw error
    }
  }

  @Get('withdrawals/:id')
  @UseGuards(AdminPasswordGuard)
  async getWithdrawal(@Param('id') id: string) {
    try {
      const withdrawal = await this.adminService.getWithdrawal(id)
      return ApiResponseDto.ok(withdrawal, withdrawal ? 'Withdrawal retrieved' : 'Withdrawal not found')
    } catch (error) {
      this.logger.error('Error fetching withdrawal:', error)
      throw error
    }
  }

  @Patch('withdrawals/:id/approve')
  @UseGuards(AdminPasswordGuard)
  async approveWithdrawal(@Param('id') id: string, @CurrentUserId() moderatorId: string) {
    try {
      const withdrawal = await this.adminService.approveWithdrawal(id, moderatorId)
      return ApiResponseDto.ok(withdrawal, 'Withdrawal approved')
    } catch (error) {
      this.logger.error('Error approving withdrawal:', error)
      throw error
    }
  }

  @Patch('withdrawals/:id/reject')
  @UseGuards(AdminPasswordGuard)
  async rejectWithdrawal(
    @Param('id') id: string,
    @CurrentUserId() moderatorId: string,
    @Body('reason') reason?: string,
  ) {
    try {
      const withdrawal = await this.adminService.rejectWithdrawal(id, reason || '', moderatorId)
      return ApiResponseDto.ok(withdrawal, 'Withdrawal rejected')
    } catch (error) {
      this.logger.error('Error rejecting withdrawal:', error)
      throw error
    }
  }

  // ---------------------------------------------------------------------------
  // SUPPORT TICKETS
  // ---------------------------------------------------------------------------
  @Get('tickets')
  @UseGuards(AdminPasswordGuard)
  async listTickets(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const result = await this.adminService.listTickets({ status, category, priority, page, limit })
      return ApiResponseDto.ok(result.items, 'Tickets retrieved', result.pagination)
    } catch (error) {
      this.logger.error('Error listing tickets:', error)
      throw error
    }
  }

  @Get('tickets/:id')
  @UseGuards(AdminPasswordGuard)
  async getTicket(@Param('id') id: string) {
    try {
      const ticket = await this.adminService.getTicket(id)
      return ApiResponseDto.ok(ticket, ticket ? 'Ticket retrieved' : 'Ticket not found')
    } catch (error) {
      this.logger.error('Error fetching ticket:', error)
      throw error
    }
  }

  @Patch('tickets/:id/status')
  @UseGuards(AdminPasswordGuard)
  async updateTicketStatus(
    @Param('id') id: string,
    @CurrentUserId() moderatorId: string,
    @Body('status') status: string,
  ) {
    try {
      const ticket = await this.adminService.updateTicketStatus(id, status, moderatorId)
      return ApiResponseDto.ok(ticket, 'Ticket status updated')
    } catch (error) {
      this.logger.error('Error updating ticket status:', error)
      throw error
    }
  }

  @Patch('tickets/:id/priority')
  @UseGuards(AdminPasswordGuard)
  async updateTicketPriority(
    @Param('id') id: string,
    @CurrentUserId() moderatorId: string,
    @Body('priority') priority: string,
  ) {
    try {
      const ticket = await this.adminService.updateTicketPriority(id, priority, moderatorId)
      return ApiResponseDto.ok(ticket, 'Ticket priority updated')
    } catch (error) {
      this.logger.error('Error updating ticket priority:', error)
      throw error
    }
  }

  @Patch('tickets/:id/assign')
  @UseGuards(AdminPasswordGuard)
  async assignTicket(
    @Param('id') id: string,
    @CurrentUserId() moderatorId: string,
    @Body('assigneeId') assigneeId: string,
  ) {
    try {
      const ticket = await this.adminService.assignTicket(id, assigneeId, moderatorId)
      return ApiResponseDto.ok(ticket, 'Ticket assigned')
    } catch (error) {
      this.logger.error('Error assigning ticket:', error)
      throw error
    }
  }

  // ---------------------------------------------------------------------------
  // CATEGORIES & SUBCATEGORIES
  // ---------------------------------------------------------------------------
  @Get('categories')
  @UseGuards(AdminPasswordGuard)
  async listCategories() {
    try {
      const categories = await this.adminService.listCategories()
      return ApiResponseDto.ok(categories, 'Categories retrieved')
    } catch (error) {
      this.logger.error('Error listing categories:', error)
      throw error
    }
  }

  @Post('categories')
  @UseGuards(AdminPasswordGuard)
  async createCategory(@Body() dto: any, @CurrentUserId() moderatorId: string) {
    try {
      const category = await this.adminService.createCategory(dto)
      return ApiResponseDto.ok(category, 'Category created')
    } catch (error) {
      this.logger.error('Error creating category:', error)
      throw error
    }
  }

  @Patch('categories/:id')
  @UseGuards(AdminPasswordGuard)
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUserId() moderatorId: string,
  ) {
    try {
      const category = await this.adminService.updateCategory(id, dto, moderatorId)
      return ApiResponseDto.ok(category, 'Category updated')
    } catch (error) {
      this.logger.error('Error updating category:', error)
      throw error
    }
  }

  @Delete('categories/:id')
  @UseGuards(AdminPasswordGuard)
  async deleteCategory(@Param('id') id: string, @CurrentUserId() moderatorId: string) {
    try {
      const result = await this.adminService.deleteCategory(id, moderatorId)
      return ApiResponseDto.ok(result, 'Category deleted')
    } catch (error) {
      this.logger.error('Error deleting category:', error)
      throw error
    }
  }

  @Post('categories/:categoryId/subcategories')
  @UseGuards(AdminPasswordGuard)
  async createSubcategory(
    @Param('categoryId') categoryId: string,
    @Body() dto: any,
    @CurrentUserId() moderatorId: string,
  ) {
    try {
      const sub = await this.adminService.createSubcategory(categoryId, dto, moderatorId)
      return ApiResponseDto.ok(sub, 'Subcategory created')
    } catch (error) {
      this.logger.error('Error creating subcategory:', error)
      throw error
    }
  }

  @Patch('subcategories/:id')
  @UseGuards(AdminPasswordGuard)
  async updateSubcategory(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUserId() moderatorId: string,
  ) {
    try {
      const sub = await this.adminService.updateSubcategory(id, dto, moderatorId)
      return ApiResponseDto.ok(sub, 'Subcategory updated')
    } catch (error) {
      this.logger.error('Error updating subcategory:', error)
      throw error
    }
  }

  @Delete('subcategories/:id')
  @UseGuards(AdminPasswordGuard)
  async deleteSubcategory(@Param('id') id: string, @CurrentUserId() moderatorId: string) {
    try {
      const result = await this.adminService.deleteSubcategory(id, moderatorId)
      return ApiResponseDto.ok(result, 'Subcategory deleted')
    } catch (error) {
      this.logger.error('Error deleting subcategory:', error)
      throw error
    }
  }

  // ---------------------------------------------------------------------------
  // TOPUP PRODUCTS
  // ---------------------------------------------------------------------------
  @Get('topup')
  @UseGuards(AdminPasswordGuard)
  async listTopups() {
    try {
      const products = await this.adminService.listTopups()
      return ApiResponseDto.ok(products, 'Topup products retrieved')
    } catch (error) {
      this.logger.error('Error listing topups:', error)
      throw error
    }
  }

  @Post('topup')
  @UseGuards(AdminPasswordGuard)
  async createTopup(@Body() dto: any, @CurrentUserId() moderatorId: string) {
    try {
      const product = await this.adminService.createTopup(dto)
      return ApiResponseDto.ok(product, 'Topup product created')
    } catch (error) {
      this.logger.error('Error creating topup:', error)
      throw error
    }
  }

  @Patch('topup/:id')
  @UseGuards(AdminPasswordGuard)
  async updateTopup(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUserId() moderatorId: string,
  ) {
    try {
      const product = await this.adminService.updateTopup(id, dto, moderatorId)
      return ApiResponseDto.ok(product, 'Topup product updated')
    } catch (error) {
      this.logger.error('Error updating topup:', error)
      throw error
    }
  }

  @Delete('topup/:id')
  @UseGuards(AdminPasswordGuard)
  async deleteTopup(@Param('id') id: string, @CurrentUserId() moderatorId: string) {
    try {
      const result = await this.adminService.deleteTopup(id, moderatorId)
      return ApiResponseDto.ok(result, 'Topup product deleted')
    } catch (error) {
      this.logger.error('Error deleting topup:', error)
      throw error
    }
  }

  // ---------------------------------------------------------------------------
  // BLOG
  // ---------------------------------------------------------------------------
  @Get('blog')
  @UseGuards(AdminPasswordGuard)
  async listBlogPosts() {
    try {
      const posts = await this.adminService.listBlogPosts()
      return ApiResponseDto.ok(posts, 'Blog posts retrieved')
    } catch (error) {
      this.logger.error('Error listing blog posts:', error)
      throw error
    }
  }

  @Post('blog')
  @UseGuards(AdminPasswordGuard)
  async createBlogPost(@Body() dto: any, @CurrentUserId() moderatorId: string) {
    try {
      const post = await this.adminService.createBlogPost(dto)
      return ApiResponseDto.ok(post, 'Blog post created')
    } catch (error) {
      this.logger.error('Error creating blog post:', error)
      throw error
    }
  }

  @Patch('blog/:id')
  @UseGuards(AdminPasswordGuard)
  async updateBlogPost(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUserId() moderatorId: string,
  ) {
    try {
      const post = await this.adminService.updateBlogPost(id, dto, moderatorId)
      return ApiResponseDto.ok(post, 'Blog post updated')
    } catch (error) {
      this.logger.error('Error updating blog post:', error)
      throw error
    }
  }

  @Delete('blog/:id')
  @UseGuards(AdminPasswordGuard)
  async deleteBlogPost(@Param('id') id: string, @CurrentUserId() moderatorId: string) {
    try {
      const result = await this.adminService.deleteBlogPost(id, moderatorId)
      return ApiResponseDto.ok(result, 'Blog post deleted')
    } catch (error) {
      this.logger.error('Error deleting blog post:', error)
      throw error
    }
  }

  // ---------------------------------------------------------------------------
  // AUDIT LOGS
  // ---------------------------------------------------------------------------
  @Get('audit-logs')
  @UseGuards(AdminPasswordGuard)
  async listAuditLogs(
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('actorId') actorId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const result = await this.adminService.listAuditLogs({ action, entityType, actorId, page, limit })
      return ApiResponseDto.ok(result.items, 'Audit logs retrieved', result.pagination)
    } catch (error) {
      this.logger.error('Error listing audit logs:', error)
      throw error
    }
  }
}
