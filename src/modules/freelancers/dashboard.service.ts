import { Injectable } from '@nestjs/common';
import { FreelancersService } from './freelancers.service';
import { ContractsService } from '../contracts/contracts.service';
import { ProposalsService } from '../proposals/proposals.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ContractStatus, MilestoneStatus } from '../contracts/schemas/contract.schema';

@Injectable()
export class FreelancerDashboardService {
  constructor(
    private readonly freelancersService: FreelancersService,
    private readonly contractsService: ContractsService,
    private readonly proposalsService: ProposalsService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async getFreelancerDashboard(userId: string) {
    try {
      // Get freelancer profile
      const profile = await this.freelancersService.findOneByUserId(userId);
      
      // Get active contracts (ongoing projects)
      const activeContracts = await this.contractsService.findAll({
        freelancer: userId,
        status: ContractStatus.ACTIVE,
      }, userId);

      // Get contract statistics
      const contractStats = await this.contractsService.getContractStats(userId);

      // Get recent proposals
      const recentProposals = await this.proposalsService.findAll({
        freelancer: userId,
        page: 1,
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      // Get proposal statistics
      const proposalStats = await this.proposalsService.getStats(userId);

      // Get user analytics
      const analytics = await this.analyticsService.getUserAnalytics(userId);

      return {
        success: true,
        data: {
          profile: {
            // Note: Adjust these fields based on actual Freelancer schema
            skills: profile.skills,
            hourlyRate: profile.hourlyRate,
            isAvailable: profile.isAvailable,
            completedProjects: profile.completedProjects,
          },
          ongoingProjects: {
            contracts: activeContracts.contracts,
            totalActive: contractStats.active,
            totalEarnings: contractStats.totalEarnings,
            pendingPayments: contractStats.pendingPayments,
          },
          proposals: {
            recent: recentProposals.data,
            statistics: proposalStats,
          },
          analytics: analytics,
          quickStats: {
            totalContracts: contractStats.total,
            completedContracts: contractStats.completed,
            successRate: proposalStats.total > 0 ? 
              (proposalStats.accepted / proposalStats.total * 100).toFixed(1) : 0,
            averageBidAmount: proposalStats.avgBidAmount,
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to load dashboard data',
        error: error.message,
      };
    }
  }

  async getOngoingProjectDetails(userId: string) {
    // Get detailed information about all ongoing projects
    const activeContracts = await this.contractsService.findAll({
      freelancer: userId,
      status: ContractStatus.ACTIVE,
    }, userId);

    return {
      success: true,
      data: activeContracts.contracts.map(contract => ({
        contractId: contract._id,
        // Note: These would need proper population in the query
        projectTitle: (contract.project as any)?.title,
        clientName: (contract.client as any)?.name,
        totalAmount: contract.amount,
        paidAmount: contract.paidAmount,
        startDate: contract.startDate,
        milestones: contract.milestones?.map(milestone => ({
          title: milestone.title,
          description: milestone.description,
          amount: milestone.amount,
          status: milestone.status,
          dueDate: milestone.dueDate,
        })),
        status: contract.status,
        currentMilestone: contract.milestones?.find(m => m.status === MilestoneStatus.IN_PROGRESS),
      }))
    };
  }
}
