import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument, ProjectStatus } from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const newProject = new this.projectModel(createProjectDto);
    return newProject.save();
  }

  async findAll(queryDto: QueryProjectDto): Promise<{ data: Project[]; total: number; page: number; limit: number }> {
    const {
      status,
      client,
      category,
      search,
      minBudget,
      maxBudget,
      skill,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    const query: any = { isActive: true };

    // Add filters if they exist
    if (status) query.status = status;
    if (client) query.client = client;
    if (category) query.category = category;
    if (minBudget !== undefined) query.budget = { $gte: minBudget };
    if (maxBudget !== undefined) {
      query.budget = { ...query.budget, $lte: maxBudget };
    }
    if (skill) query.requiredSkills = skill;
    
    // Text search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Create sort object
    const sort: { [key: string]: 1 | -1 } = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Execute query with pagination
    const [data, total] = await Promise.all([
      this.projectModel
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('client', 'name email profilePicture')
        .populate('category', 'name')
        .populate('requiredSkills', 'name'),
      this.projectModel.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectModel
      .findOne({ _id: id, isActive: true })
      .populate('client', 'name email profilePicture')
      .populate('category', 'name')
      .populate('requiredSkills', 'name');
    
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    
    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<Project> {
    const updatedProject = await this.projectModel
      .findByIdAndUpdate(id, updateProjectDto, { new: true })
      .populate('client', 'name email profilePicture')
      .populate('category', 'name')
      .populate('requiredSkills', 'name');
    
    if (!updatedProject) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    
    return updatedProject;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    // Soft delete
    const result = await this.projectModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );
    
    if (!result) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    
    return { deleted: true };
  }

  async changeStatus(id: string, status: ProjectStatus): Promise<Project> {
    const project = await this.projectModel.findById(id);
    
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    
    // Add validation for status transitions
    const validTransitions = {
      [ProjectStatus.DRAFT]: [ProjectStatus.OPEN, ProjectStatus.CANCELLED],
      [ProjectStatus.OPEN]: [ProjectStatus.IN_PROGRESS, ProjectStatus.CANCELLED],
      [ProjectStatus.IN_PROGRESS]: [ProjectStatus.COMPLETED, ProjectStatus.CANCELLED],
      [ProjectStatus.COMPLETED]: [],
      [ProjectStatus.CANCELLED]: [ProjectStatus.DRAFT],
    };
    
    if (!(validTransitions[project.status] as ProjectStatus[]).includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${project.status} to ${status}`,
      );
    }
    
    project.status = status;
    return project.save();
  }

  async findByClient(clientId: string): Promise<Project[]> {
    return this.projectModel
      .find({ client: clientId, isActive: true })
      .populate('category', 'name')
      .populate('requiredSkills', 'name')
      .sort({ createdAt: -1 });
  }
}
