import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    Unique,
} from 'typeorm';

@Entity('currencies')
@Unique(['currency_code'])
export class Currency {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: false,
        comment: 'Currency name (e.g., US Dollar)',
    })
    currency_name: string;

    @Column({
        type: 'varchar',
        length: 10,
        nullable: false,
        comment: 'Currency code (e.g., USD)',
    })
    currency_code: string;

    @Column({
        type: 'varchar',
        length: 10,
        nullable: false,
        comment: 'Currency symbol (e.g., $)',
    })
    currency_symbol: string;

    @Column({
        type: 'tinyint',
        width: 1,
        default: 1,
        comment: 'Active status (0 = inactive, 1 = active)',
    })
    @Index()
    is_active: boolean;

    @Column({ type: 'int', nullable: true, comment: 'Created by user ID' })
    created_by: number | null;

    @Column({ type: 'int', nullable: true, comment: 'Updated by user ID' })
    updated_by: number | null;

    @CreateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP(6)',
        comment: 'When currency was created',
    })
    created_at: Date;

    @UpdateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP(6)',
        onUpdate: 'CURRENT_TIMESTAMP(6)',
        comment: 'Last update timestamp',
    })
    updated_at: Date;
}
