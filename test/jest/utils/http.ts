import supertest from 'supertest';
import { testingApp } from './testing-module';

export function http() {
  if (testingApp == null) {
    throw new Error('Testing app has not been created yet');
  }

  return supertest(testingApp.getHttpServer());
}
