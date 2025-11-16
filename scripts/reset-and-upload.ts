import * as XLSX from 'xlsx';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { pinecone, INDEX_NAME } from '../lib/pinecone';
import { generateEmbedding } from '../lib/gemini';

dotenv.config({ path: '.env.local' });

interface QAData {
  question: string;
  answer: string;
}

async function resetAndUpload() {
  console.log('🚀 Starting RESET and UPLOAD process...\n');

  try {
    const index = pinecone.index(INDEX_NAME);

    // 1. 기존 데이터 모두 삭제
    console.log('🗑️  Deleting all existing vectors...');
    await index.deleteAll();
    console.log('✅ All vectors deleted\n');

    // 잠시 대기 (Pinecone이 삭제를 처리하도록)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 2. Excel 파일 읽기
    const filePath = path.join(process.cwd(), 'data', '[ESTSoft]+바이브+코딩+인턴+샘플+Q_A+데이터+1.xlsx');
    console.log(`📂 Reading file: ${filePath}`);

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

    // 3. Q&A 쌍으로 파싱
    const qaData: QAData[] = [];
    let currentQuestion = '';

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const content = row.__EMPTY_1 || row['내용'] || '';

      if (typeof content === 'string') {
        if (content.startsWith('Q.')) {
          currentQuestion = content.replace('Q. ', '').trim();
        } else if (content.startsWith('A.') && currentQuestion) {
          const answer = content.replace('A. ', '').trim();
          qaData.push({ question: currentQuestion, answer });
          currentQuestion = '';
        }
      }
    }

    console.log(`✅ Parsed ${qaData.length} Q&A pairs\n`);

    // 4. 각 질문을 임베딩하고 업로드
    console.log('🔄 Generating embeddings and uploading...\n');

    for (let i = 0; i < qaData.length; i++) {
      const { question, answer } = qaData[i];

      console.log(`[${i + 1}/${qaData.length}] "${question.substring(0, 50)}..."`);

      // 질문+답변을 함께 임베딩 (접두사 없이 단순 연결)
      const textToEmbed = `${question} ${answer}`;
      const embedding = await generateEmbedding(textToEmbed);
      console.log(`  → Embedding: [${embedding.slice(0, 3).map(v => v.toFixed(4)).join(', ')}...]`);

      // Pinecone에 업로드
      await index.upsert([
        {
          id: `qa-${i}`,
          values: embedding,
          metadata: { question, answer },
        },
      ]);

      console.log(`  ✓ Uploaded\n`);

      // API 레이트 리밋 방지
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('✅ Upload completed!');
    console.log(`📊 Total: ${qaData.length} Q&A pairs uploaded`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

resetAndUpload()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
