import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export const bigintToNumber = {
  to: (v: number) => v,
  from: (v: string | null) => (v === null ? v : Number(v)),
};

@Entity()
@Index(['email'])
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @Column()
  email: string;

  @Column({ type: 'bigint', default: 0, transformer: bigintToNumber })
  balance: number;

  @Column({ default: 'EUR' })
  currency: string;
}
