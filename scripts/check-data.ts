import * as dotenv from 'dotenv';
import { pinecone, INDEX_NAME } from '../lib/pinecone';

dotenv.config({ path: '.env.local' });

async function checkData() {
  console.log('🔍 Checking Pinecone data...\n');

  try {
    const index = pinecone.index(INDEX_NAME);

    // 인덱스 통계 확인
    const stats = await index.describeIndexStats();
    console.log('📊 Index Stats:');
    console.log(`  Total vectors: ${stats.totalRecordCount}`);
    console.log(`  Dimension: ${stats.dimension}\n`);

    // 모든 벡터 ID 조회 (최대 100개)
    const queryResponse = await index.query({
      vector: new Array(768).fill(0), // 임의의 벡터로 검색
      topK: 100,
      includeMetadata: true,
    });

    console.log(`📋 Found ${queryResponse.matches?.length || 0} vectors:\n`);

    queryResponse.matches?.forEach((match, i) => {
      console.log(`[${i + 1}] ID: ${match.id}`);
      console.log(`    Q: ${match.metadata?.question}`);
      console.log(`    A: ${(match.metadata?.answer as string)?.substring(0, 80)}...`);
      console.log(`    Score: ${match.score?.toFixed(4)}\n`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkData();
