import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
@Index(['userId', 'date', 'start'], { unique: true })
export class Shift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  /** YYYY-MM-DD */
  @Column()
  date: string;

  /** HH:mm */
  @Column()
  start: string;

  /** HH:mm */
  @Column()
  end: string;

  @Column({ type: 'varchar', nullable: true })
  note: string | null;
}
