import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsType } from '@prisma/client';

// SMSBox gateway integration (legacy ASMX HTTP API). `SMS_BASE_URL` in .env
// commonly ends with a trailing '?' — sanitizeBaseUrl() strips it so we don't
// end up with a broken '??' when appending our own query string.
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private sanitizeBaseUrl(raw: string): string {
    return raw.replace(/\?+$/, '');
  }

  private buildSendUrl(phoneNumber: string, message: string): string {
    const base = this.sanitizeBaseUrl(
      this.configService.get<string>(
        'SMS_BASE_URL',
        'https://smsbox.com/SMSGateway/Services/Messaging.asmx/Http_SendSMS',
      ),
    );

    const params = new URLSearchParams({
      username: this.configService.get<string>('SMS_USERNAME', ''),
      password: this.configService.get<string>('SMS_PASSWORD', ''),
      customerId: this.configService.get<string>('SMS_CUSTOMERID', ''),
      senderText: this.configService.get<string>('SMS_SENDER', ''),
      defDate: '',
      isBlink: 'false',
      isFlash: 'false',
      recipientNumbers: phoneNumber,
      messageBody: message,
    });

    return `${base}?${params.toString()}`;
  }

  private buildStatusUrl(messageId: string): string {
    const base = this.sanitizeBaseUrl(
      this.configService.get<string>(
        'SMS_STATUS_URL',
        'https://smsbox.com/SMSGateway/Services/Messaging.asmx/Http_GetSmsStatus',
      ),
    );

    const params = new URLSearchParams({
      username: this.configService.get<string>('SMS_USERNAME', ''),
      password: this.configService.get<string>('SMS_PASSWORD', ''),
      customerId: this.configService.get<string>('SMS_CUSTOMERID', ''),
      messageId,
      detailed: 'true',
    });

    return `${base}?${params.toString()}`;
  }

  async sendSms(
    phoneNumber: string,
    message: string,
    smsType: SmsType,
  ): Promise<{ id: number; sms_box_url: string }> {
    const sendUrl = this.buildSendUrl(phoneNumber, message);
    const safeUrl = sendUrl.replace(/(password=)[^&]*/i, '$1******');

    let status: 'sent' | 'failed' = 'sent';
    let providerResponse: string | null = null;

    try {
      const response = await fetch(sendUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(15000),
        headers: {
          'User-Agent': 'Jawab/1.0',
          Accept: 'text/xml,application/xml,*/*;q=0.1',
        },
      });
      providerResponse = await response.text();
      if (!response.ok) {
        status = 'failed';
        this.logger.error(
          `SMS gateway returned ${response.status} for ${safeUrl}: ${providerResponse}`,
        );
      } else {
        this.logger.log(`SMS sent to ${phoneNumber} via ${safeUrl}`);
      }
    } catch (error) {
      status = 'failed';
      providerResponse = error.message;
      this.logger.error(`Failed to reach SMS gateway (${safeUrl}):`, error);
    }

    const sms = await this.prisma.sms.create({
      data: {
        phone_number: phoneNumber,
        sms_type: smsType,
        message,
        status,
        provider_response: providerResponse,
      },
    });

    const apiUrl = this.configService.get<string>(
      'app.apiUrl',
      'http://localhost:3001/api',
    );

    return {
      id: sms.id,
      sms_box_url: `${apiUrl}/sms-box/${sms.id}`,
    };
  }

  async getSmsStatus(messageId: string): Promise<string> {
    const statusUrl = this.buildStatusUrl(messageId);
    const response = await fetch(statusUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Jawab/1.0',
        Accept: 'text/xml,application/xml,*/*;q=0.1',
      },
    });
    return response.text();
  }

  async findOne(id: number) {
    return this.prisma.sms.findUnique({ where: { id } });
  }

  async findAll(phoneNumber?: string) {
    return this.prisma.sms.findMany({
      where: phoneNumber ? { phone_number: phoneNumber } : undefined,
      orderBy: { created_at: 'desc' },
      take: 50,
    });
  }
}
