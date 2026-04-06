import { ValueTransformer } from 'typeorm';

export class JsonTransformer implements ValueTransformer {
  to(value) {
    return JSON.stringify(value);
  }
  from(value: string) {
    return JSON.parse(value);
  }
}
