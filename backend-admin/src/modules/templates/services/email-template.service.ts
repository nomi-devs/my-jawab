import { Injectable } from '@nestjs/common';
import { TemplateService } from '../template.service';
import { EmailService } from '../../email/email.service';
import { EmailSenderService } from '../../email/services/email-sender.service';
import { EmailType } from '../../email/entities/email.entity';

@Injectable()
export class EmailTemplateService {
  constructor(
    private templateService: TemplateService,
    private emailService: EmailService,
    private emailSenderService: EmailSenderService,
  ) {}

  /**
   * Send email using a template
   */
  async sendEmailFromTemplate(
    templateSlug: string,
    recipientEmail: string,
    data: Record<string, any> = {},
    options?: {
      recipientName?: string;
      fromEmail?: string;
      fromName?: string;
      replyTo?: string;
      ccEmails?: string[];
      bccEmails?: string[];
      emailType?: EmailType;
      userId?: number;
    },
  ) {
    // Render template
    const html = await this.templateService.render(templateSlug, data);
    const subject = await this.templateService.renderSubject(
      templateSlug,
      data,
    );
    const textContent = await this.templateService.renderTextContent(
      templateSlug,
      data,
    );

    // Get template for default from email
    const template = await this.templateService.findBySlug(templateSlug);

    // Create email record
    const email = await this.emailService.create({
      email_type: options?.emailType || EmailType.NOTIFICATION,
      recipient_email: recipientEmail,
      recipient_name: options?.recipientName,
      subject: subject || 'No Subject',
      body_html: html,
      body_text: textContent,
      from_email: options?.fromEmail || 'noreply@jawab.com',
      from_name: options?.fromName || 'Jawab',
      reply_to: options?.replyTo,
      cc_emails: options?.ccEmails,
      bcc_emails: options?.bccEmails,
      user_id: options?.userId,
      template_name: templateSlug,
      template_data: data,
    });

    // Send email
    await this.emailSenderService.sendEmail(email);

    return email;
  }
}
