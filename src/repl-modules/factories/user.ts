import { randomUUID } from 'node:crypto';
import UserEntity from '@src/modules/user/user.entity';
import { Factory } from './factory';

export const user = Factory.forEntity<UserEntity>(
  UserEntity,
  async (input, repository, _dataSource, _appModule, store) => {
    const generatedIds = (store.userIds ??= new Set<string>());

    let mezonId = input.mezonId;
    if (!mezonId) {
      do {
        mezonId = `mezon-${randomUUID()}`;
      } while (generatedIds.has(mezonId));
    }

    generatedIds.add(mezonId);

    const existingUser = await repository.findOne({
      where: { mezonId },
    });

    if (existingUser != null) {
      return existingUser;
    }

    const slug = mezonId.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();

    return {
      avatar: input.avatar ?? `https://avatar.example.test/${slug}.png`,
      email: input.email ?? `${slug}@example.test`,
      mezonId,
      name: input.name ?? `User ${slug.slice(-8)}`,
      ...input,
    };
  },
);
