import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  ForbiddenException,
  Logger 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Dispute, DisputeDocument, DisputeStatus, DisputeType } from './schemas/dispute.schema';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface DisputeListResult {
  disputes: Dispute[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DisputeResolution {
  resolution: string;
  resolutionBy: string;
  resolutionDate: Date;
  compensationAmount?: number;
  compensationTo?: string;
}

@Injectable()
export class DisputesService {
  private readonly logger = new Logger(DisputesService.name);

  constructor(
    @InjectModel(Dispute.name) private disputeModel: Model<DisputeDocument>,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createDisputeDto: CreateDisputeDto, raisedBy: string): Promise<Dispute> {
    try {
      // Check if there's already an open dispute for this project/contract
      const existingDispute = await this.disputeModel.findOne({
        project: createDisputeDto.project,
        contract: createDisputeDto.contract,
        status: { $in: [DisputeStatus.OPEN, DisputeStatus.IN_REVIEW, DisputeStatus.ESCALATED] },
      });

      if (existingDispute) {
        throw new BadRequestException('There is already an open dispute for this project/contract');
      }

      const dispute = new this.disputeModel({
        ...createDisputeDto,
        raisedBy,
        status: DisputeStatus.OPEN,
        timeline: [{
          action: 'Dispute Created',
          date: new Date(),
          performedBy: raisedBy,
          details: `Dispute raised: ${createDisputeDto.title}`,
        }],
      });

      const savedDispute = await dispute.save();
      await savedDispute.populate(['raisedBy', 'raisedAgainst', 'project', 'contract']);

      // Send notifications to involved parties
      await this.sendDisputeNotifications(savedDispute, 'dispute_opened');

      this.logger.log(`Dispute created: ${savedDispute._id}`);
      return savedDispute;
    } catch (error) {
      this.logger.error(`Failed to create dispute: ${error.message}`);
      throw error;
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: DisputeStatus,
    type?: DisputeType,
    userId?: string,
  ): Promise<DisputeListResult> {
    try {
      const filter: any = {};

      if (status) {
        filter.status = status;
      }

      if (type) {
        filter.type = type;
      }

      if (userId) {
        filter.$or = [
          { raisedBy: userId },
          { raisedAgainst: userId },
        ];
      }

      const skip = (page - 1) * limit;

      const [disputes, total] = await Promise.all([
        this.disputeModel
          .find(filter)
          .populate('raisedBy', 'name email avatar')
          .populate('raisedAgainst', 'name email avatar')
          .populate('project', 'title')
          .populate('contract', 'title')
          .populate('assignedModerator', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.disputeModel.countDocuments(filter),
      ]);

      return {
        disputes,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Failed to find disputes: ${error.message}`);
      throw new BadRequestException('Failed to retrieve disputes');
    }
  }

  async findOne(id: string, userId?: string): Promise<Dispute> {
    try {
      const dispute = await this.disputeModel
        .findById(id)
        .populate('raisedBy', 'name email avatar')
        .populate('raisedAgainst', 'name email avatar')
        .populate('project', 'title description budget')
        .populate('contract', 'title amount milestones')
        .populate('assignedModerator', 'name email')
        .populate('timeline.performedBy', 'name email')
        .exec();

      if (!dispute) {
        throw new NotFoundException('Dispute not found');
      }

      // Check if user has access to this dispute
      if (userId) {
        const hasAccess = dispute.raisedBy._id.toString() === userId ||
                         dispute.raisedAgainst._id.toString() === userId ||
                         (dispute.assignedModerator && dispute.assignedModerator._id.toString() === userId);
        
        if (!hasAccess) {
          throw new ForbiddenException('Access denied to this dispute');
        }
      }

      return dispute;
    } catch (error) {
      this.logger.error(`Failed to find dispute ${id}: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, updateDisputeDto: UpdateDisputeDto, userId: string): Promise<Dispute> {
    try {
      const dispute = await this.disputeModel.findById(id);

      if (!dispute) {
        throw new NotFoundException('Dispute not found');
      }

      // Check permissions
      const canUpdate = dispute.raisedBy.toString() === userId ||
                       dispute.raisedAgainst.toString() === userId ||
                       (dispute.assignedModerator && dispute.assignedModerator.toString() === userId);

      if (!canUpdate) {
        throw new ForbiddenException('You do not have permission to update this dispute');
      }

      // Update dispute
      const updatedDispute = await this.disputeModel
        .findByIdAndUpdate(
          id,
          { 
            ...updateDisputeDto,
            updatedAt: new Date(),
          },
          { new: true }
        )
        .populate('raisedBy', 'name email avatar')
        .populate('raisedAgainst', 'name email avatar')
        .populate('project', 'title')
        .populate('contract', 'title')
        .populate('assignedModerator', 'name email')
        .exec();

      if (!updatedDispute) {
        throw new NotFoundException('Dispute not found');
      }

      // Add timeline entry
      await this.addTimelineEntry(id, {
        action: 'Dispute Updated',
        date: new Date(),
        performedBy: userId,
        details: 'Dispute details updated',
      });

      this.logger.log(`Dispute updated: ${id}`);
      return updatedDispute;
    } catch (error) {
      this.logger.error(`Failed to update dispute ${id}: ${error.message}`);
      throw error;
    }
  }

  async addResponse(
    id: string,
    response: string,
    userId: string,
    attachments?: string[],
  ): Promise<Dispute> {
    try {
      const dispute = await this.disputeModel.findById(id);

      if (!dispute) {
        throw new NotFoundException('Dispute not found');
      }

      // Check if user is involved in the dispute
      const isInvolved = dispute.raisedBy.toString() === userId ||
                        dispute.raisedAgainst.toString() === userId ||
                        (dispute.assignedModerator && dispute.assignedModerator.toString() === userId);

      if (!isInvolved) {
        throw new ForbiddenException('You are not authorized to respond to this dispute');
      }

      const responseEntry = {
        responder: new Types.ObjectId(userId),
        response,
        attachments: attachments || [],
        date: new Date(),
      };

      const updatedDispute = await this.disputeModel
        .findByIdAndUpdate(
          id,
          { 
            $push: { responses: responseEntry },
            updatedAt: new Date(),
          },
          { new: true }
        )
        .populate('raisedBy', 'name email avatar')
        .populate('raisedAgainst', 'name email avatar')
        .populate('responses.responder', 'name email avatar')
        .exec();

      // Add timeline entry
      await this.addTimelineEntry(id, {
        action: 'Response Added',
        date: new Date(),
        performedBy: userId,
        details: 'New response added to dispute',
      });

      // Send notification to other party
      const otherParty = dispute.raisedBy.toString() === userId ? 
        dispute.raisedAgainst : dispute.raisedBy;
      
      await this.notificationsService.createAndSend(
        otherParty.toString(),
        'PROJECT_UPDATE' as any,
        {
          title: 'Dispute Response',
          message: 'New response added to dispute',
          actionUrl: `/disputes/${id}`,
          metadata: {
            disputeId: id,
            disputeTitle: dispute.title,
            userEmail: 'user@example.com',
            userName: 'User Name',
          },
          emailEnabled: true,
        }
      );

      this.logger.log(`Response added to dispute: ${id}`);
      return updatedDispute!;
    } catch (error) {
      this.logger.error(`Failed to add response to dispute ${id}: ${error.message}`);
      throw error;
    }
  }

  async assignModerator(id: string, moderatorId: string, assignedBy: string): Promise<Dispute> {
    try {
      const dispute = await this.disputeModel.findById(id);

      if (!dispute) {
        throw new NotFoundException('Dispute not found');
      }

      if (dispute.status === DisputeStatus.RESOLVED || dispute.status === DisputeStatus.CLOSED) {
        throw new BadRequestException('Cannot assign moderator to resolved or closed dispute');
      }

      const updatedDispute = await this.disputeModel
        .findByIdAndUpdate(
          id,
          { 
            assignedModerator: moderatorId,
            status: DisputeStatus.IN_REVIEW,
            updatedAt: new Date(),
          },
          { new: true }
        )
        .populate('assignedModerator', 'name email')
        .exec();

      // Add timeline entry
      await this.addTimelineEntry(id, {
        action: 'Moderator Assigned',
        date: new Date(),
        performedBy: assignedBy,
        details: `Moderator assigned to review dispute`,
      });

      this.logger.log(`Moderator assigned to dispute: ${id}`);
      return updatedDispute!;
    } catch (error) {
      this.logger.error(`Failed to assign moderator to dispute ${id}: ${error.message}`);
      throw error;
    }
  }

  async resolveDispute(
    id: string,
    resolution: DisputeResolution,
    resolvedBy: string,
  ): Promise<Dispute> {
    try {
      const dispute = await this.disputeModel.findById(id);

      if (!dispute) {
        throw new NotFoundException('Dispute not found');
      }

      if (dispute.status === DisputeStatus.RESOLVED || dispute.status === DisputeStatus.CLOSED) {
        throw new BadRequestException('Dispute is already resolved or closed');
      }

      const updatedDispute = await this.disputeModel
        .findByIdAndUpdate(
          id,
          { 
            status: DisputeStatus.RESOLVED,
            resolution: {
              resolution: resolution.resolution,
              resolutionBy: resolvedBy,
              resolutionDate: new Date(),
              compensationAmount: resolution.compensationAmount,
              compensationTo: resolution.compensationTo,
            },
            resolvedAt: new Date(),
            updatedAt: new Date(),
          },
          { new: true }
        )
        .populate('raisedBy', 'name email avatar')
        .populate('raisedAgainst', 'name email avatar')
        .populate('resolution.resolutionBy', 'name email')
        .exec();

      // Add timeline entry
      await this.addTimelineEntry(id, {
        action: 'Dispute Resolved',
        date: new Date(),
        performedBy: resolvedBy,
        details: `Dispute resolved: ${resolution.resolution}`,
      });

      // Send notifications to involved parties
      await this.sendDisputeNotifications(updatedDispute!, 'dispute_resolved');

      this.logger.log(`Dispute resolved: ${id}`);
      return updatedDispute!;
    } catch (error) {
      this.logger.error(`Failed to resolve dispute ${id}: ${error.message}`);
      throw error;
    }
  }

  async escalateDispute(id: string, escalatedBy: string, reason: string): Promise<Dispute> {
    try {
      const dispute = await this.disputeModel.findById(id);

      if (!dispute) {
        throw new NotFoundException('Dispute not found');
      }

      if (dispute.status !== DisputeStatus.IN_REVIEW) {
        throw new BadRequestException('Only disputes in review can be escalated');
      }

      const updatedDispute = await this.disputeModel
        .findByIdAndUpdate(
          id,
          { 
            status: DisputeStatus.ESCALATED,
            escalationReason: reason,
            updatedAt: new Date(),
          },
          { new: true }
        )
        .exec();

      // Add timeline entry
      await this.addTimelineEntry(id, {
        action: 'Dispute Escalated',
        date: new Date(),
        performedBy: escalatedBy,
        details: `Dispute escalated: ${reason}`,
      });

      this.logger.log(`Dispute escalated: ${id}`);
      return updatedDispute!;
    } catch (error) {
      this.logger.error(`Failed to escalate dispute ${id}: ${error.message}`);
      throw error;
    }
  }

  private async addTimelineEntry(
    disputeId: string,
    entry: {
      action: string;
      date: Date;
      performedBy: string;
      details?: string;
    },
  ): Promise<void> {
    await this.disputeModel.findByIdAndUpdate(
      disputeId,
      { $push: { timeline: entry } }
    );
  }

  private async sendDisputeNotifications(
    dispute: DisputeDocument,
    type: 'dispute_opened' | 'dispute_resolved' | 'dispute_escalated',
  ): Promise<void> {
    try {
      const notifications = {
        dispute_opened: {
          title: 'New Dispute Opened',
          message: `A dispute has been opened: ${dispute.title}`,
        },
        dispute_resolved: {
          title: 'Dispute Resolved',
          message: `The dispute "${dispute.title}" has been resolved`,
        },
        dispute_escalated: {
          title: 'Dispute Escalated',
          message: `The dispute "${dispute.title}" has been escalated`,
        },
      };

      const notificationData = notifications[type];
      const parties = [dispute.raisedBy._id, dispute.raisedAgainst._id];

      for (const partyId of parties) {
        await this.notificationsService.sendContractNotification(
          partyId.toString(),
          type as any,
          {
            contractTitle: dispute.title,
            contractId: String(dispute._id),
            userEmail: 'user@example.com', // You'd get this from user service
            userName: 'User Name',
          }
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send dispute notifications: ${error.message}`);
    }
  }

  async getDisputeStatistics(userId?: string): Promise<{
    total: number;
    byStatus: Record<DisputeStatus, number>;
    byType: Record<DisputeType, number>;
    averageResolutionTime: number;
  }> {
    try {
      const filter = userId ? {
        $or: [{ raisedBy: userId }, { raisedAgainst: userId }]
      } : {};

      const [statusStats, typeStats, totalCount] = await Promise.all([
        this.disputeModel.aggregate([
          { $match: filter },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        this.disputeModel.aggregate([
          { $match: filter },
          { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),
        this.disputeModel.countDocuments(filter),
      ]);

      // Calculate average resolution time for resolved disputes
      const resolvedDisputes = await this.disputeModel.find({
        ...filter,
        status: DisputeStatus.RESOLVED,
        resolvedAt: { $exists: true },
      });

      const totalResolutionTime = resolvedDisputes.reduce((total, dispute) => {
        const resolutionTime = new Date(dispute.resolvedAt!).getTime() - 
                              new Date(dispute.createdAt).getTime();
        return total + resolutionTime;
      }, 0);

      const averageResolutionTime = resolvedDisputes.length > 0 ? 
        totalResolutionTime / resolvedDisputes.length / (1000 * 60 * 60 * 24) : 0; // in days

      // Format statistics
      const byStatus: Record<DisputeStatus, number> = {
        [DisputeStatus.OPEN]: statusStats.find(s => s._id === DisputeStatus.OPEN)?.count || 0,
        [DisputeStatus.IN_REVIEW]: statusStats.find(s => s._id === DisputeStatus.IN_REVIEW)?.count || 0,
        [DisputeStatus.ESCALATED]: statusStats.find(s => s._id === DisputeStatus.ESCALATED)?.count || 0,
        [DisputeStatus.RESOLVED]: statusStats.find(s => s._id === DisputeStatus.RESOLVED)?.count || 0,
        [DisputeStatus.CLOSED]: statusStats.find(s => s._id === DisputeStatus.CLOSED)?.count || 0,
      };

      const byType: Record<DisputeType, number> = {
        [DisputeType.PAYMENT_ISSUE]: typeStats.find(t => t._id === DisputeType.PAYMENT_ISSUE)?.count || 0,
        [DisputeType.QUALITY_ISSUE]: typeStats.find(t => t._id === DisputeType.QUALITY_ISSUE)?.count || 0,
        [DisputeType.COMMUNICATION_ISSUE]: typeStats.find(t => t._id === DisputeType.COMMUNICATION_ISSUE)?.count || 0,
        [DisputeType.SCOPE_DISAGREEMENT]: typeStats.find(t => t._id === DisputeType.SCOPE_DISAGREEMENT)?.count || 0,
        [DisputeType.DEADLINE_DISPUTE]: typeStats.find(t => t._id === DisputeType.DEADLINE_DISPUTE)?.count || 0,
        [DisputeType.REFUND_REQUEST]: typeStats.find(t => t._id === DisputeType.REFUND_REQUEST)?.count || 0,
        [DisputeType.OTHER]: typeStats.find(t => t._id === DisputeType.OTHER)?.count || 0,
      };

      return {
        total: totalCount,
        byStatus,
        byType,
        averageResolutionTime: Math.round(averageResolutionTime * 100) / 100,
      };
    } catch (error) {
      this.logger.error(`Failed to get dispute statistics: ${error.message}`);
      throw new BadRequestException('Failed to retrieve dispute statistics');
    }
  }
}
