import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { bigintToNumber } from './account.entity';

@Entity()
@Unique(['fromAccountId', 'idempotencyKey'])
export class Transfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fromAccountId: string;

  @Column()
  toAccountId: string;

  @Column({ type: 'bigint', transformer: bigintToNumber })
  amount: number;

  @Column()
  idempotencyKey: string;

  @CreateDateColumn()
  createdAt: Date;
}
