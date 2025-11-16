import { Pinecone } from '@pinecone-database/pinecone';

// Vercel에서는 환경변수가 자동으로 주입됨
// 로컬에서는 Next.js가 .env.local을 자동으로 로드함

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