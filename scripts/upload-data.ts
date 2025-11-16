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

async function uploadData() {
  console.log('🚀 Starting data upload process...\n');

  try {
    // 1. Excel 파일 읽기
    const filePath = path.join(process.cwd(), 'data', '[ESTSoft]+바이브+코딩+인턴+샘플+Q_A+데이터+1.xlsx');
    console.log(`📂 Reading file: ${filePath}`);
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

    // 2. Q&A 쌍으로 파싱
    const qaData: QAData[] = [];
    let currentQuestion = '';

    for (let i = 1; i < rawData.length; i++) { // 0번째는 헤더라서 1부터 시작
      const content = rawData[i].__EMPTY_1 || '';
      
      if (content.startsWith('Q.')) {
        currentQuestion = content.replace('Q. ', '').trim();
      } else if (content.startsWith('A.') && currentQuestion) {
        const answer = content.replace('A. ', '').trim();
        qaData.push({ question: currentQuestion, answer });
        currentQuestion = '';
      }
    }

    console.log(`✅ Parsed ${qaData.length} Q&A pairs\n`);

    // 확인용 출력
    console.log('📋 First 2 Q&A pairs:');
    qaData.slice(0, 2).forEach((qa, idx) => {
      console.log(`\n[${idx + 1}]`);
      console.log(`Q: ${qa.question}`);
      console.log(`A: ${qa.answer.substring(0, 100)}...`);
    });
    console.log('\n');

    // 3. Pinecone 인덱스 확인/생성
    console.log('🔍 Checking Pinecone index...');
    const indexList = await pinecone.listIndexes();
    const indexExists = indexList.indexes?.some((idx) => idx.name === INDEX_NAME);

    if (!indexExists) {
      console.log(`📝 Creating index: ${INDEX_NAME}`);
      await pinecone.createIndex({
        name: INDEX_NAME,
        dimension: 768,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
      });
      console.log('✅ Index created');
      console.log('⏳ Waiting 60 seconds for index to be ready...');
      await new Promise(resolve => setTimeout(resolve, 60000));
    } else {
      console.log('✅ Index already exists\n');
    }

    const index = pinecone.index(INDEX_NAME);

    // 4. 데이터 임베딩 및 업로드
    console.log('🔄 Generating embeddings and uploading...\n');
    
    for (let i = 0; i < qaData.length; i++) {
      const { question, answer } = qaData[i];
      
      console.log(`[${i + 1}/${qaData.length}] ${question.substring(0, 50)}...`);

      const embedding = await generateEmbedding(question);

      await index.upsert([
        {
          id: `qa-${i}`,
          values: embedding,
          metadata: { question, answer },
        },
      ]);

      console.log(`  ✓ Uploaded`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n✅ Upload completed!');
    console.log(`📊 Total: ${qaData.length} Q&A pairs uploaded`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

uploadData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));