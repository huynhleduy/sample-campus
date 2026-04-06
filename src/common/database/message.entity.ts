import { Column, Entity, PrimaryColumn } from 'typeorm';
import { AbstractAuditEntity } from '@src/common/database/abstract.entity';

@Entity('messages')
export default class MessageEntity extends AbstractAuditEntity {
  @PrimaryColumn('varchar')
  messageId: string;

  @Column({ type: 'varchar', default: 'reply' })
  type: 'reply' | 'dm';

  @Column({ type: 'varchar' })
  ownerId: string;

  @Column({ type: 'varchar' })
  channelId: string;

  @Column({ default: null, nullable: true, type: 'int' })
  billId: number | null;
}
