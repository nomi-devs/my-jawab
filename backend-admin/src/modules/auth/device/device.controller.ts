import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { DeviceService } from './device.service';
import { RegisterDeviceDto, UpdateDeviceDto } from '../dto/device.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GetUser } from '../decorators/get-user.decorator';

@ApiTags('MA / Devices')
@ApiBearerAuth('JWT-auth')
@Controller('ma/devices')
@UseGuards(JwtAuthGuard)
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @ApiOperation({ summary: 'Register a device for push notifications' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerDevice(
    @GetUser() user: any,
    @Body() registerDeviceDto: RegisterDeviceDto,
  ) {
    return this.deviceService.registerDevice(user.userId, registerDeviceDto);
  }

  @ApiOperation({ summary: 'Get all devices for the current user' })
  @Get()
  @HttpCode(HttpStatus.OK)
  async getUserDevices(@GetUser() user: any) {
    return this.deviceService.getUserDevices(user.userId);
  }

  @ApiOperation({ summary: 'Update a device' })
  @ApiParam({ name: 'deviceId', type: String })
  @Put(':deviceId')
  @HttpCode(HttpStatus.OK)
  async updateDevice(
    @GetUser() user: any,
    @Param('deviceId') deviceId: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    return this.deviceService.updateDevice(
      user.userId,
      deviceId,
      updateDeviceDto,
    );
  }

  @ApiOperation({ summary: 'Deactivate a device' })
  @ApiParam({ name: 'deviceId', type: String })
  @Delete(':deviceId')
  @HttpCode(HttpStatus.OK)
  async deactivateDevice(
    @GetUser() user: any,
    @Param('deviceId') deviceId: string,
  ) {
    return this.deviceService.deactivateDevice(user.userId, deviceId);
  }
}
