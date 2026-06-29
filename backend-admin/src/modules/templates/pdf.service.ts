import { Injectable, Logger } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { Readable } from 'stream';

// Optional: Only import puppeteer if needed
let puppeteer: any;
try {
  puppeteer = require('puppeteer');
} catch (error) {
  // puppeteer not installed
}

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(private templatesService: TemplatesService) {}

  /**
   * Generate PDF from HTML template
   */
  async generateFromTemplate(
    templateName: string,
    data: Record<string, any> = {},
    options: {
      format?: 'A4' | 'Letter' | 'Legal';
      orientation?: 'portrait' | 'landscape';
      margin?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
      };
    } = {},
  ): Promise<Buffer> {
    try {
      // Render the template to HTML
      const html = await this.templatesService.render(templateName, data);

      // Generate PDF from HTML
      return await this.generateFromHtml(html, options);
    } catch (error) {
      this.logger.error(`Error generating PDF from template ${templateName}:`, error);
      throw error;
    }
  }

  /**
   * Generate PDF from HTML string
   */
  async generateFromHtml(
    html: string,
    options: {
      format?: 'A4' | 'Letter' | 'Legal';
      orientation?: 'portrait' | 'landscape';
      margin?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
      };
    } = {},
  ): Promise<Buffer> {
    if (!puppeteer) {
      throw new Error('Puppeteer is not installed. Install it with: npm install puppeteer');
    }

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      
      // Set content
      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      // Generate PDF
      const pdf = await page.pdf({
        format: options.format || 'A4',
        landscape: options.orientation === 'landscape',
        margin: {
          top: options.margin?.top || '20mm',
          right: options.margin?.right || '20mm',
          bottom: options.margin?.bottom || '20mm',
          left: options.margin?.left || '20mm',
        },
        printBackground: true,
      });

      return Buffer.from(pdf);
    } catch (error) {
      this.logger.error('Error generating PDF:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Generate PDF as stream (for large files or streaming)
   */
  async generateStream(
    templateName: string,
    data: Record<string, any> = {},
    options?: any,
  ): Promise<Readable> {
    const buffer = await this.generateFromTemplate(templateName, data, options);
    return Readable.from(buffer);
  }
}
