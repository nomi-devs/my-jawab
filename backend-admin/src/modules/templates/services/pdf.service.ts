import { Injectable, Logger } from '@nestjs/common';
import { TemplateService } from '../template.service';
// Optional dependency - puppeteer must be installed separately
// import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly pdfsPath = path.join(process.cwd(), 'storage', 'pdfs');

  constructor(private templateService: TemplateService) {
    this.ensurePdfsDirectory();
  }

  private ensurePdfsDirectory() {
    if (!fs.existsSync(this.pdfsPath)) {
      fs.mkdirSync(this.pdfsPath, { recursive: true });
      this.logger.log(`Created PDFs directory: ${this.pdfsPath}`);
    }
  }

  /**
   * Generate PDF from HTML template
   */
  async generateFromTemplate(
    templateSlug: string,
    data: Record<string, any> = {},
    options?: {
      filename?: string;
      format?: 'A4' | 'Letter' | 'Legal';
      orientation?: 'portrait' | 'landscape';
      margin?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
      };
      displayHeaderFooter?: boolean;
      headerTemplate?: string;
      footerTemplate?: string;
    },
  ): Promise<Buffer> {
    try {
      // Render HTML template
      const html = await this.templateService.render(templateSlug, data);

      // Generate PDF from HTML
      return await this.generateFromHtml(html, options);
    } catch (error) {
      this.logger.error(`Error generating PDF from template ${templateSlug}:`, error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }

  /**
   * Generate PDF from HTML string
   */
  async generateFromHtml(
    html: string,
    options?: {
      format?: 'A4' | 'Letter' | 'Legal';
      orientation?: 'portrait' | 'landscape';
      margin?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
      };
      displayHeaderFooter?: boolean;
      headerTemplate?: string;
      footerTemplate?: string;
    },
  ): Promise<Buffer> {
    // Dynamic import for optional puppeteer dependency
    let puppeteer: any;
    try {
      // @ts-ignore - puppeteer is an optional dependency
      puppeteer = await import('puppeteer');
    } catch (error) {
      throw new Error('Puppeteer is not installed. Please install it with: npm install puppeteer');
    }

    let browser;
    try {
      // Launch browser
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
      const pdfBuffer = await page.pdf({
        format: options?.format || 'A4',
        landscape: options?.orientation === 'landscape',
        margin: options?.margin || {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
        displayHeaderFooter: options?.displayHeaderFooter || false,
        headerTemplate: options?.headerTemplate || '',
        footerTemplate: options?.footerTemplate || '',
        printBackground: true,
      });

      return pdfBuffer;
    } catch (error) {
      this.logger.error('Error generating PDF:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Generate PDF and save to file
   */
  async generateAndSave(
    templateSlug: string,
    data: Record<string, any> = {},
    filename?: string,
    options?: any,
  ): Promise<string> {
    const pdfBuffer = await this.generateFromTemplate(templateSlug, data, options);

    const fileName = filename || `${templateSlug}-${Date.now()}.pdf`;
    const filePath = path.join(this.pdfsPath, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    this.logger.log(`PDF saved to: ${filePath}`);
    return filePath;
  }

  /**
   * Generate PDF from URL
   */
  async generateFromUrl(
    url: string,
    options?: {
      format?: 'A4' | 'Letter' | 'Legal';
      orientation?: 'portrait' | 'landscape';
      waitUntil?: 'load' | 'networkidle0' | 'domcontentloaded';
    },
  ): Promise<Buffer> {
    // Dynamic import for optional puppeteer dependency
    let puppeteer: any;
    try {
      // @ts-ignore - puppeteer is an optional dependency
      puppeteer = await import('puppeteer');
    } catch (error) {
      throw new Error('Puppeteer is not installed. Please install it with: npm install puppeteer');
    }

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.goto(url, {
        waitUntil: options?.waitUntil || 'networkidle0',
      });

      const pdfBuffer = await page.pdf({
        format: options?.format || 'A4',
        landscape: options?.orientation === 'landscape',
        printBackground: true,
      });

      return pdfBuffer;
    } catch (error) {
      this.logger.error(`Error generating PDF from URL ${url}:`, error);
      throw new Error(`Failed to generate PDF from URL: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
