import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('labs')
export class Lab {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('text')
  content: string; // Markdown content

  @Column({ default: 'beginner' })
  difficulty: string;

  @Column({ default: 60 })
  timeLimit: number; // minutes

  @CreateDateColumn()
  createdAt: Date;
}
