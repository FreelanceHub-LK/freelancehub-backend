import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  ConflictException,
  Logger 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Freelancer, FreelancerDocument } from './schemas/freelancer.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateFreelancerDto, UpdateFreelancerDto, QueryFreelancerDto } from './dto';

export interface FreelancerListResult {
  data: Freelancer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class FreelancersService {
  private readonly logger = new Logger(FreelancersService.name);

  constructor(
    @InjectModel(Freelancer.name) private freelancerModel: Model<FreelancerDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createFreelancerDto: CreateFreelancerDto): Promise<Freelancer> {
    try {
      // Check if user exists and is a freelancer
      const user = await this.userModel.findById(createFreelancerDto.userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.role !== 'freelancer') {
        throw new BadRequestException('User must have freelancer role');
      }

      // Check if freelancer profile already exists
      const existingFreelancer = await this.freelancerModel.findOne({ 
        userId: createFreelancerDto.userId 
      });
      if (existingFreelancer) {
        throw new ConflictException('Freelancer profile already exists for this user');
      }

      const freelancer = new this.freelancerModel({
        ...createFreelancerDto,
        userId: new Types.ObjectId(createFreelancerDto.userId),
      });

      const savedFreelancer = await freelancer.save();
      return await this.findOneByIdWithUser(String(savedFreelancer._id));
    } catch (error) {
      this.logger.error(`Error creating freelancer: ${error.message}`);
      throw error;
    }
  }

  async findAll(queryDto: QueryFreelancerDto): Promise<FreelancerListResult> {
    const {
      skills,
      minRate,
      maxRate,
      isAvailable,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = queryDto;

    // Build query
    const query: any = {};

    // Filter by skills
    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      query.skills = { $in: skillsArray };
    }

    // Filter by hourly rate range
    if (minRate !== undefined || maxRate !== undefined) {
      query.hourlyRate = {};
      if (minRate !== undefined) query.hourlyRate.$gte = minRate;
      if (maxRate !== undefined) query.hourlyRate.$lte = maxRate;
    }

    // Filter by availability
    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { education: { $regex: search, $options: 'i' } },
        { skills: { $elemMatch: { $regex: search, $options: 'i' } } },
        { certifications: { $elemMatch: { $regex: search, $options: 'i' } } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    try {
      const [freelancers, total] = await Promise.all([
        this.freelancerModel
          .find(query)
          .populate('userId', 'firstName lastName email profilePicture rating reviewCount')
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .exec(),
        this.freelancerModel.countDocuments(query)
      ]);

      return {
        data: freelancers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error(`Error finding freelancers: ${error.message}`);
      throw new BadRequestException('Error retrieving freelancers');
    }
  }

  async findOne(id: string): Promise<Freelancer> {
    return this.findOneByIdWithUser(id);
  }

  async findOneByUserId(userId: string): Promise<Freelancer> {
    try {
      const freelancer = await this.freelancerModel
        .findOne({ userId })
        .populate('userId', 'firstName lastName email profilePicture rating reviewCount')
        .exec();

      if (!freelancer) {
        throw new NotFoundException('Freelancer profile not found');
      }

      return freelancer;
    } catch (error) {
      this.logger.error(`Error finding freelancer by user ID: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, updateFreelancerDto: UpdateFreelancerDto): Promise<Freelancer> {
    try {
      const freelancer = await this.freelancerModel.findById(id);
      if (!freelancer) {
        throw new NotFoundException('Freelancer not found');
      }

      const updatedFreelancer = await this.freelancerModel
        .findByIdAndUpdate(id, updateFreelancerDto, { new: true })
        .populate('userId', 'firstName lastName email profilePicture rating reviewCount')
        .exec();

      if (!updatedFreelancer) {
        throw new NotFoundException(`Freelancer with ID ${id} not found`);
      }

      return updatedFreelancer;
    } catch (error) {
      this.logger.error(`Error updating freelancer: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.freelancerModel.findByIdAndDelete(id);
      if (!result) {
        throw new NotFoundException('Freelancer not found');
      }
    } catch (error) {
      this.logger.error(`Error deleting freelancer: ${error.message}`);
      throw error;
    }
  }

  async updateSkills(id: string, skills: string[]): Promise<Freelancer> {
    try {
      const freelancer = await this.freelancerModel
        .findByIdAndUpdate(id, { skills }, { new: true })
        .populate('userId', 'firstName lastName email profilePicture rating reviewCount')
        .exec();

      if (!freelancer) {
        throw new NotFoundException('Freelancer not found');
      }

      return freelancer;
    } catch (error) {
      this.logger.error(`Error updating freelancer skills: ${error.message}`);
      throw error;
    }
  }

  async updateAvailability(id: string, isAvailable: boolean): Promise<Freelancer> {
    try {
      const freelancer = await this.freelancerModel
        .findByIdAndUpdate(id, { isAvailable }, { new: true })
        .populate('userId', 'firstName lastName email profilePicture rating reviewCount')
        .exec();

      if (!freelancer) {
        throw new NotFoundException('Freelancer not found');
      }

      return freelancer;
    } catch (error) {
      this.logger.error(`Error updating freelancer availability: ${error.message}`);
      throw error;
    }
  }

  async getTopRatedFreelancers(limit: number = 10): Promise<Freelancer[]> {
    try {
      return await this.freelancerModel
        .find({ isAvailable: true })
        .populate('userId', 'firstName lastName email profilePicture rating reviewCount')
        .sort({ 'userId.rating': -1, completedProjects: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Error getting top rated freelancers: ${error.message}`);
      throw new BadRequestException('Error retrieving top rated freelancers');
    }
  }

  async getFreelancersBySkill(skill: string, limit: number = 10): Promise<Freelancer[]> {
    try {
      return await this.freelancerModel
        .find({ 
          skills: { $in: [skill] },
          isAvailable: true 
        })
        .populate('userId', 'firstName lastName email profilePicture rating reviewCount')
        .sort({ completedProjects: -1, 'userId.rating': -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Error getting freelancers by skill: ${error.message}`);
      throw new BadRequestException('Error retrieving freelancers by skill');
    }
  }

  async addSkill(id: string, skill: string): Promise<Freelancer> {
    try {
      const freelancer = await this.freelancerModel.findById(id);
      if (!freelancer) {
        throw new NotFoundException('Freelancer not found');
      }

      // Check if skill already exists
      if (freelancer.skills.includes(skill)) {
        throw new BadRequestException('Skill already exists in freelancer profile');
      }

      const updatedFreelancer = await this.freelancerModel
        .findByIdAndUpdate(
          id, 
          { $addToSet: { skills: skill } }, 
          { new: true }
        )
        .populate('userId', 'firstName lastName email profilePicture rating reviewCount')
        .exec();

      if (!updatedFreelancer) {
        throw new NotFoundException('Freelancer not found');
      }

      return updatedFreelancer;
    } catch (error) {
      this.logger.error(`Error adding skill to freelancer: ${error.message}`);
      throw error;
    }
  }

  async removeSkill(id: string, skill: string): Promise<Freelancer> {
    try {
      const freelancer = await this.freelancerModel.findById(id);
      if (!freelancer) {
        throw new NotFoundException('Freelancer not found');
      }

      // Check if skill exists
      if (!freelancer.skills.includes(skill)) {
        throw new NotFoundException('Skill not found in freelancer profile');
      }

      const updatedFreelancer = await this.freelancerModel
        .findByIdAndUpdate(
          id, 
          { $pull: { skills: skill } }, 
          { new: true }
        )
        .populate('userId', 'firstName lastName email profilePicture rating reviewCount')
        .exec();

      if (!updatedFreelancer) {
        throw new NotFoundException('Freelancer not found');
      }

      return updatedFreelancer;
    } catch (error) {
      this.logger.error(`Error removing skill from freelancer: ${error.message}`);
      throw error;
    }
  }

  private async findOneByIdWithUser(id: string): Promise<Freelancer> {
    try {
      const freelancer = await this.freelancerModel
        .findById(id)
        .populate('userId', 'firstName lastName email profilePicture rating reviewCount')
        .exec();

      if (!freelancer) {
        throw new NotFoundException('Freelancer not found');
      }

      return freelancer;
    } catch (error) {
      this.logger.error(`Error finding freelancer: ${error.message}`);
      throw error;
    }
  }
}
