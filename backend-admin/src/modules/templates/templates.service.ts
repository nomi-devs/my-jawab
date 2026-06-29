import { Injectable, Logger } from '@nestjs/common';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import * as handlebars from 'handlebars';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);
  private readonly templatesPath: string;
  private compiledTemplates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    // Templates directory path - static files only, no database
    this.templatesPath = join(process.cwd(), 'src', 'modules', 'templates', 'views');
    this.logger.log(`Templates directory: ${this.templatesPath}`);
    this.registerHandlebarsHelpers();
  }

  /**
   * Register Handlebars helpers for template rendering
   */
  private registerHandlebarsHelpers() {
    // Date formatting helper
    handlebars.registerHelper('formatDate', (date: Date | string, format?: string) => {
      if (!date) return '';
      const d = new Date(date);
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      return d.toLocaleDateString('en-US', options);
    });

    // Currency formatting helper
    handlebars.registerHelper('formatCurrency', (amount: number, currency: string = 'USD') => {
      if (amount === null || amount === undefined) return '';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    });

    // Conditional helper
    handlebars.registerHelper('ifEquals', (arg1: any, arg2: any, options: any) => {
      return arg1 === arg2 ? options.fn(this) : options.inverse(this);
    });

    // Uppercase helper
    handlebars.registerHelper('uppercase', (str: string) => {
      return str ? str.toUpperCase() : '';
    });

    // Lowercase helper
    handlebars.registerHelper('lowercase', (str: string) => {
      return str ? str.toLowerCase() : '';
    });

    // Capitalize helper
    handlebars.registerHelper('capitalize', (str: string) => {
      return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
    });
  }

  /**
   * Load and compile a template
   */
  private async loadTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
    // Check if template is already compiled and cached
    if (this.compiledTemplates.has(templateName)) {
      return this.compiledTemplates.get(templateName)!;
    }

    const templatePath = join(this.templatesPath, `${templateName}.hbs`);
    
    if (!existsSync(templatePath)) {
      throw new Error(`Template not found: ${templateName} at ${templatePath}`);
    }

    try {
      const templateContent = readFileSync(templatePath, 'utf-8');
      const compiled = handlebars.compile(templateContent);
      
      // Cache the compiled template
      this.compiledTemplates.set(templateName, compiled);
      
      this.logger.debug(`Template loaded and compiled: ${templateName}`);
      return compiled;
    } catch (error) {
      this.logger.error(`Error loading template ${templateName}:`, error);
      throw new Error(`Failed to load template: ${templateName}`);
    }
  }

  /**
   * Render a template with data
   */
  async render(templateName: string, data: Record<string, any> = {}): Promise<string> {
    try {
      const template = await this.loadTemplate(templateName);
      return template(data);
    } catch (error) {
      this.logger.error(`Error rendering template ${templateName}:`, error);
      throw error;
    }
  }

  /**
   * Render email template (wrapper for email-specific rendering)
   */
  async renderEmail(templateName: string, data: Record<string, any> = {}): Promise<string> {
    // Add common email data
    const emailData = {
      ...data,
      year: new Date().getFullYear(),
      appName: data.appName || 'Jawab',
      appUrl: data.appUrl || 'https://jawab.com',
    };

    return this.render(templateName, emailData);
  }

  /**
   * Clear template cache (useful for development)
   */
  clearCache(): void {
    this.compiledTemplates.clear();
    this.logger.log('Template cache cleared');
  }

  /**
   * Check if template exists
   */
  templateExists(templateName: string): boolean {
    const templatePath = join(this.templatesPath, `${templateName}.hbs`);
    return existsSync(templatePath);
  }

  /**
   * Get list of available templates from the views directory
   */
  getAvailableTemplates(): string[] {
    try {
      if (!existsSync(this.templatesPath)) {
        this.logger.warn(`Templates directory does not exist: ${this.templatesPath}`);
        return [];
      }

      const files = readdirSync(this.templatesPath);
      return files
        .filter(file => file.endsWith('.hbs'))
        .map(file => file.replace('.hbs', ''));
    } catch (error) {
      this.logger.error('Error reading templates directory:', error);
      return [];
    }
  }

  /**
   * Render email subject (if template has subject variable)
   */
  async renderSubject(templateName: string, data: Record<string, any> = {}): Promise<string> {
    // If subject is provided in data, render it
    if (data.subject) {
      const subjectTemplate = handlebars.compile(data.subject);
      return subjectTemplate(data);
    }
    return '';
  }
}
