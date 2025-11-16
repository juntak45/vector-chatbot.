import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

// 환경변수 로드
dotenv.config({ path: '.env.local' });

console.log('Gemini API Key:', process.env.GEMINI_API_KEY ? 'exists' : 'missing');

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not defined');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // 매 요청마다 새로운 모델 인스턴스 생성 (캐싱 방지)
    const freshGenAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = freshGenAI.getGenerativeModel({ model: 'text-embedding-004' });

    // 입력 텍스트 로그
    console.log(`  Input text: "${text.substring(0, 100)}..."`);

    const result = await model.embedContent(text);

    // 디버깅: 임베딩 차원 확인
    console.log(`  Embedding dimension: ${result.embedding.values.length}`);
    console.log(`  First 5 values: [${result.embedding.values.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);

    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}