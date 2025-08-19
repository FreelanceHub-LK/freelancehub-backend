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
  Ip,
  Headers,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import {
  CreateContractDto,
  UpdateContractDto,
  QueryContractDto,
  UpdateMilestoneDto,
} from './dto';
import { Contract } from './schemas/contract.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('contracts')
@Controller('contracts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class ContractsController {
  private readonly logger = new Logger(ContractsController.name);

  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Create a new contract' })
  @ApiResponse({ 
    status: 201, 
    description: 'Contract created successfully',
    type: Contract
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation failed' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - only clients can create contracts' 
  })
  async create(
    @Body() createContractDto: CreateContractDto,
    @Request() req: any,
  ): Promise<Contract> {
    return this.contractsService.create(createContractDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get contracts with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'Contracts retrieved successfully',
    type: [Contract]
  })
  @ApiQuery({ name: 'project', required: false, description: 'Filter by project ID' })
  @ApiQuery({ name: 'client', required: false, description: 'Filter by client ID' })
  @ApiQuery({ name: 'freelancer', required: false, description: 'Filter by freelancer ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by contract status' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by contract type' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in contract title/description' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async findAll(
    @Query() query: QueryContractDto,
    @Request() req: any,
  ) {
    return this.contractsService.findAll(query, req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get contract statistics for current user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Contract statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        active: { type: 'number' },
        completed: { type: 'number' },
        cancelled: { type: 'number' },
        totalEarnings: { type: 'number' },
        pendingPayments: { type: 'number' }
      }
    }
  })
  async getStats(@Request() req: any) {
    return this.contractsService.getContractStats(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific contract by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Contract retrieved successfully',
    type: Contract
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Contract not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Access denied to this contract' 
  })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<Contract> {
    return this.contractsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a contract' })
  @ApiResponse({ 
    status: 200, 
    description: 'Contract updated successfully',
    type: Contract
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Contract not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Access denied to update this contract' 
  })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  async update(
    @Param('id') id: string,
    @Body() updateContractDto: UpdateContractDto,
    @Request() req: any,
  ): Promise<Contract> {
    return this.contractsService.update(id, updateContractDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a contract' })
  @ApiResponse({ 
    status: 204, 
    description: 'Contract deleted successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Contract not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Access denied to delete this contract' 
  })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  async remove(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.contractsService.remove(id, req.user.id);
  }

  @Post(':id/sign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign a contract' })
  @ApiResponse({ 
    status: 200, 
    description: 'Contract signed successfully',
    type: Contract
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Contract not found' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Contract cannot be signed or already signed' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Access denied to sign this contract' 
  })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  async signContract(
    @Param('id') id: string,
    @Request() req: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<Contract> {
    const signatureData = {
      ipAddress: ip,
      userAgent: userAgent || 'Unknown',
    };
    
    return this.contractsService.signContract(id, req.user.id, signatureData);
  }

  @Patch(':id/milestones/:milestoneIndex')
  @ApiOperation({ summary: 'Update a specific milestone in a contract' })
  @ApiResponse({ 
    status: 200, 
    description: 'Milestone updated successfully',
    type: Contract
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Contract or milestone not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Access denied to update this milestone' 
  })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  @ApiParam({ name: 'milestoneIndex', description: 'Milestone index (0-based)' })
  async updateMilestone(
    @Param('id') contractId: string,
    @Param('milestoneIndex') milestoneIndex: number,
    @Body() updateMilestoneDto: UpdateMilestoneDto,
    @Request() req: any,
  ): Promise<Contract> {
    return this.contractsService.updateMilestone(
      contractId, 
      Number(milestoneIndex), 
      updateMilestoneDto, 
      req.user.id
    );
  }
}
