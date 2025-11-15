import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('consultations')
@UseGuards(JwtAuthGuard)
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Post()
  create(
    @Req() request: RequestWithUser,
    @Body() createConsultationDto: CreateConsultationDto,
  ) {
    return this.consultationsService.create(
      request.user.id,
      createConsultationDto,
    );
  }

  @Get()
  findAll(
    @Req() request: RequestWithUser,
    @Query('view') view?: 'member' | 'consultant',
  ) {
    if (view === 'consultant') {
      return this.consultationsService.findForConsultant(request.user.id);
    }
    return this.consultationsService.findForMember(request.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateConsultationDto: UpdateConsultationDto,
  ) {
    return this.consultationsService.update(id, updateConsultationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.consultationsService.remove(id);
  }
}




