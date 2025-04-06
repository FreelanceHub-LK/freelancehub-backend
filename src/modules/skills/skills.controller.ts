import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new skill' })
  @ApiResponse({ status: 201, description: 'Skill has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 409, description: 'Skill with this name already exists.' })
  create(@Body() createSkillDto: CreateSkillDto) {
    return this.skillsService.create(createSkillDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all skills' })
  @ApiResponse({ status: 200, description: 'Return all skills.' })
  findAll() {
    return this.skillsService.findAll();
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular skills' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Return popular skills.' })
  getPopularSkills(@Query('limit') limit: number) {
    return this.skillsService.getPopularSkills(limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search skills by name' })
  @ApiQuery({ name: 'name', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Return matching skills.' })
  findByName(@Query('name') name: string) {
    return this.skillsService.findByName(name);
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get skills by category' })
  @ApiResponse({ status: 200, description: 'Return skills by category.' })
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.skillsService.findByCategory(categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a skill by id' })
  @ApiResponse({ status: 200, description: 'Return a skill.' })
  @ApiResponse({ status: 404, description: 'Skill not found.' })
  findOne(@Param('id') id: string) {
    return this.skillsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a skill' })
  @ApiResponse({ status: 200, description: 'Skill has been successfully updated.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Skill not found.' })
  @ApiResponse({ status: 409, description: 'Skill with this name already exists.' })
  update(@Param('id') id: string, @Body() updateSkillDto: UpdateSkillDto) {
    return this.skillsService.update(id, updateSkillDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a skill' })
  @ApiResponse({ status: 200, description: 'Skill has been successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Skill not found.' })
  remove(@Param('id') id: string) {
    return this.skillsService.remove(id);
  }
}
