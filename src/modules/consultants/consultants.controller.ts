import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ConsultantsService } from './consultants.service';
import { CreateConsultantDto } from './dto/create-consultant.dto';

@Controller('consultants')
export class ConsultantsController {
  constructor(private readonly consultantsService: ConsultantsService) {}

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    const activeOnly = includeInactive !== 'true';
    return this.consultantsService.findAll(activeOnly);
  }

  @Get('highlight')
  highlight(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 3;
    return this.consultantsService.highlight(parsedLimit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.consultantsService.findOne(id);
  }

  @Post()
  create(@Body() createConsultantDto: CreateConsultantDto) {
    return this.consultantsService.create(createConsultantDto);
  }
}




