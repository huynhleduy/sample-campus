import { Injectable } from '@nestjs/common';
import { v1 } from 'uuid';

@Injectable()
export class GeneratorService {
  public uuid(): string {
    return v1();
  }

  public fileName(ext: string): string {
    return this.uuid() + '.' + ext;
  }
}
