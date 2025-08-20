import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  ConflictException,
  Logger 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Client, ClientDocument } from './client.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateClientDto, UpdateClientDto, QueryClientDto } from './dto';

export interface ClientListResult {
  data: Client[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    try {
      // Check if user exists and is a client
      const user = await this.userModel.findById(createClientDto.userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.role !== 'client') {
        throw new BadRequestException('User must have client role');
      }

      // Check if client profile already exists
      const existingClient = await this.clientModel.findOne({ 
        userId: createClientDto.userId 
      });
      if (existingClient) {
        throw new ConflictException('Client profile already exists for this user');
      }

      const client = new this.clientModel({
        ...createClientDto,
        userId: new Types.ObjectId(createClientDto.userId),
      });

      const savedClient = await client.save();
      return await this.findOneByIdWithUser(String(savedClient._id));
    } catch (error) {
      this.logger.error(`Error creating client: ${error.message}`);
      throw error;
    }
  }

  async findAll(queryDto: QueryClientDto): Promise<ClientListResult> {
    const {
      industry,
      search,
      minRating,
      minProjects,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = queryDto;

    // Build query
    const query: any = {};

    // Filter by industry
    if (industry) {
      query.industry = { $regex: industry, $options: 'i' };
    }

    // Filter by rating
    if (minRating !== undefined) {
      query.averageRating = { $gte: minRating };
    }

    // Filter by completed projects
    if (minProjects !== undefined) {
      query.completedProjects = { $gte: minProjects };
    }

    // Search functionality
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    try {
      const [clients, total] = await Promise.all([
        this.clientModel
          .find(query)
          .populate('userId', 'firstName lastName email profilePicture rating reviewCount')
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .exec(),
        this.clientModel.countDocuments(query)
      ]);

      return {
        data: clients,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error(`Error finding clients: ${error.message}`);
      throw new BadRequestException('Error retrieving clients');
    }
  }

  async findOne(id: string): Promise<Client> {
    return this.findOneByIdWithUser(id);
  }

  async findOneByUserId(userId: string): Promise<Client> {
    try {
      const client = await this.clientModel
        .findOne({ userId })
        .populate('userId', 'firstName lastName email profilePicture rating reviewCount')
        .exec();

      if (!client) {
        throw new NotFoundException('Client profile not found');
      }

      return client;
    } catch (error) {
      this.logger.error(`Error finding client by user ID: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    try {
      const client = await this.clientModel.findById(id);
      if (!client) {
        throw new NotFoundException('Client not found');
      }

      const updatedClient = await this.clientModel
        .findByIdAndUpdate(id, updateClientDto, { new: true })
        .populate('userId', 'firstName lastName email profilePicture rating reviewCount')
        .exec();

      if (!updatedClient) {
        throw new NotFoundException(`Client with ID ${id} not found`);
      }

      return updatedClient;
    } catch (error) {
      this.logger.error(`Error updating client: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.clientModel.findByIdAndDelete(id);
      if (!result) {
        throw new NotFoundException('Client not found');
      }
    } catch (error) {
      this.logger.error(`Error deleting client: ${error.message}`);
      throw error;
    }
  }

  async getTopRatedClients(limit: number = 10): Promise<Client[]> {
    try {
      return await this.clientModel
        .find()
        .populate('userId', 'firstName lastName email profilePicture rating reviewCount')
        .sort({ averageRating: -1, completedProjects: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Error getting top rated clients: ${error.message}`);
      throw new BadRequestException('Error retrieving top rated clients');
    }
  }

  async getClientsByIndustry(industry: string, limit: number = 10): Promise<Client[]> {
    try {
      return await this.clientModel
        .find({ industry: { $regex: industry, $options: 'i' } })
        .populate('userId', 'firstName lastName email profilePicture rating reviewCount')
        .sort({ completedProjects: -1, averageRating: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Error getting clients by industry: ${error.message}`);
      throw new BadRequestException('Error retrieving clients by industry');
    }
  }

  async updateCompletedProjects(id: string, increment: number = 1): Promise<Client> {
    try {
      const client = await this.clientModel
        .findByIdAndUpdate(
          id, 
          { $inc: { completedProjects: increment } }, 
          { new: true }
        )
        .populate('userId', 'firstName lastName email profilePicture rating reviewCount')
        .exec();

      if (!client) {
        throw new NotFoundException('Client not found');
      }

      return client;
    } catch (error) {
      this.logger.error(`Error updating client completed projects: ${error.message}`);
      throw error;
    }
  }

  async updateAverageRating(id: string, newRating: number): Promise<Client> {
    try {
      const client = await this.clientModel
        .findByIdAndUpdate(
          id, 
          { averageRating: newRating }, 
          { new: true }
        )
        .populate('userId', 'firstName lastName email profilePicture rating reviewCount')
        .exec();

      if (!client) {
        throw new NotFoundException('Client not found');
      }

      return client;
    } catch (error) {
      this.logger.error(`Error updating client average rating: ${error.message}`);
      throw error;
    }
  }

  private async findOneByIdWithUser(id: string): Promise<Client> {
    try {
      const client = await this.clientModel
        .findById(id)
        .populate('userId', 'firstName lastName email profilePicture rating reviewCount')
        .exec();

      if (!client) {
        throw new NotFoundException('Client not found');
      }

      return client;
    } catch (error) {
      this.logger.error(`Error finding client: ${error.message}`);
      throw error;
    }
  }
}
