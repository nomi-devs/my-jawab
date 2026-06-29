import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { TemplateService } from './template.service';
import { PdfService } from './services/pdf.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { RenderTemplateDto, RenderTemplateByIdDto } from './dto/render-template.dto';
import { GeneratePdfDto } from './dto/generate-pdf.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { TemplateType, TemplateCategory } from './entities/template.entity';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplateController {
  constructor(
    private readonly templateService: TemplateService,
    private readonly pdfService: PdfService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  async create(@Body() createTemplateDto: CreateTemplateDto) {
    const template = await this.templateService.create(createTemplateDto);
    return {
      success: true,
      data: template,
    };
  }

  @Get()
  async findAll(
    @Query('type') type?: TemplateType,
    @Query('category') category?: TemplateCategory,
    @Query('is_active') is_active?: string,
  ) {
    const templates = await this.templateService.findAll({
      type,
      category,
      is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
    });

    return {
      success: true,
      data: templates,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const template = await this.templateService.findById(parseInt(id));
    return {
      success: true,
      data: template,
    };
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const template = await this.templateService.findBySlug(slug);
    return {
      success: true,
      data: template,
    };
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  async update(@Param('id') id: string, @Body() updateTemplateDto: UpdateTemplateDto) {
    const template = await this.templateService.update(parseInt(id), updateTemplateDto);
    return {
      success: true,
      data: template,
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  async remove(@Param('id') id: string) {
    await this.templateService.delete(parseInt(id));
    return {
      success: true,
      message: 'Template deleted successfully',
    };
  }

  // Template Rendering Endpoints
  @Post('render')
  async render(@Body() renderDto: RenderTemplateDto) {
    const html = await this.templateService.render(renderDto.slug, renderDto.data || {});
    return {
      success: true,
      data: {
        html,
      },
    };
  }

  @Post('render/:id')
  async renderById(@Param('id') id: string, @Body() renderDto: RenderTemplateByIdDto) {
    const html = await this.templateService.renderById(parseInt(id), renderDto.data || {});
    return {
      success: true,
      data: {
        html,
      },
    };
  }

  @Post('render/:slug/subject')
  async renderSubject(@Param('slug') slug: string, @Body() renderDto: RenderTemplateByIdDto) {
    const subject = await this.templateService.renderSubject(slug, renderDto.data || {});
    return {
      success: true,
      data: {
        subject,
      },
    };
  }

  // PDF Generation Endpoints
  @Post('pdf/generate')
  async generatePdf(@Body() generatePdfDto: GeneratePdfDto, @Res() res: Response) {
    const pdfBuffer = await this.pdfService.generateFromTemplate(
      generatePdfDto.templateSlug,
      generatePdfDto.data || {},
      {
        format: generatePdfDto.format,
        orientation: generatePdfDto.orientation,
        displayHeaderFooter: generatePdfDto.displayHeaderFooter,
      },
    );

    const filename = generatePdfDto.filename || `${generatePdfDto.templateSlug}-${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  }

  @Post('pdf/generate/:id')
  async generatePdfById(
    @Param('id') id: string,
    @Body() generatePdfDto: Omit<GeneratePdfDto, 'templateSlug'>,
    @Res() res: Response,
  ) {
    const template = await this.templateService.findById(parseInt(id));
    const pdfBuffer = await this.pdfService.generateFromTemplate(
      template.slug,
      generatePdfDto.data || {},
      {
        format: generatePdfDto.format,
        orientation: generatePdfDto.orientation,
        displayHeaderFooter: generatePdfDto.displayHeaderFooter,
      },
    );

    const filename = generatePdfDto.filename || `${template.slug}-${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  }
}
