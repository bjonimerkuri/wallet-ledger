import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { bigintToNumber } from './account.entity';

@Entity()
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  transferId: string;

  @Column()
  accountId: string;

  @Column({ type: 'bigint', transformer: bigintToNumber })
  amount: number;

  @CreateDateColumn()
  createdAt: Date;
}
