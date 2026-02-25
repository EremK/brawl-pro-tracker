import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'brawlers' })
export class BrawlerEntity {
    @PrimaryColumn({ type: 'int' })
    id!: number;

    @Column({ type: 'varchar', length: 64 })
    name!: string;
}