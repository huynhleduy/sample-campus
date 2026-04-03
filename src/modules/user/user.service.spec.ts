import type UserEntity from '@src/modules/user/user.entity';
import { UserService } from '@src/modules/user/user.service';
import { createTestingModule, factory, testingModule } from '#jest';

describe(UserService.name, () => {
  beforeAll(createTestingModule);

  it('creates a user when the mezon id does not exist', async () => {
    const userService = testingModule!.get(UserService);

    const user = await userService.upsertByMezonId('user-1', {
      email: 'first@example.com',
      name: 'First User',
    });

    expect(user).toMatchObject({
      mezonId: 'user-1',
      email: 'first@example.com',
      name: 'First User',
    });
  });

  it('starts each test with a clean database state', async () => {
    const userService = testingModule!.get(UserService);

    await expect(userService.findByMezonId('user-1')).resolves.toBeNull();
  });

  it('supports updateSession from CRUD base', async () => {
    const userService = testingModule!.get(UserService);
    const user = await factory.user({
      email: 'crud-update@example.com',
      mezonId: 'crud-update-user',
      name: 'Before Update',
    });

    const updateSession = userService.updateSession(user);
    user.name = 'After Update';
    user.avatar = 'https://avatar.example.test/updated.png';

    await updateSession.save();

    await expect(
      userService.findByMezonId('crud-update-user'),
    ).resolves.toMatchObject({
      mezonId: 'crud-update-user',
      name: 'After Update',
      avatar: 'https://avatar.example.test/updated.png',
    } satisfies Partial<UserEntity>);
  });

  it('supports updateEntry from CRUD base', async () => {
    const userService = testingModule!.get(UserService);
    const user = await factory.user({
      email: 'crud-entry@example.com',
      mezonId: 'crud-entry-user',
      name: 'Entry Before',
    });

    await userService.updateEntry(user, {
      name: 'Entry After',
    });

    await expect(
      userService.findByMezonId('crud-entry-user'),
    ).resolves.toMatchObject({
      mezonId: 'crud-entry-user',
      name: 'Entry After',
    } satisfies Partial<UserEntity>);
  });
});
