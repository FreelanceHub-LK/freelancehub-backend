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
  Request,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProjectStatus } from './schemas/project.schema';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Project has been successfully created.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            project_id: { type: 'string', example: 'proj_123' },
            status: { type: 'string', example: 'published' },
            created_at: { type: 'string', example: '2025-02-03T10:30:00Z' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access.',
  })
  create(@Body() createProjectDto: CreateProjectDto, @Request() req: any) {
    // Set the client from the authenticated user
    createProjectDto.client = req.user.id;
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects with filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all projects that match the criteria.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { type: 'array', items: { type: 'object' } },
        meta: {
          type: 'object',
          properties: {
            pagination: {
              type: 'object',
              properties: {
                current_page: { type: 'number', example: 1 },
                total_pages: { type: 'number', example: 5 },
                total_items: { type: 'number', example: 48 }
              }
            }
          }
        }
      }
    }
  })
  findAll(@Query() queryDto: QueryProjectDto) {
    return this.projectsService.findAll(queryDto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search projects with text and filters' })
  @ApiQuery({ name: 'q', required: false, description: 'Search query' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'budget_min', required: false, description: 'Minimum budget' })
  @ApiQuery({ name: 'budget_max', required: false, description: 'Maximum budget' })
  @ApiQuery({ name: 'budget_type', required: false, description: 'Budget type' })
  @ApiQuery({ name: 'skills', required: false, description: 'Required skills (comma-separated)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results retrieved successfully.',
  })
  searchProjects(@Query() query: any) {
    return this.projectsService.searchProjects(query);
  }

  @Get('recommended')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FREELANCER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recommended projects for freelancer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recommended projects retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access.',
  })
  getRecommendedProjects(@Request() req: any, @Query() query: any) {
    return this.projectsService.getRecommendedProjects(req.user.id, query);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all project categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categories retrieved successfully.',
  })
  getCategories() {
    return this.projectsService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the project with the specified ID.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found.',
  })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Get(':id/draft')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get project draft by ID' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the project draft.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found.',
  })
  getDraft(@Param('id') id: string, @Request() req: any) {
    return this.projectsService.getDraft(id, req.user.id);
  }

  @Post(':id/attachments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add attachments to project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attachments added successfully.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found.',
  })
  addAttachments(
    @Param('id') id: string, 
    @Body() attachments: any[],
    @Request() req: any
  ) {
    return this.projectsService.addAttachments(id, attachments, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project has been successfully updated.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access.',
  })
  update(
    @Param('id') id: string, 
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req: any
  ) {
    return this.projectsService.update(id, updateProjectDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a project (soft delete)' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access.',
  })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.projectsService.remove(id, req.user.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update project status' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project status has been successfully updated.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status transition.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access.',
  })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ProjectStatus,
    @Request() req: any,
  ) {
    return this.projectsService.changeStatus(id, status, req.user.id);
  }

  @Get('client/:clientId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all projects for a client' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all projects for the specified client.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access.',
  })
  findByClient(@Param('clientId') clientId: string, @Request() req: any) {
    return this.projectsService.findByClient(clientId, req.user.id);
  }
}
