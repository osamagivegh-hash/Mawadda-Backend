import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConsultantsController } from './consultants.controller';
import { ConsultantsService } from './consultants.service';
import { Consultant, ConsultantSchema } from './schemas/consultant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Consultant.name, schema: ConsultantSchema },
    ]),
  ],
  controllers: [ConsultantsController],
  providers: [ConsultantsService],
  exports: [ConsultantsService],
})
export class ConsultantsModule {}




