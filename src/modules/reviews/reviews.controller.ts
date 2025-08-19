import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { UserRole } from '../users/schemas/user.schema';

@Controller('reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Roles(UserRole.CLIENT, UserRole.FREELANCER)
  async create(@Body() createReviewDto: CreateReviewDto, @Request() req) {
    return this.reviewsService.create(createReviewDto, req.user.id);
  }

  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.reviewsService.findAll(
      Number(page),
      Number(limit),
    );
  }

  @Get('stats/:userId')
  async getReviewStats(@Param('userId') userId: string) {
    return this.reviewsService.getReviewStats(userId);
  }

  @Get('user/:userId')
  async getReviewsForUser(
    @Param('userId') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('type') type?: 'received' | 'given',
  ) {
    return this.reviewsService.getReviewsForUser(
      userId,
      Number(page),
      Number(limit),
      type,
    );
  }

  @Get('project/:projectId')
  async getReviewsForProject(
    @Param('projectId') projectId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.reviewsService.getReviewsForProject(
      projectId,
      Number(page),
      Number(limit),
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const review = await this.reviewsService.findOne(id);
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    return review;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Request() req,
  ) {
    const review = await this.reviewsService.findOne(id);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only the reviewer can update their review
    if (review.reviewer.toString() !== req.user.id) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    // Only allow updates within 24 hours of creation
    const hoursSinceCreation = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      throw new BadRequestException('Reviews can only be updated within 24 hours of creation');
    }

    return this.reviewsService.update(id, updateReviewDto, req.user.id);
  }

  @Post(':id/respond')
  async respondToReview(
    @Param('id') id: string,
    @Body() respondToReviewDto: ReviewResponseDto,
    @Request() req,
  ) {
    const review = await this.reviewsService.findOne(id);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only the reviewee can respond to their review
    if (review.reviewee.toString() !== req.user.id) {
      throw new ForbiddenException('You can only respond to reviews about you');
    }

    return this.reviewsService.respondToReview(id, respondToReviewDto, req.user.id);
  }

  @Post(':id/verify')
  @Roles(UserRole.ADMIN)
  async verifyReview(@Param('id') id: string) {
    return this.reviewsService.verifyReview(id);
  }

  @Post(':id/flag')
  @Roles(UserRole.CLIENT, UserRole.FREELANCER)
  async flagReview(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('Reason is required for flagging a review');
    }

    return this.reviewsService.flagReview(id, req.user.id, reason);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const review = await this.reviewsService.findOne(id);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only admins or the reviewer can delete a review
    if (req.user.role !== UserRole.ADMIN && review.reviewer.toString() !== req.user.id) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    return this.reviewsService.remove(id, req.user.id);
  }

  @Post('bulk-import')
  @Roles(UserRole.ADMIN)
  async bulkImportReviews(@Body() reviews: CreateReviewDto[]) {
    return this.reviewsService.bulkCreateReviews(reviews);
  }
}
