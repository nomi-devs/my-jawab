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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TemplateService } from './template.service';
import { PdfService } from './services/pdf.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import {
  RenderTemplateDto,
  RenderTemplateByIdDto,
} from './dto/render-template.dto';
import { GeneratePdfDto } from './dto/generate-pdf.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { TemplateType, TemplateCategory } from './entities/template.entity';

@ApiTags('Templates')
@ApiBearerAuth('JWT-auth')
@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplateController {
  constructor(
    private readonly templateService: TemplateService,
    private readonly pdfService: PdfService,
  ) {}

  @ApiOperation({ summary: 'Create template' })
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

  @ApiOperation({ summary: 'List all templates' })
  @ApiQuery({ name: 'type', required: false, enum: TemplateType })
  @ApiQuery({ name: 'category', required: false, enum: TemplateCategory })
  @ApiQuery({ name: 'is_active', required: false, type: String })
  @Get()
  async findAll(
    @Query('type') type?: TemplateType,
    @Query('category') category?: TemplateCategory,
    @Query('is_active') is_active?: string,
  ) {
    const templates = await this.templateService.findAll({
      type,
      category,
      is_active:
        is_active === 'true' ? true : is_active === 'false' ? false : undefined,
    });

    return {
      success: true,
      data: templates,
    };
  }

  @ApiOperation({ summary: 'Get template by ID' })
  @ApiParam({ name: 'id', type: String })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const template = await this.templateService.findById(parseInt(id));
    return {
      success: true,
      data: template,
    };
  }

  @ApiOperation({ summary: 'Get template by slug' })
  @ApiParam({ name: 'slug', type: String })
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const template = await this.templateService.findBySlug(slug);
    return {
      success: true,
      data: template,
    };
  }

  @ApiOperation({ summary: 'Update template' })
  @ApiParam({ name: 'id', type: String })
  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    const template = await this.templateService.update(
      parseInt(id),
      updateTemplateDto,
    );
    return {
      success: true,
      data: template,
    };
  }

  @ApiOperation({ summary: 'Delete template' })
  @ApiParam({ name: 'id', type: String })
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
  @ApiOperation({ summary: 'Render template by slug' })
  @Post('render')
  async render(@Body() renderDto: RenderTemplateDto) {
    const html = await this.templateService.render(
      renderDto.slug,
      renderDto.data || {},
    );
    return {
      success: true,
      data: {
        html,
      },
    };
  }

  @ApiOperation({ summary: 'Render template by ID' })
  @ApiParam({ name: 'id', type: String })
  @Post('render/:id')
  async renderById(
    @Param('id') id: string,
    @Body() renderDto: RenderTemplateByIdDto,
  ) {
    const html = await this.templateService.renderById(
      parseInt(id),
      renderDto.data || {},
    );
    return {
      success: true,
      data: {
        html,
      },
    };
  }

  @ApiOperation({ summary: 'Render template subject by slug' })
  @ApiParam({ name: 'slug', type: String })
  @Post('render/:slug/subject')
  async renderSubject(
    @Param('slug') slug: string,
    @Body() renderDto: RenderTemplateByIdDto,
  ) {
    const subject = await this.templateService.renderSubject(
      slug,
      renderDto.data || {},
    );
    return {
      success: true,
      data: {
        subject,
      },
    };
  }

  // PDF Generation Endpoints
  @ApiOperation({ summary: 'Generate PDF from template slug' })
  @Post('pdf/generate')
  async generatePdf(
    @Body() generatePdfDto: GeneratePdfDto,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.pdfService.generateFromTemplate(
      generatePdfDto.templateSlug,
      generatePdfDto.data || {},
      {
        format: generatePdfDto.format,
        orientation: generatePdfDto.orientation,
        displayHeaderFooter: generatePdfDto.displayHeaderFooter,
      },
    );

    const filename =
      generatePdfDto.filename ||
      `${generatePdfDto.templateSlug}-${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  }

  @ApiOperation({ summary: 'Generate PDF from template ID' })
  @ApiParam({ name: 'id', type: String })
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

    const filename =
      generatePdfDto.filename || `${template.slug}-${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  }
}
