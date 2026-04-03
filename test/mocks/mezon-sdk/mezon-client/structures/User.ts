export class User {
  id: string;
  username?: string;

  constructor(input: Partial<User> = {}) {
    this.id = input.id ?? 'user-1';
    this.username = input.username ?? 'mock-user';
  }
}
