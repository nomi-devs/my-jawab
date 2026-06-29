import { Module, Global } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { PdfService } from './pdf.service';

/**
 * Templates Module
 * 
 * This module handles HTML template rendering for emails and PDFs.
 * Templates are stored as static .hbs (Handlebars) files in the views directory.
 * No database is used - all templates are file-based.
 * 
 * Usage:
 * - Email templates: Use TemplatesService.renderEmail() to render email HTML
 * - PDF templates: Use PdfService.generateFromTemplate() to create PDFs
 */
@Global() // Make it available globally so other modules can use it
@Module({
  providers: [TemplatesService, PdfService],
  exports: [TemplatesService, PdfService],
})
export class TemplatesModule {}
