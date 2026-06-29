import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env') });

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
});

async function testRedisConnection() {
  console.log('🔍 Testing Redis Connection...\n');
  console.log('Configuration:');
  console.log(`  Host: ${process.env.REDIS_HOST || 'localhost'}`);
  console.log(`  Port: ${process.env.REDIS_PORT || '6379'}`);
  console.log(`  Database: ${process.env.REDIS_DB || '0'}`);
  console.log('');

  try {
    // Test 1: Ping
    console.log('Test 1: PING command...');
    const pingResult = await redis.ping();
    console.log(`✅ PING successful: ${pingResult}\n`);

    // Test 2: Set/Get
    console.log('Test 2: SET/GET operations...');
    await redis.set('test:connection', 'Hello Redis from Jawab!', 'EX', 60);
    const value = await redis.get('test:connection');
    console.log(`✅ SET/GET successful: ${value}\n`);

    // Test 3: Set operations
    console.log('Test 3: SET operations (for likes)...');
    await redis.sadd('test:likes:1', 'user1', 'user2', 'user3');
    const likeCount = await redis.scard('test:likes:1');
    const isMember = await redis.sismember('test:likes:1', 'user1');
    console.log(`✅ SET operations successful:`);
    console.log(`   - Like count: ${likeCount}`);
    console.log(`   - User1 is member: ${isMember}\n`);

    // Test 4: Sorted Set operations (for feeds)
    console.log('Test 4: Sorted Set operations (for feeds)...');
    const timestamp1 = Date.now();
    const timestamp2 = Date.now() + 1000;
    await redis.zadd('test:feed:1', timestamp1, 'post:1');
    await redis.zadd('test:feed:1', timestamp2, 'post:2');
    const feedCount = await redis.zcard('test:feed:1');
    const feedItems = await redis.zrevrange('test:feed:1', 0, -1);
    console.log(`✅ Sorted Set operations successful:`);
    console.log(`   - Feed count: ${feedCount}`);
    console.log(`   - Feed items: ${feedItems.join(', ')}\n`);

    // Test 5: Hash operations (for poll votes)
    console.log('Test 5: Hash operations (for poll votes)...');
    await redis.hset('test:poll:votes:1', 'user1', 'option1');
    await redis.hset('test:poll:votes:1', 'user2', 'option2');
    const voteCount = await redis.hlen('test:poll:votes:1');
    const userVote = await redis.hget('test:poll:votes:1', 'user1');
    console.log(`✅ Hash operations successful:`);
    console.log(`   - Vote count: ${voteCount}`);
    console.log(`   - User1 vote: ${userVote}\n`);

    // Test 6: Counter operations
    console.log('Test 6: Counter operations...');
    await redis.set('test:counter', '0');
    await redis.incr('test:counter');
    await redis.incr('test:counter');
    const counterValue = await redis.get('test:counter');
    console.log(`✅ Counter operations successful: ${counterValue}\n`);

    // Test 7: Pipeline operations
    console.log('Test 7: Pipeline operations...');
    const pipeline = redis.pipeline();
    pipeline.set('test:pipeline:1', 'value1');
    pipeline.set('test:pipeline:2', 'value2');
    pipeline.get('test:pipeline:1');
    pipeline.get('test:pipeline:2');
    const results = await pipeline.exec();
    console.log(`✅ Pipeline operations successful:`);
    console.log(`   - Executed ${results?.length} commands\n`);

    // Test 8: Expiration
    console.log('Test 8: Key expiration...');
    await redis.setex('test:expire', 5, 'will expire');
    const ttl = await redis.ttl('test:expire');
    console.log(`✅ Expiration test successful: TTL = ${ttl} seconds\n`);

    // Cleanup
    console.log('Cleaning up test keys...');
    await redis.del(
      'test:connection',
      'test:likes:1',
      'test:feed:1',
      'test:poll:votes:1',
      'test:counter',
      'test:pipeline:1',
      'test:pipeline:2',
      'test:expire',
    );
    console.log('✅ Cleanup complete\n');

    // Get Redis info
    console.log('Redis Server Information:');
    const info = await redis.info('server');
    const versionMatch = info.match(/redis_version:([^\r\n]+)/);
    const version = versionMatch ? versionMatch[1] : 'Unknown';
    console.log(`  Version: ${version}`);
    
    const memoryInfo = await redis.info('memory');
    const usedMemoryMatch = memoryInfo.match(/used_memory_human:([^\r\n]+)/);
    const usedMemory = usedMemoryMatch ? usedMemoryMatch[1] : 'Unknown';
    console.log(`  Used Memory: ${usedMemory}\n`);

    console.log('🎉 All Redis tests passed successfully!');
    console.log('✅ Redis is ready to use with Jawab Backend\n');

    await redis.quit();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Redis connection test failed!\n');
    console.error('Error details:');
    console.error(`  Message: ${error.message}`);
    console.error(`  Code: ${error.code || 'N/A'}\n`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Troubleshooting:');
      console.error('  1. Make sure Memurai service is running');
      console.error('  2. Check if Memurai is listening on port 6379');
      console.error('  3. Verify REDIS_HOST and REDIS_PORT in .env file');
      console.error('  4. Check Windows Services for "Memurai" service\n');
    } else if (error.code === 'ENOTFOUND') {
      console.error('💡 Troubleshooting:');
      console.error('  1. Check REDIS_HOST in .env file');
      console.error('  2. Verify the hostname is correct\n');
    }

    await redis.quit().catch(() => {});
    process.exit(1);
  }
}

// Handle connection events
redis.on('connect', () => {
  console.log('📡 Redis: Connecting...\n');
});

redis.on('ready', () => {
  console.log('✅ Redis: Connection ready\n');
});

redis.on('error', (error) => {
  console.error('❌ Redis: Connection error:', error.message);
});

redis.on('close', () => {
  console.log('🔌 Redis: Connection closed\n');
});

// Run tests
testRedisConnection();

