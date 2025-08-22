import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument, ProjectStatus } from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';
import { Category } from '../categories/schemas/category.schema';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Category.name) private categoryModel: Model<any>,
    @InjectModel('User') private userModel: Model<any>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<any> {
    const newProject = new this.projectModel({
      ...createProjectDto,
      currency: createProjectDto.currency || 'LKR'
    });
    const savedProject = await newProject.save();
    
    return {
      success: true,
      data: {
        project_id: savedProject._id,
        status: savedProject.status,
        created_at: savedProject.createdAt
      }
    };
  }

  async findAll(queryDto: QueryProjectDto): Promise<any> {
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
    if (minBudget !== undefined) query.budgetAmount = { $gte: minBudget };
    if (maxBudget !== undefined) {
      query.budgetAmount = { ...query.budgetAmount, $lte: maxBudget };
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

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: total
        }
      }
    };
  }

  async searchProjects(query: any): Promise<any> {
    const {
      q,
      category,
      budget_min,
      budget_max,
      budget_type,
      skills,
      page = 1,
      limit = 10
    } = query;

    const searchQuery: any = { 
      isActive: true, 
      status: { $in: [ProjectStatus.PUBLISHED, ProjectStatus.OPEN] }
    };

    // Text search
    if (q) {
      searchQuery.$text = { $search: q };
    }

    // Category filter
    if (category) {
      searchQuery.category = category;
    }

    // Budget filters
    if (budget_min || budget_max) {
      searchQuery.budgetAmount = {};
      if (budget_min) searchQuery.budgetAmount.$gte = parseInt(budget_min);
      if (budget_max) searchQuery.budgetAmount.$lte = parseInt(budget_max);
    }

    // Budget type filter
    if (budget_type) {
      searchQuery.budgetType = budget_type;
    }

    // Skills filter
    if (skills) {
      const skillsArray = skills.split(',');
      searchQuery.requiredSkills = { $in: skillsArray };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.projectModel
        .find(searchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('client', 'name profilePicture')
        .populate('category', 'name')
        .populate('requiredSkills', 'name'),
      this.projectModel.countDocuments(searchQuery),
    ]);

    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_items: total
        }
      }
    };
  }

  async getRecommendedProjects(freelancerId: string, query: any): Promise<any> {
    const { page = 1, limit = 10 } = query;
    
    // Get freelancer's skills for recommendations
    const freelancer = await this.userModel.findById(freelancerId).populate('skills');
    const freelancerSkills = freelancer?.skills?.map((skill: any) => skill._id) || [];

    const searchQuery: any = {
      isActive: true,
      status: { $in: [ProjectStatus.PUBLISHED, ProjectStatus.OPEN] }
    };

    // Recommend projects that match freelancer's skills
    if (freelancerSkills.length > 0) {
      searchQuery.requiredSkills = { $in: freelancerSkills };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.projectModel
        .find(searchQuery)
        .sort({ 
          competitionLevel: 1, // Prefer low competition
          createdAt: -1 
        })
        .skip(skip)
        .limit(limit)
        .populate('client', 'name profilePicture')
        .populate('category', 'name')
        .populate('requiredSkills', 'name'),
      this.projectModel.countDocuments(searchQuery),
    ]);

    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_items: total
        }
      }
    };
  }

  async getCategories(): Promise<any> {
    const categories = await this.categoryModel.find({ isActive: true }).select('name description');
    
    return {
      success: true,
      data: categories,
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  async getDraft(id: string, userId: string): Promise<any> {
    const project = await this.projectModel
      .findOne({ 
        _id: id, 
        client: userId, 
        status: ProjectStatus.DRAFT,
        isActive: true 
      })
      .populate('client', 'name email profilePicture')
      .populate('category', 'name')
      .populate('requiredSkills', 'name');
    
    if (!project) {
      throw new NotFoundException(`Draft project with ID ${id} not found`);
    }
    
    return {
      success: true,
      data: project,
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  async addAttachments(id: string, attachments: any[], userId: string): Promise<any> {
    const project = await this.projectModel.findOne({ _id: id, client: userId });
    
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    project.attachments.push(...attachments);
    await project.save();

    return {
      success: true,
      data: {
        attachments_added: attachments.length,
        total_attachments: project.attachments.length
      },
      meta: {
        timestamp: new Date().toISOString()
      }
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

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string): Promise<Project> {
    const project = await this.projectModel.findOne({ _id: id, client: userId });
    
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

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

  async remove(id: string, userId: string): Promise<{ deleted: boolean }> {
    const project = await this.projectModel.findOne({ _id: id, client: userId });
    
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    // Soft delete
    const result = await this.projectModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );
    
    return { deleted: true };
  }

  async changeStatus(id: string, status: ProjectStatus, userId: string): Promise<Project> {
    const project = await this.projectModel.findOne({ _id: id, client: userId });
    
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    
    // Add validation for status transitions
    const validTransitions = {
      [ProjectStatus.DRAFT]: [ProjectStatus.PUBLISHED, ProjectStatus.OPEN, ProjectStatus.CANCELLED],
      [ProjectStatus.PUBLISHED]: [ProjectStatus.OPEN, ProjectStatus.CANCELLED],
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

  async findByClient(clientId: string, userId: string): Promise<Project[]> {
    // Users can only view their own projects unless they're admin
    if (clientId !== userId) {
      throw new ForbiddenException('You can only view your own projects');
    }

    return this.projectModel
      .find({ client: clientId, isActive: true })
      .populate('category', 'name')
      .populate('requiredSkills', 'name')
      .sort({ createdAt: -1 });
  }
}
