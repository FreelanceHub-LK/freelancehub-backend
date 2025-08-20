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
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto, QueryClientDto } from './dto';
import { Client } from './client.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';

@ApiTags('clients')
@Controller('clients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class ClientsController {
  private readonly logger = new Logger(ClientsController.name);

  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new client profile' })
  @ApiResponse({ 
    status: 201, 
    description: 'Client profile created successfully',
    type: Client
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
    status: 409, 
    description: 'Conflict - client profile already exists' 
  })
  async create(
    @Body() createClientDto: CreateClientDto,
    @Request() req: any,
  ): Promise<Client> {
    // If not admin, ensure user can only create their own profile
    if (req.user.role !== UserRole.ADMIN) {
      createClientDto.userId = req.user.id;
    }
    
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all clients with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'Clients retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/Client' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' }
      }
    }
  })
  @ApiQuery({ name: 'industry', required: false, description: 'Filter by industry' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in company name, description, industry' })
  @ApiQuery({ name: 'minRating', required: false, description: 'Minimum average rating' })
  @ApiQuery({ name: 'minProjects', required: false, description: 'Minimum completed projects' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order (asc/desc)' })
  async findAll(@Query() queryDto: QueryClientDto) {
    return this.clientsService.findAll(queryDto);
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Get current client profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'Client profile retrieved successfully',
    type: Client
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Client profile not found' 
  })
  async getMyProfile(@GetCurrentUser('id') userId: string): Promise<Client> {
    return this.clientsService.findOneByUserId(userId);
  }

  @Get('top-rated')
  @ApiOperation({ summary: 'Get top-rated clients' })
  @ApiResponse({ 
    status: 200, 
    description: 'Top-rated clients retrieved successfully',
    type: [Client]
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of clients to return' })
  async getTopRated(@Query('limit') limit?: string): Promise<Client[]> {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.clientsService.getTopRatedClients(parsedLimit);
  }

  @Get('by-industry/:industry')
  @ApiOperation({ summary: 'Get clients by specific industry' })
  @ApiResponse({ 
    status: 200, 
    description: 'Clients in specified industry retrieved successfully',
    type: [Client]
  })
  @ApiParam({ name: 'industry', description: 'Industry name' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of clients to return' })
  async getByIndustry(
    @Param('industry') industry: string,
    @Query('limit') limit?: string,
  ): Promise<Client[]> {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.clientsService.getClientsByIndustry(industry, parsedLimit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Client retrieved successfully',
    type: Client
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Client not found' 
  })
  @ApiParam({ name: 'id', description: 'Client ID' })
  async findOne(@Param('id') id: string): Promise<Client> {
    return this.clientsService.findOne(id);
  }

  @Patch('me')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Update current client profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'Client profile updated successfully',
    type: Client
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Client profile not found' 
  })
  async updateMyProfile(
    @GetCurrentUser('id') userId: string,
    @Body() updateClientDto: UpdateClientDto,
  ): Promise<Client> {
    const client = await this.clientsService.findOneByUserId(userId);
    return this.clientsService.update((client as any)._id.toString(), updateClientDto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update client by ID (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Client updated successfully',
    type: Client
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Client not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin access required' 
  })
  @ApiParam({ name: 'id', description: 'Client ID' })
  async update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
  ): Promise<Client> {
    return this.clientsService.update(id, updateClientDto);
  }

  @Patch(':id/completed-projects')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update client completed projects count (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Completed projects updated successfully',
    type: Client
  })
  @ApiParam({ name: 'id', description: 'Client ID' })
  async updateCompletedProjects(
    @Param('id') id: string,
    @Body('increment') increment: number = 1,
  ): Promise<Client> {
    return this.clientsService.updateCompletedProjects(id, increment);
  }

  @Patch(':id/rating')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update client average rating (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Average rating updated successfully',
    type: Client
  })
  @ApiParam({ name: 'id', description: 'Client ID' })
  async updateAverageRating(
    @Param('id') id: string,
    @Body('rating') rating: number,
  ): Promise<Client> {
    return this.clientsService.updateAverageRating(id, rating);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete client by ID (Admin only)' })
  @ApiResponse({ 
    status: 204, 
    description: 'Client deleted successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Client not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin access required' 
  })
  @ApiParam({ name: 'id', description: 'Client ID' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.clientsService.remove(id);
  }
}
