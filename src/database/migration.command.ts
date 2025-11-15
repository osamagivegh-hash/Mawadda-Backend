import { NestFactory } from '@nestjs/core';
import { MigrationModule } from './migration.module';
import { AddMemberIdMigration } from './migrations/add-member-id.migration';

async function runMigration() {
  const app = await NestFactory.createApplicationContext(MigrationModule);
  
  try {
    const migration = app.get(AddMemberIdMigration);
    await migration.run();
    console.log('🎉 Migration completed successfully');
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

async function rollbackMigration() {
  const app = await NestFactory.createApplicationContext(MigrationModule);
  
  try {
    const migration = app.get(AddMemberIdMigration);
    await migration.rollback();
    console.log('🎉 Migration rollback completed successfully');
  } catch (error) {
    console.error('💥 Migration rollback failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Check command line arguments
const command = process.argv[2];

if (command === 'rollback') {
  rollbackMigration();
} else {
  runMigration();
}
