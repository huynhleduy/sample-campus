import { Column, Entity, PrimaryColumn } from 'typeorm';
import { AbstractAuditEntity } from '@src/common/database/abstract.entity';

@Entity('users')
export default class UserEntity extends AbstractAuditEntity {
  @PrimaryColumn('varchar')
  mezonId: string;

  @Column({ type: 'varchar', nullable: true })
  name?: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  email?: string;

  @Column({ type: 'varchar', nullable: true })
  avatar?: string;
}
