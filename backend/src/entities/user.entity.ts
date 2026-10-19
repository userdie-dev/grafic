import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** sha256 of the device token; the token itself is never stored. */
  @Column({ unique: true })
  tokenHash: string;

  @Column({ unique: true })
  shareCode: string;

  @CreateDateColumn()
  createdAt: Date;
}
