import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
@Index(['subscriberId', 'ownerId'], { unique: true })
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  subscriberId: string;

  @Column()
  ownerId: string;
}
