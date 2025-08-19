import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException,
  Logger 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { 
  Review, 
  ReviewDocument, 
  ReviewType 
} from './schemas/review.schema';
import { 
  CreateReviewDto, 
  UpdateReviewDto, 
  QueryReviewDto,
  ReviewResponseDto 
} from './dto';

export interface ReviewListResult {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  detailedAverages?: {
    communication: number;
    quality: number;
    timeliness: number;
    professionalism: number;
    value: number;
  };
}

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
  ) {}

  async create(createReviewDto: CreateReviewDto, reviewerId: string): Promise<Review> {
    try {
      // Validate reviewer and reviewee are different
      if (reviewerId === createReviewDto.reviewee) {
        throw new BadRequestException('Cannot review yourself');
      }

      // Check if review already exists for this project
      const existingReview = await this.reviewModel.findOne({
        reviewer: reviewerId,
        reviewee: createReviewDto.reviewee,
        project: createReviewDto.project,
      });

      if (existingReview) {
        throw new BadRequestException('Review already exists for this project');
      }

      const review = new this.reviewModel({
        ...createReviewDto,
        reviewer: reviewerId,
      });

      const savedReview = await review.save();
      await savedReview.populate(['reviewer', 'reviewee', 'project', 'contract', 'skills']);
      
      this.logger.log(`Review created: ${savedReview._id}`);
      return savedReview;
    } catch (error) {
      this.logger.error(`Failed to create review: ${error.message}`);
      throw error;
    }
  }

  async findAll(page: number, limit: number): Promise<ReviewListResult>;
  async findAll(query: QueryReviewDto): Promise<ReviewListResult>;
  async findAll(pageOrQuery: number | QueryReviewDto, limit?: number): Promise<ReviewListResult> {
    try {
      let query: QueryReviewDto;
      
      if (typeof pageOrQuery === 'number') {
        query = { page: pageOrQuery, limit: limit || 10 };
      } else {
        query = pageOrQuery;
      }

      const filter: any = {};

      // Apply filters
      if (query.reviewer) {
        filter.reviewer = query.reviewer;
      }

      if (query.reviewee) {
        filter.reviewee = query.reviewee;
      }

      if (query.project) {
        filter.project = query.project;
      }

      if (query.type) {
        filter.type = query.type;
      }

      if (query.minRating || query.maxRating) {
        filter.rating = {};
        if (query.minRating) {
          filter.rating.$gte = query.minRating;
        }
        if (query.maxRating) {
          filter.rating.$lte = query.maxRating;
        }
      }

      if (query.search) {
        filter.$or = [
          { title: { $regex: query.search, $options: 'i' } },
          { comment: { $regex: query.search, $options: 'i' } }
        ];
      }

      if (query.isPublic !== undefined) {
        filter.isPublic = query.isPublic;
      }

      if (query.isVerified !== undefined) {
        filter.isVerified = query.isVerified;
      }

      if (!query.includeReported) {
        filter.isReported = false;
      }

      const skip = ((query.page || 1) - 1) * (query.limit || 10);
      const sortField = query.sortBy || 'createdAt';
      const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

      const [reviews, total] = await Promise.all([
        this.reviewModel
          .find(filter)
          .populate('reviewer', 'name email avatar')
          .populate('reviewee', 'name email avatar')
          .populate('project', 'title')
          .populate('contract', 'title')
          .populate('skills', 'name')
          .sort({ [sortField]: sortOrder })
          .skip(skip)
          .limit(query.limit || 10)
          .exec(),
        this.reviewModel.countDocuments(filter),
      ]);

      return {
        reviews,
        total,
        page: query.page || 1,
        limit: query.limit || 10,
        totalPages: Math.ceil(total / (query.limit || 10)),
      };
    } catch (error) {
      this.logger.error(`Failed to find reviews: ${error.message}`);
      throw new BadRequestException('Failed to retrieve reviews');
    }
  }

  async findOne(id: string): Promise<Review> {
    try {
      const review = await this.reviewModel
        .findById(id)
        .populate('reviewer', 'name email avatar')
        .populate('reviewee', 'name email avatar')
        .populate('project', 'title description')
        .populate('contract', 'title')
        .populate('skills', 'name')
        .exec();

      if (!review) {
        throw new NotFoundException('Review not found');
      }

      return review;
    } catch (error) {
      this.logger.error(`Failed to find review ${id}: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, updateReviewDto: UpdateReviewDto, userId: string): Promise<Review> {
    try {
      const review = await this.reviewModel.findById(id);

      if (!review) {
        throw new NotFoundException('Review not found');
      }

      // Only reviewer can update their review
      if (review.reviewer.toString() !== userId) {
        throw new ForbiddenException('Only the reviewer can update this review');
      }

      const updatedReview = await this.reviewModel
        .findByIdAndUpdate(id, updateReviewDto, { new: true })
        .populate('reviewer', 'name email avatar')
        .populate('reviewee', 'name email avatar')
        .populate('project', 'title')
        .populate('contract', 'title')
        .populate('skills', 'name')
        .exec();

      if (!updatedReview) {
        throw new NotFoundException('Review not found');
      }

      this.logger.log(`Review updated: ${id}`);
      return updatedReview;
    } catch (error) {
      this.logger.error(`Failed to update review ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    try {
      const review = await this.reviewModel.findById(id);

      if (!review) {
        throw new NotFoundException('Review not found');
      }

      // Only reviewer can delete their review
      if (review.reviewer.toString() !== userId) {
        throw new ForbiddenException('Only the reviewer can delete this review');
      }

      await this.reviewModel.findByIdAndDelete(id);
      this.logger.log(`Review deleted: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete review ${id}: ${error.message}`);
      throw error;
    }
  }

  async respondToReview(id: string, responseDto: ReviewResponseDto, userId: string): Promise<Review> {
    try {
      const review = await this.reviewModel.findById(id);

      if (!review) {
        throw new NotFoundException('Review not found');
      }

      // Only reviewee can respond to the review
      if (review.reviewee.toString() !== userId) {
        throw new ForbiddenException('Only the reviewee can respond to this review');
      }

      if (review.response) {
        throw new BadRequestException('Review has already been responded to');
      }

      const updatedReview = await this.reviewModel
        .findByIdAndUpdate(
          id,
          {
            response: {
              comment: responseDto.comment,
              respondedAt: new Date(),
            }
          },
          { new: true }
        )
        .populate('reviewer', 'name email avatar')
        .populate('reviewee', 'name email avatar')
        .populate('project', 'title')
        .populate('contract', 'title')
        .populate('skills', 'name')
        .exec();

      if (!updatedReview) {
        throw new NotFoundException('Review not found');
      }

      this.logger.log(`Review response added: ${id}`);
      return updatedReview;
    } catch (error) {
      this.logger.error(`Failed to respond to review ${id}: ${error.message}`);
      throw error;
    }
  }

  async getReviewStats(userId: string, type?: ReviewType): Promise<ReviewStats> {
    try {
      const filter: any = { reviewee: userId, isPublic: true, isReported: false };
      
      if (type) {
        filter.type = type;
      }

      const reviews = await this.reviewModel.find(filter);

      if (reviews.length === 0) {
        return {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
      }

      // Calculate average rating
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = Number((totalRating / reviews.length).toFixed(1));

      // Calculate rating distribution
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach(review => {
        ratingDistribution[review.rating]++;
      });

      // Calculate detailed averages if available
      let detailedAverages;
      const reviewsWithDetails = reviews.filter(r => r.detailedRatings);
      
      if (reviewsWithDetails.length > 0) {
        const detailedTotals = {
          communication: 0,
          quality: 0,
          timeliness: 0,
          professionalism: 0,
          value: 0,
        };

        reviewsWithDetails.forEach(review => {
          if (review.detailedRatings) {
            detailedTotals.communication += review.detailedRatings.communication || 0;
            detailedTotals.quality += review.detailedRatings.quality || 0;
            detailedTotals.timeliness += review.detailedRatings.timeliness || 0;
            detailedTotals.professionalism += review.detailedRatings.professionalism || 0;
            detailedTotals.value += review.detailedRatings.value || 0;
          }
        });

        detailedAverages = {
          communication: Number((detailedTotals.communication / reviewsWithDetails.length).toFixed(1)),
          quality: Number((detailedTotals.quality / reviewsWithDetails.length).toFixed(1)),
          timeliness: Number((detailedTotals.timeliness / reviewsWithDetails.length).toFixed(1)),
          professionalism: Number((detailedTotals.professionalism / reviewsWithDetails.length).toFixed(1)),
          value: Number((detailedTotals.value / reviewsWithDetails.length).toFixed(1)),
        };
      }

      return {
        totalReviews: reviews.length,
        averageRating,
        ratingDistribution,
        detailedAverages,
      };
    } catch (error) {
      this.logger.error(`Failed to get review stats: ${error.message}`);
      throw new BadRequestException('Failed to retrieve review statistics');
    }
  }

  async reportReview(id: string, reason: string, userId: string): Promise<void> {
    try {
      const review = await this.reviewModel.findById(id);

      if (!review) {
        throw new NotFoundException('Review not found');
      }

      if (review.isReported) {
        throw new BadRequestException('Review has already been reported');
      }

      // Cannot report your own review
      if (review.reviewer.toString() === userId) {
        throw new BadRequestException('Cannot report your own review');
      }

      await this.reviewModel.findByIdAndUpdate(id, {
        isReported: true,
        reportDetails: {
          reason,
          reportedBy: userId,
          reportedAt: new Date(),
          status: 'pending',
        }
      });

      this.logger.log(`Review reported: ${id} by user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to report review ${id}: ${error.message}`);
      throw error;
    }
  }

  async getReviewsForUser(
    userId: string,
    page = 1,
    limit = 10,
    type?: 'received' | 'given'
  ): Promise<ReviewListResult> {
    const filter: any = {};
    
    if (type === 'received') {
      filter.reviewee = userId;
    } else if (type === 'given') {
      filter.reviewer = userId;
    } else {
      filter.$or = [{ reviewee: userId }, { reviewer: userId }];
    }

    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .populate('reviewer', 'name email avatar')
        .populate('reviewee', 'name email avatar')
        .populate('project', 'title')
        .populate('contract', 'title')
        .populate('skills', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reviewModel.countDocuments(filter),
    ]);

    return {
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getReviewsForProject(
    projectId: string,
    page = 1,
    limit = 10
  ): Promise<ReviewListResult> {
    const filter = { project: projectId };
    const skip = (page - 1) * limit;
    
    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .populate('reviewer', 'name email avatar')
        .populate('reviewee', 'name email avatar')
        .populate('project', 'title')
        .populate('contract', 'title')
        .populate('skills', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reviewModel.countDocuments(filter),
    ]);

    return {
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async flagReview(reviewId: string, flaggedBy: string, reason: string): Promise<Review> {
    const review = await this.reviewModel.findById(reviewId);
    
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const updatedReview = await this.reviewModel
      .findByIdAndUpdate(
        reviewId,
        {
          isReported: true,
          reportedBy: flaggedBy,
          reportReason: reason,
          reportedAt: new Date(),
        },
        { new: true }
      )
      .populate('reviewer', 'name email avatar')
      .populate('reviewee', 'name email avatar')
      .exec();

    return updatedReview!;
  }

  async bulkCreateReviews(reviews: CreateReviewDto[]): Promise<Review[]> {
    const createdReviews = await this.reviewModel.insertMany(reviews);
    return createdReviews as any; // Type assertion to handle Mongoose document type
  }

  async verifyReview(id: string): Promise<Review> {
    try {
      const review = await this.reviewModel.findById(id);

      if (!review) {
        throw new NotFoundException('Review not found');
      }

      const updatedReview = await this.reviewModel
        .findByIdAndUpdate(id, { isVerified: true }, { new: true })
        .populate('reviewer', 'name email avatar')
        .populate('reviewee', 'name email avatar')
        .populate('project', 'title')
        .populate('contract', 'title')
        .populate('skills', 'name')
        .exec();

      if (!updatedReview) {
        throw new NotFoundException('Review not found');
      }

      this.logger.log(`Review verified: ${id}`);
      return updatedReview;
    } catch (error) {
      this.logger.error(`Failed to verify review ${id}: ${error.message}`);
      throw error;
    }
  }
}
