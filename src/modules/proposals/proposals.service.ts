import { 
    Injectable, 
    NotFoundException, 
    BadRequestException,
    ConflictException
  } from '@nestjs/common';
  import { InjectModel } from '@nestjs/mongoose';
  import { Model, SortOrder } from 'mongoose';
  import { Proposal, ProposalDocument, ProposalStatus } from './schemas/proposal.schema';
  import { CreateProposalDto } from './dto/create-proposal.dto';
  import { UpdateProposalDto } from './dto/update-proposal.dto';
  import { QueryProposalDto } from './dto/query-proposal.dto';
  import { ProjectStatus } from '../projects/schemas/project.schema';
  
  @Injectable()
  export class ProposalsService {
    constructor(
      @InjectModel(Proposal.name) private proposalModel: Model<ProposalDocument>,
      @InjectModel('Project') private projectModel: Model<any>,
    ) {}
  
    async create(createProposalDto: CreateProposalDto): Promise<Proposal> {
      // Check if the project exists and is open for proposals
      const project = await this.projectModel.findById(createProposalDto.project);
      if (!project) {
        throw new NotFoundException(`Project not found`);
      }
      
      if (project.status !== ProjectStatus.OPEN) {
        throw new BadRequestException(`Project is not open for proposals`);
      }
  
      try {
        const newProposal = new this.proposalModel(createProposalDto);
        return await newProposal.save();
      } catch (error) {
        // Handle duplicate proposal
        if (error.code === 11000) {
          throw new ConflictException('You have already submitted a proposal for this project');
        }
        throw error;
      }
    }
  
    async findAll(queryDto: QueryProposalDto): Promise<{ data: Proposal[]; total: number; page: number; limit: number }> {
      const {
        status,
        freelancer,
        project,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = queryDto;
  
      const query: any = { isActive: true };
  
      // Add filters if they exist
      if (status) query.status = status;
      if (freelancer) query.freelancer = freelancer;
      if (project) query.project = project;
      
      // Calculate skip value for pagination
      const skip = (page - 1) * limit;
  
      // Create sort object
      const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  
      // Execute query with pagination
      const [data, total] = await Promise.all([
        this.proposalModel
          .find(query)
          .sort(sort as { [key: string]: SortOrder })
          .skip(skip)
          .limit(limit)
          .populate('freelancer', 'name email profilePicture')
          .populate({
            path: 'project',
            select: 'title budget client category',
            populate: [
              { path: 'client', select: 'name' },
              { path: 'category', select: 'name' }
            ]
          }),
        this.proposalModel.countDocuments(query),
      ]);
  
      return {
        data,
        total,
        page,
        limit,
      };
    }
  
    async findOne(id: string): Promise<Proposal> {
      const proposal = await this.proposalModel
        .findOne({ _id: id, isActive: true })
        .populate('freelancer', 'name email profilePicture')
        .populate({
          path: 'project',
          select: 'title description budget deadline client category requiredSkills',
          populate: [
            { path: 'client', select: 'name email profilePicture' },
            { path: 'category', select: 'name' },
            { path: 'requiredSkills', select: 'name' }
          ]
        });
      
      if (!proposal) {
        throw new NotFoundException(`Proposal with ID ${id} not found`);
      }
      
      return proposal;
    }
  
    async update(id: string, updateProposalDto: UpdateProposalDto): Promise<Proposal> {
      const proposal = await this.proposalModel.findById(id);
      
      if (!proposal) {
        throw new NotFoundException(`Proposal with ID ${id} not found`);
      }
      
      // Only allow updating cover letter, bid amount, and estimated days if the proposal is pending
      if (proposal.status !== ProposalStatus.PENDING && 
          (updateProposalDto.coverLetter || 
           updateProposalDto.bidAmount !== undefined || 
           updateProposalDto.estimatedDays !== undefined)) {
        throw new BadRequestException(`Cannot update details of a ${proposal.status} proposal`);
      }
      
      // Check if status transition is valid
      if (updateProposalDto.status && updateProposalDto.status !== proposal.status) {
        this.validateStatusTransition(proposal.status, updateProposalDto.status);
      }
      
      const updatedProposal = await this.proposalModel
        .findByIdAndUpdate(id, updateProposalDto, { new: true })
        .populate('freelancer', 'name email profilePicture')
        .populate({
          path: 'project',
          select: 'title budget client category',
          populate: [
            { path: 'client', select: 'name' },
            { path: 'category', select: 'name' }
          ]
        });
      
      if (!updatedProposal) {
        throw new NotFoundException(`Proposal with ID ${id} not found`);
      }
      return updatedProposal;
    }
  
    async remove(id: string): Promise<{ deleted: boolean }> {
      // Soft delete
      const result = await this.proposalModel.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true },
      );
      
      if (!result) {
        throw new NotFoundException(`Proposal with ID ${id} not found`);
      }
      
      return { deleted: true };
    }
  
    async changeStatus(id: string, status: ProposalStatus): Promise<Proposal> {
      const proposal = await this.proposalModel.findById(id);
      
      if (!proposal) {
        throw new NotFoundException(`Proposal with ID ${id} not found`);
      }
      
      this.validateStatusTransition(proposal.status, status);
      
      if (status === ProposalStatus.ACCEPTED) {
        // Update the project status to IN_PROGRESS
        await this.projectModel.findByIdAndUpdate(
          proposal.project,
          { status: ProjectStatus.IN_PROGRESS },
        );
        
        // Reject all other pending proposals for this project
        await this.proposalModel.updateMany(
          {
            project: proposal.project,
            _id: { $ne: id },
            status: ProposalStatus.PENDING,
          },
          { status: ProposalStatus.REJECTED },
        );
      }
      
      // Update proposal status
      proposal.status = status;
      return proposal.save();
    }
    
    private validateStatusTransition(currentStatus: ProposalStatus, newStatus: ProposalStatus): void {
      const validTransitions = {
        [ProposalStatus.PENDING]: [ProposalStatus.ACCEPTED, ProposalStatus.REJECTED, ProposalStatus.WITHDRAWN],
        [ProposalStatus.ACCEPTED]: [ProposalStatus.REJECTED],
        [ProposalStatus.REJECTED]: [],
        [ProposalStatus.WITHDRAWN]: [],
      };
      
      if (!(validTransitions[currentStatus] as ProposalStatus[]).includes(newStatus)) {
        throw new BadRequestException(
          `Cannot transition from ${currentStatus} to ${newStatus}`,
        );
      }
    }
  
    async findByFreelancer(freelancerId: string): Promise<Proposal[]> {
      return this.proposalModel
        .find({ freelancer: freelancerId, isActive: true })
        .populate({
          path: 'project',
          select: 'title budget client category status',
          populate: [
            { path: 'client', select: 'name' },
            { path: 'category', select: 'name' }
          ]
        })
        .sort({ createdAt: -1 });
    }
    
    async findByProject(projectId: string): Promise<Proposal[]> {
      return this.proposalModel
        .find({ project: projectId, isActive: true })
        .populate('freelancer', 'name email profilePicture')
        .sort({ createdAt: -1 });
    }
    
    async getStats(freelancerId: string): Promise<any> {
      const stats = await this.proposalModel.aggregate([
        { $match: { freelancer: freelancerId, isActive: true } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgBidAmount: { $avg: '$bidAmount' },
          },
        },
      ]);
      
      // Format the results
      const result = {
        total: 0,
        pending: 0,
        accepted: 0,
        rejected: 0,
        withdrawn: 0,
        avgBidAmount: 0,
      };
      
      let totalBidAmount = 0;
      let totalProposals = 0;
      
      stats.forEach((stat) => {
        result[stat._id.toLowerCase()] = stat.count;
        result.total += stat.count;
        
        if (stat.avgBidAmount) {
          totalBidAmount += stat.avgBidAmount * stat.count;
          totalProposals += stat.count;
        }
      });
      
      if (totalProposals > 0) {
        result.avgBidAmount = totalBidAmount / totalProposals;
      }
      
      return result;
    }
  }
  