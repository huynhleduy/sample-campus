import {
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class AbstractAuditEntity {
  @CreateDateColumn({
    type: 'timestamptz',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updatedAt!: Date;

  @Column({
    type: 'int',
    nullable: true,
  })
  createdBy!: number | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  updatedBy!: number | null;
}

export abstract class AbstractEntity extends AbstractAuditEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;
}
