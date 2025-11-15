import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class TrimPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value !== 'object' || value === null) {
      return value;
    }

    const trimmed: Record<string, any> = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const val = value[key];
        trimmed[key] = typeof val === 'string' ? val.trim() : val;
      }
    }
    return trimmed;
  }
}

