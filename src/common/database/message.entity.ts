import { AbstractAuditEntity } from '@src/common/database/abstract.entity';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('messages')
export default class MessageEntity extends AbstractAuditEntity {
  @PrimaryColumn('varchar')
  messageId: string;

  @Column({ type: 'varchar', default: 'reply' })
  type: 'reply' | 'dm';

  @Column()
  ownerId: string;

  @Column()
  channelId: string;

  @Column({ default: null, nullable: true, type: 'int' })
  billId: number | null;
}
