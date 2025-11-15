import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Consultation,
  ConsultationDocument,
  ConsultationStatus,
} from './schemas/consultation.schema';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class ConsultationsService {
  constructor(
    @InjectModel(Consultation.name)
    private readonly consultationModel: Model<ConsultationDocument>,
    private readonly usersService: UsersService,
  ) {}

  async create(
    memberId: string,
    createConsultationDto: CreateConsultationDto,
  ): Promise<Consultation> {
    const member = await this.usersService.findOne(memberId);
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const consultant = await this.usersService.findOne(
      createConsultationDto.consultantId,
    );
    if (!consultant) {
      throw new NotFoundException('Consultant not found');
    }

    const consultation = await this.consultationModel.create({
      member: member.id,
      consultant: consultant.id,
      scheduledAt: new Date(createConsultationDto.scheduledAt),
      status: createConsultationDto.status ?? ConsultationStatus.REQUESTED,
      topic: createConsultationDto.topic,
      notes: createConsultationDto.notes,
    });

    return consultation.toJSON() as Consultation;
  }

  findForMember(memberId: string) {
    if (!Types.ObjectId.isValid(memberId)) {
      return this.consultationModel.find({ _id: null }).lean().exec();
    }
    return this.consultationModel
      .find({ member: memberId })
      .sort({ scheduledAt: -1 })
      .populate('consultant', '-password')
      .lean()
      .exec();
  }

  findForConsultant(consultantId: string) {
    if (!Types.ObjectId.isValid(consultantId)) {
      return this.consultationModel.find({ _id: null }).lean().exec();
    }
    return this.consultationModel
      .find({ consultant: consultantId })
      .sort({ scheduledAt: -1 })
      .populate('member', '-password')
      .lean()
      .exec();
  }

  async update(
    id: string,
    updateConsultationDto: UpdateConsultationDto,
  ): Promise<Consultation> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Consultation not found');
    }

    const consultation = await this.consultationModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            ...updateConsultationDto,
            scheduledAt: updateConsultationDto.scheduledAt
              ? new Date(updateConsultationDto.scheduledAt)
              : undefined,
          },
        },
        { new: true },
      )
      .lean()
      .exec();

    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    return consultation;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Consultation not found');
    }
    const consultation = await this.consultationModel
      .findByIdAndDelete(id)
      .exec();
    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }
  }
}
