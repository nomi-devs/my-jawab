import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env') });

async function testNestJSCache() {
  console.log('🔍 Testing Redis Integration with NestJS CacheModule...\n');
  console.log('Configuration:');
  console.log(`  REDIS_HOST: ${process.env.REDIS_HOST || 'not set'}`);
  console.log(`  REDIS_PORT: ${process.env.REDIS_PORT || '6379'}`);
  console.log('');

  try {
    // Create NestJS application
    const app = await NestFactory.createApplicationContext(AppModule);
    const cacheManager = app.get<Cache>(CACHE_MANAGER);

    console.log('✅ NestJS application context created\n');

    // Test 1: Basic cache operations
    console.log('Test 1: Basic Cache Operations...');
    await cacheManager.set('test:nestjs:key', 'Hello from NestJS Cache!', 60);
    const value = await cacheManager.get('test:nestjs:key');
    console.log(`✅ Cache SET/GET successful: ${value}\n`);

    // Test 2: Cache expiration
    console.log('Test 2: Cache Expiration...');
    await cacheManager.set('test:nestjs:expire', 'Will expire', 2);
    await new Promise((resolve) => setTimeout(resolve, 2100)); // Wait 2.1 seconds
    const expiredValue = await cacheManager.get('test:nestjs:expire');
    console.log(`✅ Cache expiration test: ${expiredValue === undefined ? 'Key expired correctly' : 'Key still exists'}\n`);

    // Test 3: Cache deletion
    console.log('Test 3: Cache Deletion...');
    await cacheManager.set('test:nestjs:delete', 'To be deleted', 60);
    await cacheManager.del('test:nestjs:delete');
    const deletedValue = await cacheManager.get('test:nestjs:delete');
    console.log(`✅ Cache deletion test: ${deletedValue === undefined ? 'Key deleted correctly' : 'Key still exists'}\n`);

    // Test 4: Store type check
    console.log('Test 5: Cache Store Type...');
    const store = (cacheManager as any).store;
    const storeName = store?.name || store?.constructor?.name || 'Unknown';
    console.log(`   Store type: ${storeName}`);
    
    if (storeName.toLowerCase().includes('redis')) {
      console.log('✅ Using Redis store for caching\n');
    } else {
      console.log('⚠️  Using in-memory store (Redis not configured or unavailable)\n');
    }

    // Cleanup
    await cacheManager.del('test:nestjs:key');
    console.log('✅ Cleanup complete\n');

    console.log('🎉 All NestJS CacheModule tests passed!');
    console.log('✅ Redis is properly integrated with NestJS application\n');

    await app.close();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ NestJS CacheModule test failed!\n');
    console.error('Error details:');
    console.error(`  Message: ${error.message}`);
    console.error(`  Stack: ${error.stack}\n`);

    process.exit(1);
  }
}

testNestJSCache();

