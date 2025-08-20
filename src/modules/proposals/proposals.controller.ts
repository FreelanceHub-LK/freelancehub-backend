import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  ClassSerializerInterceptor,
  Logger,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { ProposalsService } from './proposals.service';
import { CreateProposalDto, UpdateProposalDto, QueryProposalDto } from './dto';
import { Proposal, ProposalStatus } from './schemas/proposal.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';

@ApiTags('proposals')
@Controller('proposals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class ProposalsController {
  private readonly logger = new Logger(ProposalsController.name);

  constructor(private readonly proposalsService: ProposalsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(UserRole.FREELANCER)
  @ApiOperation({ summary: 'Submit a new proposal to a project' })
  @ApiResponse({ 
    status: 201, 
    description: 'Proposal submitted successfully',
    type: Proposal
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation failed or project not open' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - only freelancers can submit proposals' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflict - proposal already exists for this project' 
  })
  async create(
    @Body() createProposalDto: CreateProposalDto,
    @Request() req: any,
  ): Promise<Proposal> {
    // Set the freelancer from the authenticated user
    createProposalDto.freelancer = req.user.id;
    return this.proposalsService.create(createProposalDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get proposals with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'Proposals retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/Proposal' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' }
      }
    }
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by proposal status' })
  @ApiQuery({ name: 'freelancer', required: false, description: 'Filter by freelancer ID' })
  @ApiQuery({ name: 'project', required: false, description: 'Filter by project ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order (asc/desc)' })
  async findAll(
    @Query() queryDto: QueryProposalDto,
    @Request() req: any,
  ) {
    // If not admin, users can only see their own proposals
    if (req.user.role !== UserRole.ADMIN) {
      if (req.user.role === UserRole.FREELANCER) {
        queryDto.freelancer = req.user.id;
      }
      // For clients, they can see proposals for their projects through project filter
    }
    
    return this.proposalsService.findAll(queryDto);
  }

  @Get('my-proposals')
  @UseGuards(RolesGuard)
  @Roles(UserRole.FREELANCER)
  @ApiOperation({ summary: 'Get current freelancer\'s proposals' })
  @ApiResponse({ 
    status: 200, 
    description: 'Freelancer proposals retrieved successfully'
  })
  async getMyProposals(
    @GetCurrentUser('id') userId: string,
    @Query() queryDto: QueryProposalDto,
  ) {
    queryDto.freelancer = userId;
    return this.proposalsService.findAll(queryDto);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all proposals for a specific project' })
  @ApiResponse({ 
    status: 200, 
    description: 'Project proposals retrieved successfully',
    type: [Proposal]
  })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async getProjectProposals(
    @Param('projectId') projectId: string,
    @Request() req: any,
    @Query() queryDto: QueryProposalDto,
  ) {
    // Only project owner (client) or admin can see all proposals for a project
    // This validation should ideally be done in the service with project ownership check
    queryDto.project = projectId;
    return this.proposalsService.findAll(queryDto);
  }

  @Get('statistics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.FREELANCER)
  @ApiOperation({ summary: 'Get proposal statistics for current freelancer' })
  @ApiResponse({ 
    status: 200, 
    description: 'Proposal statistics retrieved successfully'
  })
  async getMyStatistics(@GetCurrentUser('id') userId: string) {
    return this.proposalsService.getStats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get proposal by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Proposal retrieved successfully',
    type: Proposal
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Proposal not found' 
  })
  @ApiParam({ name: 'id', description: 'Proposal ID' })
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<Proposal> {
    const proposal = await this.proposalsService.findOne(id);
    
    // Check if user has permission to view this proposal
    if (req.user.role !== UserRole.ADMIN) {
      // Users can only view their own proposals or proposals for their projects
      const isFreelancerOwner = req.user.role === UserRole.FREELANCER && 
                               (proposal as any).freelancer._id.toString() === req.user.id;
      
      if (!isFreelancerOwner) {
        // For clients, we should check if they own the project (implement in service)
        // For now, throwing forbidden error
        throw new ForbiddenException('You can only view your own proposals');
      }
    }
    
    return proposal;
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.FREELANCER)
  @ApiOperation({ summary: 'Update proposal (only by proposal owner)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Proposal updated successfully',
    type: Proposal
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - can only update own proposals' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Proposal not found' 
  })
  @ApiParam({ name: 'id', description: 'Proposal ID' })
  async update(
    @Param('id') id: string,
    @Body() updateProposalDto: UpdateProposalDto,
    @Request() req: any,
  ): Promise<Proposal> {
    // Check if user owns the proposal
    const proposal = await this.proposalsService.findOne(id);
    if ((proposal as any).freelancer._id.toString() !== req.user.id) {
      throw new ForbiddenException('You can only update your own proposals');
    }
    
    return this.proposalsService.update(id, updateProposalDto);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update proposal status (accept/reject by client)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Proposal status updated successfully',
    type: Proposal
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - insufficient permissions' 
  })
  @ApiParam({ name: 'id', description: 'Proposal ID' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ProposalStatus,
    @Request() req: any,
  ): Promise<Proposal> {
    return this.proposalsService.changeStatus(id, status);
  }

  @Patch(':id/withdraw')
  @UseGuards(RolesGuard)
  @Roles(UserRole.FREELANCER)
  @ApiOperation({ summary: 'Withdraw proposal' })
  @ApiResponse({ 
    status: 200, 
    description: 'Proposal withdrawn successfully',
    type: Proposal
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - can only withdraw own proposals' 
  })
  @ApiParam({ name: 'id', description: 'Proposal ID' })
  async withdraw(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<Proposal> {
    // Check if user owns the proposal
    const proposal = await this.proposalsService.findOne(id);
    if ((proposal as any).freelancer._id.toString() !== req.user.id) {
      throw new ForbiddenException('You can only withdraw your own proposals');
    }
    
    return this.proposalsService.changeStatus(id, ProposalStatus.WITHDRAWN);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.FREELANCER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete proposal' })
  @ApiResponse({ 
    status: 204, 
    description: 'Proposal deleted successfully' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - can only delete own proposals' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Proposal not found' 
  })
  @ApiParam({ name: 'id', description: 'Proposal ID' })
  async remove(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    // For freelancers, check if they own the proposal
    if (req.user.role === UserRole.FREELANCER) {
      const proposal = await this.proposalsService.findOne(id);
      if ((proposal as any).freelancer._id.toString() !== req.user.id) {
        throw new ForbiddenException('You can only delete your own proposals');
      }
    }
    
    return this.proposalsService.remove(id);
  }
}
