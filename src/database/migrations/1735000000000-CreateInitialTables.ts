import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateInitialTables1735000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'member_id',
            type: 'varchar',
            length: '50',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['user', 'consultant', 'admin', 'superAdmin'],
            default: "'user'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'active', 'suspended'],
            default: "'active'",
          },
          {
            name: 'phone_number',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'profile_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'membership_plan_id',
            type: 'varchar',
            length: '50',
            default: "'basic'",
          },
          {
            name: 'membership_expires_at',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'pending_membership_upgrade',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'pending_membership_upgrade_at',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'purchased_exams',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'has_purchased_exam',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for users table
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_email',
        columnNames: ['email'],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_member_id',
        columnNames: ['member_id'],
      }),
    );

    // Create profiles table
    await queryRunner.createTable(
      new Table({
        name: 'profiles',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'first_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'last_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'gender',
            type: 'enum',
            enum: ['male', 'female'],
            isNullable: false,
          },
          {
            name: 'date_of_birth',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'nationality',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'city',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'height',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'education',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'occupation',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'religiosity_level',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'religion',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'marital_status',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'marriage_type',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'polygamy_acceptance',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'compatibility_test',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'country_of_residence',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'about',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'guardian_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'guardian_contact',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'photo_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'photo_storage',
            type: 'enum',
            enum: ['cloudinary', 'local'],
            default: "'cloudinary'",
          },
          {
            name: 'photo_public_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'is_verified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign key for profiles -> users
    await queryRunner.createForeignKey(
      'profiles',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes for profiles table
    await queryRunner.createIndex(
      'profiles',
      new TableIndex({
        name: 'idx_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'profiles',
      new TableIndex({
        name: 'idx_gender',
        columnNames: ['gender'],
      }),
    );

    await queryRunner.createIndex(
      'profiles',
      new TableIndex({
        name: 'idx_date_of_birth',
        columnNames: ['date_of_birth'],
      }),
    );

    await queryRunner.createIndex(
      'profiles',
      new TableIndex({
        name: 'idx_city',
        columnNames: ['city'],
      }),
    );

    await queryRunner.createIndex(
      'profiles',
      new TableIndex({
        name: 'idx_nationality',
        columnNames: ['nationality'],
      }),
    );

    await queryRunner.createIndex(
      'profiles',
      new TableIndex({
        name: 'idx_country_of_residence',
        columnNames: ['country_of_residence'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop profiles table and its foreign keys
    await queryRunner.dropTable('profiles', true);
    
    // Drop users table
    await queryRunner.dropTable('users', true);
  }
}


