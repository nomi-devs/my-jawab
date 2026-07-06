import { Controller, Get, NotFoundException, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SmsService } from './sms.service';

// Log viewer for every SMS attempt sent through the SMSBox gateway — lets you
// confirm what was actually sent and the gateway's raw response. No auth
// guard: OTPs it might show are already returned directly in the triggering
// response anyway.
@ApiTags('SMS Box (dev)')
@Controller('sms-box')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @ApiOperation({ summary: 'List sent SMS messages, optionally by phone number' })
  @ApiQuery({ name: 'phone_number', required: false, type: String })
  @Get()
  async findAll(@Query('phone_number') phoneNumber?: string) {
    return this.smsService.findAll(phoneNumber);
  }

  @ApiOperation({ summary: 'View a single sent SMS message' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const sms = await this.smsService.findOne(id);
    if (!sms) {
      throw new NotFoundException('SMS message not found');
    }
    return sms;
  }
}
