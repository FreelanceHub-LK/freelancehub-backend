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
  ParseArrayPipe,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { FreelancersService } from './freelancers.service';
import { CreateFreelancerDto, UpdateFreelancerDto, QueryFreelancerDto } from './dto';
import { Freelancer } from './schemas/freelancer.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';

@ApiTags('freelancers')
@Controller('freelancers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class FreelancersController {
  private readonly logger = new Logger(FreelancersController.name);

  constructor(private readonly freelancersService: FreelancersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(UserRole.FREELANCER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new freelancer profile' })
  @ApiResponse({ 
    status: 201, 
    description: 'Freelancer profile created successfully',
    type: Freelancer
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
    description: 'Conflict - freelancer profile already exists' 
  })
  async create(
    @Body() createFreelancerDto: CreateFreelancerDto,
    @Request() req: any,
  ): Promise<Freelancer> {
    // If not admin, ensure user can only create their own profile
    if (req.user.role !== UserRole.ADMIN) {
      createFreelancerDto.userId = req.user.id;
    }
    
    return this.freelancersService.create(createFreelancerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all freelancers with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'Freelancers retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/Freelancer' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' }
      }
    }
  })
  @ApiQuery({ name: 'skills', required: false, description: 'Filter by skills (comma-separated)' })
  @ApiQuery({ name: 'minRate', required: false, description: 'Minimum hourly rate' })
  @ApiQuery({ name: 'maxRate', required: false, description: 'Maximum hourly rate' })
  @ApiQuery({ name: 'isAvailable', required: false, description: 'Filter by availability' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in education, skills, certifications' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order (asc/desc)' })
  async findAll(@Query() queryDto: QueryFreelancerDto) {
    return this.freelancersService.findAll(queryDto);
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(UserRole.FREELANCER)
  @ApiOperation({ summary: 'Get current freelancer profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'Freelancer profile retrieved successfully',
    type: Freelancer
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Freelancer profile not found' 
  })
  async getMyProfile(@GetCurrentUser('id') userId: string): Promise<Freelancer> {
    return this.freelancersService.findOneByUserId(userId);
  }

  @Get('top-rated')
  @ApiOperation({ summary: 'Get top-rated freelancers' })
  @ApiResponse({ 
    status: 200, 
    description: 'Top-rated freelancers retrieved successfully',
    type: [Freelancer]
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of freelancers to return' })
  async getTopRated(@Query('limit') limit?: string): Promise<Freelancer[]> {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.freelancersService.getTopRatedFreelancers(parsedLimit);
  }

  @Get('by-skill/:skill')
  @ApiOperation({ summary: 'Get freelancers by specific skill' })
  @ApiResponse({ 
    status: 200, 
    description: 'Freelancers with specified skill retrieved successfully',
    type: [Freelancer]
  })
  @ApiParam({ name: 'skill', description: 'Skill name' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of freelancers to return' })
  async getBySkill(
    @Param('skill') skill: string,
    @Query('limit') limit?: string,
  ): Promise<Freelancer[]> {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.freelancersService.getFreelancersBySkill(skill, parsedLimit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get freelancer by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Freelancer retrieved successfully',
    type: Freelancer
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Freelancer not found' 
  })
  @ApiParam({ name: 'id', description: 'Freelancer ID' })
  async findOne(@Param('id') id: string): Promise<Freelancer> {
    return this.freelancersService.findOne(id);
  }

  @Patch('me')
  @UseGuards(RolesGuard)
  @Roles(UserRole.FREELANCER)
  @ApiOperation({ summary: 'Update current freelancer profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'Freelancer profile updated successfully',
    type: Freelancer
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Freelancer profile not found' 
  })
  async updateMyProfile(
    @GetCurrentUser('id') userId: string,
    @Body() updateFreelancerDto: UpdateFreelancerDto,
  ): Promise<Freelancer> {
    const freelancer = await this.freelancersService.findOneByUserId(userId);
    return this.freelancersService.update((freelancer as any)._id.toString(), updateFreelancerDto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update freelancer by ID (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Freelancer updated successfully',
    type: Freelancer
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Freelancer not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin access required' 
  })
  @ApiParam({ name: 'id', description: 'Freelancer ID' })
  async update(
    @Param('id') id: string,
    @Body() updateFreelancerDto: UpdateFreelancerDto,
  ): Promise<Freelancer> {
    return this.freelancersService.update(id, updateFreelancerDto);
  }

  @Post('me/skills')
  @UseGuards(RolesGuard)
  @Roles(UserRole.FREELANCER)
  @ApiOperation({ summary: 'Add a skill to freelancer profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'Skill added successfully',
    type: Freelancer
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Skill already exists or invalid skill' 
  })
  async addMySkill(
    @GetCurrentUser('id') userId: string,
    @Body('skill') skill: string,
  ): Promise<Freelancer> {
    const freelancer = await this.freelancersService.findOneByUserId(userId);
    return this.freelancersService.addSkill((freelancer as any)._id.toString(), skill);
  }

  @Delete('me/skills/:skill')
  @UseGuards(RolesGuard)
  @Roles(UserRole.FREELANCER)
  @ApiOperation({ summary: 'Remove a skill from freelancer profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'Skill removed successfully',
    type: Freelancer
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Skill not found in freelancer profile' 
  })
  @ApiParam({ name: 'skill', description: 'Skill name to remove' })
  async removeMySkill(
    @GetCurrentUser('id') userId: string,
    @Param('skill') skill: string,
  ): Promise<Freelancer> {
    const freelancer = await this.freelancersService.findOneByUserId(userId);
    return this.freelancersService.removeSkill((freelancer as any)._id.toString(), skill);
  }

  @Patch('me/skills')
  @UseGuards(RolesGuard)
  @Roles(UserRole.FREELANCER)
  @ApiOperation({ summary: 'Update all freelancer skills (replace existing)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Skills updated successfully',
    type: Freelancer
  })
  async updateMySkills(
    @GetCurrentUser('id') userId: string,
    @Body('skills', ParseArrayPipe) skills: string[],
  ): Promise<Freelancer> {
    const freelancer = await this.freelancersService.findOneByUserId(userId);
    return this.freelancersService.updateSkills((freelancer as any)._id.toString(), skills);
  }

  @Patch('me/availability')
  @UseGuards(RolesGuard)
  @Roles(UserRole.FREELANCER)
  @ApiOperation({ summary: 'Update freelancer availability' })
  @ApiResponse({ 
    status: 200, 
    description: 'Availability updated successfully',
    type: Freelancer
  })
  async updateMyAvailability(
    @GetCurrentUser('id') userId: string,
    @Body('isAvailable') isAvailable: boolean,
  ): Promise<Freelancer> {
    const freelancer = await this.freelancersService.findOneByUserId(userId);
    return this.freelancersService.updateAvailability((freelancer as any)._id.toString(), isAvailable);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete freelancer by ID (Admin only)' })
  @ApiResponse({ 
    status: 204, 
    description: 'Freelancer deleted successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Freelancer not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin access required' 
  })
  @ApiParam({ name: 'id', description: 'Freelancer ID' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.freelancersService.remove(id);
  }
}
