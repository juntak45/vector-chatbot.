import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';

// 환경변수 명시적으로 로드
dotenv.config({ path: '.env.local' });

console.log('Pinecone API Key:', process.env.PINECONE_API_KEY ? 'exists' : 'missing');
console.log('Index Name:', process.env.PINECONE_INDEX_NAME);

if (!process.env.PINECONE_API_KEY) {
  throw new Error('PINECONE_API_KEY is not defined');
}

if (!process.env.PINECONE_INDEX_NAME) {
  throw new Error('PINECONE_INDEX_NAME is not defined');
}

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

export const INDEX_NAME = process.env.PINECONE_INDEX_NAME;

export const getIndex = () => {
  return pinecone.index(INDEX_NAME);
};