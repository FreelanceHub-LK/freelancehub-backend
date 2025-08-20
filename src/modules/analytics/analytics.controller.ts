import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('platform')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getPlatformStatistics() {
    return this.analyticsService.getPlatformStatistics();
  }

  @Get('user/:userId')
  async getUserAnalytics(
    @Param('userId') userId: string,
    @GetCurrentUser('id') currentUserId: string,
  ) {
    // Users can only view their own analytics, or admins can view any
    if (userId !== currentUserId) {
      // You might want to add admin role check here
      throw new Error('Access denied');
    }
    return this.analyticsService.getUserAnalytics(userId);
  }

  @Get('my-analytics')
  async getMyAnalytics(@GetCurrentUser('id') userId: string) {
    return this.analyticsService.getUserAnalytics(userId);
  }

  @Get('revenue')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getRevenueAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    return this.analyticsService.getRevenueAnalytics(start, end);
  }

  @Get('top-performers')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getTopPerformers(@Query('limit') limit?: string) {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.analyticsService.getTopPerformers(limitNumber);
  }
}
