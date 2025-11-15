import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Consultant, ConsultantDocument } from './schemas/consultant.schema';
import { CreateConsultantDto } from './dto/create-consultant.dto';

@Injectable()
export class ConsultantsService {
  constructor(
    @InjectModel(Consultant.name)
    private readonly consultantModel: Model<ConsultantDocument>,
  ) {}

  create(createConsultantDto: CreateConsultantDto) {
    return this.consultantModel.create(createConsultantDto);
  }

  findAll(activeOnly = true) {
    const filter = activeOnly ? { active: true } : {};
    return this.consultantModel
      .find(filter)
      .sort({ rating: -1, yearsExperience: -1 })
      .lean()
      .exec();
  }

  async findOne(id: string) {
    const consultant = await this.consultantModel.findById(id).lean().exec();
    if (!consultant) {
      throw new NotFoundException('Consultant not found');
    }
    return consultant;
  }

  async highlight(limit = 3) {
    const consultants = await this.consultantModel
      .find({ active: true })
      .sort({ rating: -1, yearsExperience: -1 })
      .limit(limit)
      .lean()
      .exec();
    return consultants;
  }
}




