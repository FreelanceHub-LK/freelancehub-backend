import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Query, 
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';
import { AddDisputeResponseDto } from './dto/add-dispute-response.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { EscalateDisputeDto } from './dto/escalate-dispute.dto';
import { Dispute, DisputeStatus, DisputeType } from './schemas/dispute.schema';

@ApiTags('Disputes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new dispute' })
  @ApiResponse({ 
    status: 201, 
    description: 'Dispute created successfully',
    type: Dispute
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(
    @Body() createDisputeDto: CreateDisputeDto,
    @Request() req: any,
  ): Promise<Dispute> {
    return this.disputesService.create(createDisputeDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all disputes with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of disputes retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        disputes: { type: 'array', items: { $ref: '#/components/schemas/Dispute' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' }
      }
    }
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: DisputeStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'type', required: false, enum: DisputeType, description: 'Filter by type' })
  @ApiQuery({ name: 'myDisputes', required: false, description: 'Show only user disputes', example: false })
  async findAll(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: DisputeStatus,
    @Query('type') type?: DisputeType,
    @Query('myDisputes') myDisputes?: boolean,
  ) {
    const userId = myDisputes ? req.user.id : undefined;
    return this.disputesService.findAll(+page, +limit, status, type, userId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get dispute statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Dispute statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        byStatus: { type: 'object' },
        byType: { type: 'object' },
        averageResolutionTime: { type: 'number' }
      }
    }
  })
  @ApiQuery({ name: 'myStats', required: false, description: 'Get only user statistics', example: false })
  async getStatistics(
    @Request() req: any,
    @Query('myStats') myStats?: boolean,
  ) {
    const userId = myStats ? req.user.id : undefined;
    return this.disputesService.getDisputeStatistics(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dispute by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Dispute found',
    type: Dispute
  })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<Dispute> {
    return this.disputesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update dispute' })
  @ApiResponse({ 
    status: 200, 
    description: 'Dispute updated successfully',
    type: Dispute
  })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async update(
    @Param('id') id: string,
    @Body() updateDisputeDto: UpdateDisputeDto,
    @Request() req: any,
  ): Promise<Dispute> {
    return this.disputesService.update(id, updateDisputeDto, req.user.id);
  }

  @Post(':id/responses')
  @ApiOperation({ summary: 'Add response to dispute' })
  @ApiResponse({ 
    status: 200, 
    description: 'Response added successfully',
    type: Dispute
  })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async addResponse(
    @Param('id') id: string,
    @Body() addResponseDto: AddDisputeResponseDto,
    @Request() req: any,
  ): Promise<Dispute> {
    return this.disputesService.addResponse(
      id,
      addResponseDto.response,
      req.user.id,
      addResponseDto.attachments,
    );
  }

  @Post(':id/escalate')
  @ApiOperation({ summary: 'Escalate dispute' })
  @ApiResponse({ 
    status: 200, 
    description: 'Dispute escalated successfully',
    type: Dispute
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async escalateDispute(
    @Param('id') id: string,
    @Body() escalateDto: EscalateDisputeDto,
    @Request() req: any,
  ): Promise<Dispute> {
    return this.disputesService.escalateDispute(id, req.user.id, escalateDto.reason);
  }

  @Post(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Resolve dispute (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Dispute resolved successfully',
    type: Dispute
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async resolveDispute(
    @Param('id') id: string,
    @Body() resolveDto: ResolveDisputeDto,
    @Request() req: any,
  ): Promise<Dispute> {
    const resolution = {
      resolution: resolveDto.resolution,
      resolutionBy: req.user.id,
      resolutionDate: new Date(),
      compensationAmount: resolveDto.compensationAmount,
      compensationTo: resolveDto.compensationTo,
    };
    return this.disputesService.resolveDispute(id, resolution, req.user.id);
  }

  @Post(':id/assign-moderator')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign moderator to dispute (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Moderator assigned successfully',
    type: Dispute
  })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  async assignModerator(
    @Param('id') id: string,
    @Body('moderatorId') moderatorId: string,
    @Request() req: any,
  ): Promise<Dispute> {
    return this.disputesService.assignModerator(id, moderatorId, req.user.id);
  }
}
