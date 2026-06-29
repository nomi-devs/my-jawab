import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity('app_settings')
export class AppSetting {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: false,
        comment: 'Setting key (e.g., current_currency)',
    })
    @Index({ unique: true })
    setting_key: string;

    @Column({
        type: 'text',
        nullable: true,
        comment: 'Setting value',
    })
    setting_value: string;

    @Column({
        type: 'varchar',
        length: 255,
        default: 'general',
        comment: 'Setting group for categorization',
    })
    @Index()
    setting_group: string;

    @Column({ type: 'int', nullable: true, comment: 'Created by user ID' })
    created_by: number | null;

    @Column({ type: 'int', nullable: true, comment: 'Updated by user ID' })
    updated_by: number | null;

    @CreateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP(6)',
        comment: 'When setting was created',
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
