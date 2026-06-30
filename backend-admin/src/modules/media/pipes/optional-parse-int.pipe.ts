import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

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
