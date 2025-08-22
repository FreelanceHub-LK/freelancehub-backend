import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('api-info')
@Controller('api')
export class ApiInfoController {
  
  @Get('endpoints')
  @ApiOperation({ summary: 'Get all available API endpoints' })
  @ApiResponse({
    status: 200,
    description: 'API endpoints retrieved successfully',
  })
  getApiEndpoints() {
    return {
      success: true,
      data: {
        version: '1.0.0',
        endpoints: {
          // Authentication Flow
          auth: {
            login: 'POST /api/auth/login',
            refresh: 'POST /api/auth/refresh',
            logout: 'POST /api/auth/logout',
            profile: 'GET /api/auth/profile'
          },
          
          // Project Management
          projects: {
            create: 'POST /api/projects',
            getAll: 'GET /api/projects',
            getById: 'GET /api/projects/:id',
            update: 'PUT /api/projects/:id',
            delete: 'DELETE /api/projects/:id',
            updateStatus: 'PATCH /api/projects/:id/status',
            search: 'GET /api/projects/search',
            recommended: 'GET /api/projects/recommended',
            categories: 'GET /api/projects/categories',
            getDraft: 'GET /api/projects/:id/draft',
            addAttachments: 'POST /api/projects/:id/attachments'
          },
          
          // Proposal Management
          proposals: {
            submit: 'POST /api/proposals',
            getAll: 'GET /api/proposals',
            getById: 'GET /api/proposals/:id',
            update: 'PATCH /api/proposals/:id',
            delete: 'DELETE /api/proposals/:id',
            accept: 'PATCH /api/proposals/:id/accept',
            reject: 'PATCH /api/proposals/:id/reject',
            withdraw: 'PATCH /api/proposals/:id/withdraw',
            getMyProposals: 'GET /api/proposals/my-proposals',
            getProjectProposals: 'GET /api/proposals/project/:projectId',
            getStatistics: 'GET /api/proposals/statistics'
          },
          
          // Contract Management
          contracts: {
            create: 'POST /api/contracts',
            getAll: 'GET /api/contracts',
            getById: 'GET /api/contracts/:id',
            update: 'PATCH /api/contracts/:id',
            delete: 'DELETE /api/contracts/:id',
            start: 'PUT /api/contracts/:id/start',
            complete: 'PUT /api/contracts/:id/complete',
            sign: 'PATCH /api/contracts/:id/sign'
          },
          
          // Milestone Management
          milestones: {
            update: 'PATCH /api/contracts/:id/milestones/:milestoneIndex',
            submit: 'POST /api/contracts/:id/milestones/:milestoneIndex/submit',
            approve: 'PATCH /api/contracts/:id/milestones/:milestoneIndex/approve',
            requestRevision: 'PATCH /api/contracts/:id/milestones/:milestoneIndex/request-revision',
            finalApprove: 'PATCH /api/contracts/:id/milestones/:milestoneIndex/final-approve'
          },
          
          // Communication
          messages: {
            send: 'POST /api/messages',
            getAll: 'GET /api/messages',
            getContract: 'GET /api/messages/contract/:contractId',
            unreadCount: 'GET /api/messages/unread-count'
          },
          
          // Review System
          reviews: {
            create: 'POST /api/reviews',
            getAll: 'GET /api/reviews',
            getById: 'GET /api/reviews/:id',
            getUserReviews: 'GET /api/users/:id/reviews'
          },
          
          // Payment System
          payments: {
            getAll: 'GET /api/payments',
            getById: 'GET /api/payments/:id',
            getSummary: 'GET /api/payments/:contractId/summary'
          },
          
          // User Management
          users: {
            getProfile: 'GET /api/users/:id/profile',
            updateProfile: 'PUT /api/users/:id/profile',
            getPortfolio: 'GET /api/users/:id/portfolio',
            addPortfolio: 'POST /api/users/:id/portfolio',
            updateSettings: 'PUT /api/users/:id/settings'
          },
          
          // Search & Discovery
          search: {
            projects: 'GET /api/projects/search',
            freelancers: 'GET /api/freelancers/search',
            featured: 'GET /api/freelancers/featured'
          },
          
          // Notifications
          notifications: {
            getAll: 'GET /api/notifications',
            markRead: 'PUT /api/notifications/:id/read',
            preferences: 'POST /api/notifications/preferences'
          }
        },
        
        status_flows: {
          project: 'draft → published → open → in_progress → completed/cancelled',
          proposal: 'submitted → under_review → accepted/rejected',
          contract: 'active → in_progress → completed/disputed/cancelled',
          milestone: 'pending → in_progress → submitted → approved/rejected → paid'
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  @Get('status')
  @ApiOperation({ summary: 'Get API status and health' })
  @ApiResponse({
    status: 200,
    description: 'API status retrieved successfully',
  })
  getApiStatus() {
    return {
      success: true,
      data: {
        status: 'online',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        features: {
          authentication: true,
          projectManagement: true,
          proposalSystem: true,
          contractManagement: true,
          milestoneTracking: true,
          messaging: true,
          paymentIntegration: true,
          reviewSystem: true,
          notifications: true,
          fileUpload: true
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }
}
