import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { Project } from '../projects/schemas/project.schema';
import { Contract } from '../contracts/schemas/contract.schema';
import { Payment } from '../payments/schemas/payment.schema';
import { Review } from '../reviews/schemas/review.schema';
import { Dispute } from '../disputes/schemas/dispute.schema';

export interface PlatformStatistics {
  users: {
    total: number;
    freelancers: number;
    clients: number;
    newThisMonth: number;
    activeThisMonth: number;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    totalBudget: number;
    averageBudget: number;
  };
  contracts: {
    total: number;
    active: number;
    completed: number;
    totalValue: number;
  };
  payments: {
    totalProcessed: number;
    totalAmount: number;
    platformFees: number;
    averageTransactionValue: number;
  };
  reviews: {
    total: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
  };
  disputes: {
    total: number;
    resolved: number;
    pending: number;
    resolutionRate: number;
  };
}

export interface UserAnalytics {
  profileViews: number;
  projectsPosted?: number;
  projectsCompleted: number;
  totalEarnings?: number;
  totalSpent?: number;
  averageRating: number;
  responseTime: number;
  completionRate: number;
}

export interface RevenueAnalytics {
  daily: { date: string; amount: number; fees: number }[];
  monthly: { month: string; amount: number; fees: number }[];
  byCategory: { category: string; amount: number }[];
  byUserType: { freelancer: number; client: number };
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('Project') private projectModel: Model<Project>,
    @InjectModel('Contract') private contractModel: Model<Contract>,
    @InjectModel('Payment') private paymentModel: Model<Payment>,
    @InjectModel('Review') private reviewModel: Model<Review>,
    @InjectModel('Dispute') private disputeModel: Model<Dispute>,
  ) {}

  async getPlatformStatistics(): Promise<PlatformStatistics> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // User statistics
      const [
        totalUsers,
        totalFreelancers,
        totalClients,
        newUsersThisMonth,
        activeUsersThisMonth,
      ] = await Promise.all([
        this.userModel.countDocuments(),
        this.userModel.countDocuments({ role: 'freelancer' }),
        this.userModel.countDocuments({ role: 'client' }),
        this.userModel.countDocuments({ createdAt: { $gte: startOfMonth } }),
        this.userModel.countDocuments({ 
          lastActive: { $gte: startOfMonth },
        }),
      ]);

      // Project statistics
      const projectStats = await this.projectModel.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            totalBudget: { $sum: '$budget.max' },
            avgBudget: { $avg: '$budget.max' },
          },
        },
      ]);

      // Contract statistics
      const contractStats = await this.contractModel.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            totalValue: { $sum: '$amount' },
          },
        },
      ]);

      // Payment statistics
      const paymentStats = await this.paymentModel.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            platformFees: { $sum: '$platformFee' },
            avgTransaction: { $avg: '$amount' },
          },
        },
      ]);

      // Review statistics
      const reviewStats = await this.reviewModel.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            avgRating: { $avg: '$rating' },
          },
        },
      ]);

      const ratingDistribution = await this.reviewModel.aggregate([
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 },
          },
        },
      ]);

      // Dispute statistics
      const disputeStats = await this.disputeModel.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $ne: ['$status', 'resolved'] }, 1, 0] } },
          },
        },
      ]);

      const projectData = projectStats[0] || {};
      const contractData = contractStats[0] || {};
      const paymentData = paymentStats[0] || {};
      const reviewData = reviewStats[0] || {};
      const disputeData = disputeStats[0] || {};

      const ratingDist: Record<number, number> = {};
      for (let i = 1; i <= 5; i++) {
        ratingDist[i] = ratingDistribution.find(r => r._id === i)?.count || 0;
      }

      return {
        users: {
          total: totalUsers,
          freelancers: totalFreelancers,
          clients: totalClients,
          newThisMonth: newUsersThisMonth,
          activeThisMonth: activeUsersThisMonth,
        },
        projects: {
          total: projectData.total || 0,
          active: projectData.active || 0,
          completed: projectData.completed || 0,
          totalBudget: projectData.totalBudget || 0,
          averageBudget: projectData.avgBudget || 0,
        },
        contracts: {
          total: contractData.total || 0,
          active: contractData.active || 0,
          completed: contractData.completed || 0,
          totalValue: contractData.totalValue || 0,
        },
        payments: {
          totalProcessed: paymentData.total || 0,
          totalAmount: paymentData.totalAmount || 0,
          platformFees: paymentData.platformFees || 0,
          averageTransactionValue: paymentData.avgTransaction || 0,
        },
        reviews: {
          total: reviewData.total || 0,
          averageRating: reviewData.avgRating || 0,
          ratingDistribution: ratingDist,
        },
        disputes: {
          total: disputeData.total || 0,
          resolved: disputeData.resolved || 0,
          pending: disputeData.pending || 0,
          resolutionRate: disputeData.total > 0 ? 
            (disputeData.resolved / disputeData.total) * 100 : 0,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get platform statistics: ${error.message}`);
      throw error;
    }
  }

  async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const [
        projectsPosted,
        contractsCompleted,
        totalEarnings,
        totalSpent,
        userReviews,
      ] = await Promise.all([
        user.role === 'client' ? 
          this.projectModel.countDocuments({ clientId: userId }) : null,
        this.contractModel.countDocuments({ 
          $or: [{ freelancerId: userId }, { clientId: userId }],
          status: 'completed',
        }),
        this.paymentModel.aggregate([
          { $match: { recipientId: userId } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        this.paymentModel.aggregate([
          { $match: { payerId: userId } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        this.reviewModel.find({
          $or: [{ revieweeId: userId }],
        }),
      ]);

      const earnings = totalEarnings[0]?.total || 0;
      const spent = totalSpent[0]?.total || 0;
      const averageRating = userReviews.length > 0 ? 
        userReviews.reduce((sum, review) => sum + review.rating, 0) / userReviews.length : 0;

      return {
        profileViews: 0, // User schema doesn't have profileViews, setting default
        projectsPosted: projectsPosted || undefined,
        projectsCompleted: contractsCompleted,
        totalEarnings: user.role === 'freelancer' ? earnings : undefined,
        totalSpent: user.role === 'client' ? spent : undefined,
        averageRating,
        responseTime: 0, // User schema doesn't have averageResponseTime, setting default
        completionRate: 0, // User schema doesn't have completionRate, setting default
      };
    } catch (error) {
      this.logger.error(`Failed to get user analytics for ${userId}: ${error.message}`);
      throw error;
    }
  }

  async getRevenueAnalytics(
    startDate: Date,
    endDate: Date,
  ): Promise<RevenueAnalytics> {
    try {
      // Daily revenue
      const dailyRevenue = await this.paymentModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed',
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            amount: { $sum: '$amount' },
            fees: { $sum: '$platformFee' },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Monthly revenue
      const monthlyRevenue = await this.paymentModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed',
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            amount: { $sum: '$amount' },
            fees: { $sum: '$platformFee' },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Revenue by category (you'd need to join with projects/contracts to get categories)
      const categoryRevenue = await this.paymentModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed',
          },
        },
        {
          $lookup: {
            from: 'projects',
            localField: 'projectId',
            foreignField: '_id',
            as: 'project',
          },
        },
        { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'categories',
            localField: 'project.category',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$category.name',
            amount: { $sum: '$amount' },
          },
        },
      ]);

      // Revenue by user type
      const userTypeRevenue = await this.paymentModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'payerId',
            foreignField: '_id',
            as: 'payer',
          },
        },
        { $unwind: '$payer' },
        {
          $group: {
            _id: '$payer.userType',
            amount: { $sum: '$amount' },
          },
        },
      ]);

      return {
        daily: dailyRevenue.map(item => ({
          date: item._id,
          amount: item.amount,
          fees: item.fees,
        })),
        monthly: monthlyRevenue.map(item => ({
          month: item._id,
          amount: item.amount,
          fees: item.fees,
        })),
        byCategory: categoryRevenue.map(item => ({
          category: item._id || 'Uncategorized',
          amount: item.amount,
        })),
        byUserType: {
          freelancer: userTypeRevenue.find(item => item._id === 'freelancer')?.amount || 0,
          client: userTypeRevenue.find(item => item._id === 'client')?.amount || 0,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get revenue analytics: ${error.message}`);
      throw error;
    }
  }

  async getTopPerformers(limit: number = 10): Promise<{
    topFreelancers: any[];
    topClients: any[];
    topProjects: any[];
  }> {
    try {
      // Top freelancers by earnings
      const topFreelancers = await this.userModel.aggregate([
        { $match: { userType: 'freelancer' } },
        {
          $lookup: {
            from: 'payments',
            localField: '_id',
            foreignField: 'recipientId',
            as: 'payments',
          },
        },
        {
          $addFields: {
            totalEarnings: { $sum: '$payments.amount' },
            paymentCount: { $size: '$payments' },
          },
        },
        { $sort: { totalEarnings: -1 } },
        { $limit: limit },
        {
          $project: {
            name: 1,
            email: 1,
            avatar: 1,
            totalEarnings: 1,
            paymentCount: 1,
          },
        },
      ]);

      // Top clients by spending
      const topClients = await this.userModel.aggregate([
        { $match: { userType: 'client' } },
        {
          $lookup: {
            from: 'payments',
            localField: '_id',
            foreignField: 'payerId',
            as: 'payments',
          },
        },
        {
          $addFields: {
            totalSpent: { $sum: '$payments.amount' },
            paymentCount: { $size: '$payments' },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: limit },
        {
          $project: {
            name: 1,
            email: 1,
            avatar: 1,
            totalSpent: 1,
            paymentCount: 1,
          },
        },
      ]);

      // Top projects by budget
      const topProjects = await this.projectModel.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'clientId',
            foreignField: '_id',
            as: 'client',
          },
        },
        { $unwind: '$client' },
        { $sort: { 'budget.max': -1 } },
        { $limit: limit },
        {
          $project: {
            title: 1,
            description: 1,
            budget: 1,
            status: 1,
            'client.name': 1,
            'client.email': 1,
            createdAt: 1,
          },
        },
      ]);

      return {
        topFreelancers,
        topClients,
        topProjects,
      };
    } catch (error) {
      this.logger.error(`Failed to get top performers: ${error.message}`);
      throw error;
    }
  }
}
