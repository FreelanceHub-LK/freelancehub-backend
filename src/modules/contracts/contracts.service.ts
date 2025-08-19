import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException,
  Logger 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { 
  Contract, 
  ContractDocument, 
  ContractStatus,
  MilestoneStatus 
} from './schemas/contract.schema';
import { 
  CreateContractDto, 
  UpdateContractDto, 
  QueryContractDto,
  UpdateMilestoneDto 
} from './dto';

export interface ContractListResult {
  contracts: Contract[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(
    @InjectModel(Contract.name) private contractModel: Model<ContractDocument>,
  ) {}

  async create(createContractDto: CreateContractDto, clientId: string): Promise<Contract> {
    try {
      // Validate that client and freelancer are different
      if (clientId === createContractDto.freelancer) {
        throw new BadRequestException('Client and freelancer cannot be the same person');
      }

      // Validate dates
      if (new Date(createContractDto.startDate) >= new Date(createContractDto.endDate)) {
        throw new BadRequestException('End date must be after start date');
      }

      // Validate milestones if provided
      if (createContractDto.milestones && createContractDto.milestones.length > 0) {
        const totalMilestoneAmount = createContractDto.milestones.reduce(
          (sum, milestone) => sum + milestone.amount, 
          0
        );
        
        if (totalMilestoneAmount !== createContractDto.amount) {
          throw new BadRequestException('Total milestone amount must equal contract amount');
        }

        // Validate milestone dates
        for (const milestone of createContractDto.milestones) {
          if (new Date(milestone.dueDate) > new Date(createContractDto.endDate)) {
            throw new BadRequestException('Milestone due date cannot be after contract end date');
          }
        }
      }

      const contract = new this.contractModel({
        ...createContractDto,
        client: clientId,
      });

      const savedContract = await contract.save();
      await savedContract.populate(['project', 'client', 'freelancer']);
      
      this.logger.log(`Contract created: ${savedContract._id}`);
      return savedContract;
    } catch (error) {
      this.logger.error(`Failed to create contract: ${error.message}`);
      throw error;
    }
  }

  async findAll(query: QueryContractDto, userId?: string): Promise<ContractListResult> {
    try {
      const filter: any = {};

      // Apply user-specific filter if provided
      if (userId) {
        filter.$or = [
          { client: userId },
          { freelancer: userId }
        ];
      }

      // Apply additional filters
      if (query.project) {
        filter.project = query.project;
      }

      if (query.client) {
        filter.client = query.client;
      }

      if (query.freelancer) {
        filter.freelancer = query.freelancer;
      }

      if (query.status) {
        filter.status = query.status;
      }

      if (query.type) {
        filter.type = query.type;
      }

      if (query.search) {
        filter.$or = [
          { title: { $regex: query.search, $options: 'i' } },
          { description: { $regex: query.search, $options: 'i' } }
        ];
      }

      // Date filters
      if (query.startDateFrom || query.startDateTo) {
        filter.startDate = {};
        if (query.startDateFrom) {
          filter.startDate.$gte = query.startDateFrom;
        }
        if (query.startDateTo) {
          filter.startDate.$lte = query.startDateTo;
        }
      }

      if (query.endDateFrom || query.endDateTo) {
        filter.endDate = {};
        if (query.endDateFrom) {
          filter.endDate.$gte = query.endDateFrom;
        }
        if (query.endDateTo) {
          filter.endDate.$lte = query.endDateTo;
        }
      }

      const skip = ((query.page || 1) - 1) * (query.limit || 10);
      const sortField = query.sortBy || 'createdAt';
      const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

      const [contracts, total] = await Promise.all([
        this.contractModel
          .find(filter)
          .populate('project', 'title description budget')
          .populate('client', 'name email avatar')
          .populate('freelancer', 'name email avatar')
          .sort({ [sortField]: sortOrder })
          .skip(skip)
          .limit(query.limit || 10)
          .exec(),
        this.contractModel.countDocuments(filter),
      ]);

      return {
        contracts,
        total,
        page: query.page || 1,
        limit: query.limit || 10,
        totalPages: Math.ceil(total / (query.limit || 10)),
      };
    } catch (error) {
      this.logger.error(`Failed to find contracts: ${error.message}`);
      throw new BadRequestException('Failed to retrieve contracts');
    }
  }

  async findOne(id: string, userId?: string): Promise<Contract> {
    try {
      const filter: any = { _id: id };
      
      // If userId provided, ensure user has access to this contract
      if (userId) {
        filter.$or = [
          { client: userId },
          { freelancer: userId }
        ];
      }

      const contract = await this.contractModel
        .findOne(filter)
        .populate('project', 'title description budget')
        .populate('client', 'name email avatar')
        .populate('freelancer', 'name email avatar')
        .exec();

      if (!contract) {
        throw new NotFoundException('Contract not found or access denied');
      }

      return contract;
    } catch (error) {
      this.logger.error(`Failed to find contract ${id}: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, updateContractDto: UpdateContractDto, userId: string): Promise<Contract> {
    try {
      const contract = await this.contractModel.findById(id);

      if (!contract) {
        throw new NotFoundException('Contract not found');
      }

      // Check if user has permission to update this contract
      const isClient = contract.client.toString() === userId;
      const isFreelancer = contract.freelancer.toString() === userId;

      if (!isClient && !isFreelancer) {
        throw new ForbiddenException('Access denied to update this contract');
      }

      // Some fields can only be updated by specific roles
      if (updateContractDto.status) {
        switch (updateContractDto.status) {
          case ContractStatus.ACTIVE:
            // Both parties need to sign for contract to be active
            if (!contract.clientSignature || !contract.freelancerSignature) {
              throw new BadRequestException('Both parties must sign the contract before it can be activated');
            }
            break;
          
          case ContractStatus.CANCELLED:
          case ContractStatus.TERMINATED:
            // Both parties can cancel/terminate
            if (updateContractDto.cancellationReason) {
              updateContractDto.metadata = {
                ...updateContractDto.metadata,
                cancelledBy: userId,
                cancellationReason: updateContractDto.cancellationReason
              };
            }
            break;
          
          case ContractStatus.COMPLETED:
            // Only client can mark as completed
            if (!isClient) {
              throw new ForbiddenException('Only client can mark contract as completed');
            }
            updateContractDto.completedAt = new Date();
            break;
        }
      }

      const updatedContract = await this.contractModel
        .findByIdAndUpdate(
          id,
          { 
            ...updateContractDto,
            ...(updateContractDto.status === ContractStatus.CANCELLED && {
              cancelledBy: userId,
              cancelledAt: new Date()
            })
          },
          { new: true }
        )
        .populate('project', 'title description budget')
        .populate('client', 'name email avatar')
        .populate('freelancer', 'name email avatar')
        .exec();

      if (!updatedContract) {
        throw new NotFoundException('Contract not found');
      }

      this.logger.log(`Contract updated: ${id}`);
      return updatedContract;
    } catch (error) {
      this.logger.error(`Failed to update contract ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    try {
      const contract = await this.contractModel.findById(id);

      if (!contract) {
        throw new NotFoundException('Contract not found');
      }

      // Only client can delete contract and only if it's in DRAFT status
      if (contract.client.toString() !== userId) {
        throw new ForbiddenException('Only contract creator can delete the contract');
      }

      if (contract.status !== ContractStatus.DRAFT) {
        throw new BadRequestException('Only draft contracts can be deleted');
      }

      await this.contractModel.findByIdAndDelete(id);
      this.logger.log(`Contract deleted: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete contract ${id}: ${error.message}`);
      throw error;
    }
  }

  async signContract(id: string, userId: string, signatureData: any): Promise<Contract> {
    try {
      const contract = await this.contractModel.findById(id);

      if (!contract) {
        throw new NotFoundException('Contract not found');
      }

      const isClient = contract.client.toString() === userId;
      const isFreelancer = contract.freelancer.toString() === userId;

      if (!isClient && !isFreelancer) {
        throw new ForbiddenException('Access denied to sign this contract');
      }

      if (contract.status !== ContractStatus.PENDING && contract.status !== ContractStatus.DRAFT) {
        throw new BadRequestException('Contract cannot be signed in current status');
      }

      const signature = {
        signedAt: new Date(),
        ipAddress: signatureData.ipAddress,
        userAgent: signatureData.userAgent,
      };

      const updateData: any = {};
      
      if (isClient) {
        if (contract.clientSignature) {
          throw new BadRequestException('Client has already signed this contract');
        }
        updateData.clientSignature = signature;
      } else {
        if (contract.freelancerSignature) {
          throw new BadRequestException('Freelancer has already signed this contract');
        }
        updateData.freelancerSignature = signature;
      }

      // If this is the second signature, update status to PENDING
      if ((isClient && contract.freelancerSignature) || (isFreelancer && contract.clientSignature)) {
        updateData.status = ContractStatus.PENDING;
      }

      const updatedContract = await this.contractModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate('project', 'title description budget')
        .populate('client', 'name email avatar')
        .populate('freelancer', 'name email avatar')
        .exec();

      if (!updatedContract) {
        throw new NotFoundException('Contract not found');
      }

      this.logger.log(`Contract signed: ${id} by ${isClient ? 'client' : 'freelancer'}`);
      return updatedContract;
    } catch (error) {
      this.logger.error(`Failed to sign contract ${id}: ${error.message}`);
      throw error;
    }
  }

  async updateMilestone(
    contractId: string, 
    milestoneIndex: number, 
    updateMilestoneDto: UpdateMilestoneDto, 
    userId: string
  ): Promise<Contract> {
    try {
      const contract = await this.contractModel.findById(contractId);

      if (!contract) {
        throw new NotFoundException('Contract not found');
      }

      const isClient = contract.client.toString() === userId;
      const isFreelancer = contract.freelancer.toString() === userId;

      if (!isClient && !isFreelancer) {
        throw new ForbiddenException('Access denied to update milestone');
      }

      if (!contract.milestones || milestoneIndex >= contract.milestones.length) {
        throw new NotFoundException('Milestone not found');
      }

      const milestone = contract.milestones[milestoneIndex];

      // Validate status transitions
      if (updateMilestoneDto.status) {
        switch (updateMilestoneDto.status) {
          case MilestoneStatus.IN_PROGRESS:
            if (!isFreelancer) {
              throw new ForbiddenException('Only freelancer can mark milestone as in progress');
            }
            break;
          
          case MilestoneStatus.SUBMITTED:
            if (!isFreelancer) {
              throw new ForbiddenException('Only freelancer can submit milestone');
            }
            contract.milestones[milestoneIndex].submittedAt = new Date();
            break;
          
          case MilestoneStatus.APPROVED:
            if (!isClient) {
              throw new ForbiddenException('Only client can approve milestone');
            }
            contract.milestones[milestoneIndex].approvedAt = new Date();
            break;
          
          case MilestoneStatus.REJECTED:
            if (!isClient) {
              throw new ForbiddenException('Only client can reject milestone');
            }
            contract.milestones[milestoneIndex].rejectedAt = new Date();
            break;
        }
      }

      // Update milestone fields
      Object.assign(contract.milestones[milestoneIndex], updateMilestoneDto);

      const updatedContract = await contract.save();
      await updatedContract.populate(['project', 'client', 'freelancer']);

      this.logger.log(`Milestone ${milestoneIndex} updated for contract: ${contractId}`);
      return updatedContract;
    } catch (error) {
      this.logger.error(`Failed to update milestone: ${error.message}`);
      throw error;
    }
  }

  async getContractStats(userId: string): Promise<any> {
    try {
      const filter = {
        $or: [
          { client: userId },
          { freelancer: userId }
        ]
      };

      const stats = await this.contractModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            paidAmount: { $sum: '$paidAmount' }
          }
        }
      ]);

      const result = {
        total: 0,
        active: 0,
        completed: 0,
        cancelled: 0,
        totalEarnings: 0,
        pendingPayments: 0,
      };

      stats.forEach(stat => {
        result.total += stat.count;
        
        switch (stat._id) {
          case ContractStatus.ACTIVE:
            result.active = stat.count;
            break;
          case ContractStatus.COMPLETED:
            result.completed = stat.count;
            result.totalEarnings += stat.paidAmount;
            break;
          case ContractStatus.CANCELLED:
            result.cancelled = stat.count;
            break;
        }
        
        result.pendingPayments += (stat.totalAmount - stat.paidAmount);
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to get contract stats: ${error.message}`);
      throw new BadRequestException('Failed to retrieve contract statistics');
    }
  }
}
