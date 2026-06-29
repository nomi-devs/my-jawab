import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template, TemplateType, TemplateCategory } from './entities/template.entity';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  private readonly templatesPath = path.join(process.cwd(), 'templates');

  constructor(
    @InjectRepository(Template, 'notification')
    private templateRepository: Repository<Template>,
  ) {
    // Register Handlebars helpers
    this.registerHelpers();
    // Ensure templates directory exists
    this.ensureTemplatesDirectory();
  }

  private registerHelpers() {
    // Date formatting helper
    Handlebars.registerHelper('formatDate', (date: Date, format: string) => {
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
    Handlebars.registerHelper('formatCurrency', (amount: number, currency: string = 'USD') => {
      if (amount === null || amount === undefined) return '';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    });

    // Conditional helper
    Handlebars.registerHelper('ifEquals', (arg1: any, arg2: any, options: any) => {
      return arg1 === arg2 ? options.fn(this) : options.inverse(this);
    });

    // Uppercase helper
    Handlebars.registerHelper('uppercase', (str: string) => {
      return str ? str.toUpperCase() : '';
    });

    // Lowercase helper
    Handlebars.registerHelper('lowercase', (str: string) => {
      return str ? str.toLowerCase() : '';
    });
  }

  private ensureTemplatesDirectory() {
    if (!fs.existsSync(this.templatesPath)) {
      fs.mkdirSync(this.templatesPath, { recursive: true });
      this.logger.log(`Created templates directory: ${this.templatesPath}`);
    }
  }

  // CRUD Operations
  async create(data: {
    name: string;
    slug: string;
    type: TemplateType;
    category?: TemplateCategory;
    subject?: string;
    content: string;
    text_content?: string;
    variables?: Record<string, any>;
    default_data?: Record<string, any>;
    description?: string;
    created_by?: number;
  }): Promise<Template> {
    const template = this.templateRepository.create({
      ...data,
      category: data.category || TemplateCategory.CUSTOM,
      is_active: true,
    });

    return await this.templateRepository.save(template);
  }

  async findById(id: number): Promise<Template> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    return template;
  }

  async findBySlug(slug: string): Promise<Template> {
    const template = await this.templateRepository.findOne({ where: { slug, is_active: true } });
    if (!template) {
      throw new NotFoundException(`Template with slug "${slug}" not found`);
    }
    return template;
  }

  async findAll(options?: {
    type?: TemplateType;
    category?: TemplateCategory;
    is_active?: boolean;
  }): Promise<Template[]> {
    const query = this.templateRepository.createQueryBuilder('template');

    if (options?.type) {
      query.andWhere('template.type = :type', { type: options.type });
    }

    if (options?.category) {
      query.andWhere('template.category = :category', { category: options.category });
    }

    if (options?.is_active !== undefined) {
      query.andWhere('template.is_active = :is_active', { is_active: options.is_active });
    }

    return await query.orderBy('template.created_at', 'DESC').getMany();
  }

  async update(id: number, data: Partial<Template>): Promise<Template> {
    const template = await this.findById(id);
    Object.assign(template, data);
    return await this.templateRepository.save(template);
  }

  async delete(id: number): Promise<void> {
    const template = await this.findById(id);
    await this.templateRepository.remove(template);
  }

  // Template Rendering
  async render(slug: string, data: Record<string, any> = {}): Promise<string> {
    const template = await this.findBySlug(slug);
    return this.renderTemplate(template, data);
  }

  async renderById(id: number, data: Record<string, any> = {}): Promise<string> {
    const template = await this.findById(id);
    return this.renderTemplate(template, data);
  }

  private renderTemplate(template: Template, data: Record<string, any> = {}): string {
    try {
      // Merge default data with provided data
      const templateData = {
        ...(template.default_data || {}),
        ...data,
      };

      // Compile and render template
      const compiledTemplate = Handlebars.compile(template.content);
      return compiledTemplate(templateData);
    } catch (error) {
      this.logger.error(`Error rendering template ${template.slug}:`, error);
      throw new Error(`Failed to render template: ${error.message}`);
    }
  }

  // Render subject (for emails)
  async renderSubject(slug: string, data: Record<string, any> = {}): Promise<string> {
    const template = await this.findBySlug(slug);
    if (!template.subject) {
      return '';
    }

    try {
      const compiledSubject = Handlebars.compile(template.subject);
      return compiledSubject({ ...(template.default_data || {}), ...data });
    } catch (error) {
      this.logger.error(`Error rendering subject for template ${template.slug}:`, error);
      return template.subject;
    }
  }

  // Render text content (for emails)
  async renderTextContent(slug: string, data: Record<string, any> = {}): Promise<string> {
    const template = await this.findBySlug(slug);
    if (!template.text_content) {
      // Convert HTML to text if text_content is not provided
      return this.htmlToText(await this.render(slug, data));
    }

    try {
      const compiledText = Handlebars.compile(template.text_content);
      return compiledText({ ...(template.default_data || {}), ...data });
    } catch (error) {
      this.logger.error(`Error rendering text content for template ${template.slug}:`, error);
      return template.text_content || '';
    }
  }

  // Convert HTML to plain text
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  // Load template from file system
  async loadFromFile(filePath: string): Promise<string> {
    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(this.templatesPath, filePath);

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException(`Template file not found: ${fullPath}`);
    }

    return fs.readFileSync(fullPath, 'utf-8');
  }

  // Save template to file system
  async saveToFile(filePath: string, content: string): Promise<void> {
    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(this.templatesPath, filePath);

    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, content, 'utf-8');
  }
}
