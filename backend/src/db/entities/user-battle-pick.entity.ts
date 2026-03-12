import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'user_battle_picks' })
@Index(['battleId', 'side'], { unique: true })
export class UserBattlePickEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  battleId!: string;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  userId!: string;

  @Column({ type: 'smallint' })
  side!: number;

  @Index()
  @Column({ type: 'varchar', length: 128 })
  compKey!: string;

  @Column({ type: 'smallint', default: 3 })
  teamSize!: number;

  @Column({ type: 'int', nullable: true }) b1!: number | null;
  @Column({ type: 'int', nullable: true }) b2!: number | null;
  @Column({ type: 'int', nullable: true }) b3!: number | null;
  @Column({ type: 'int', nullable: true }) b4!: number | null;
  @Column({ type: 'int', nullable: true }) b5!: number | null;

  @Index()
  @Column({ type: 'boolean', default: false })
  isUserSide!: boolean;
}
