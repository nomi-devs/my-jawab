import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

/**
 * Custom pipe to parse optional integer query parameters
 * Handles cases where the parameter might be undefined, null, or a numeric string
 */
@Injectable()
export class OptionalParseIntPipe implements PipeTransform<string | undefined, number | undefined> {
  transform(value: string | undefined): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const parsed = parseInt(value, 10);
    
    if (isNaN(parsed)) {
      throw new BadRequestException(
        `Validation failed (numeric string is expected, but received: "${value}")`,
      );
    }

    return parsed;
  }
}

