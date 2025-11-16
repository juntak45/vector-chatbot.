import { NextRequest, NextResponse } from 'next/server';
import { getIndex } from '@/lib/pinecone';
import { generateEmbedding } from '@/lib/gemini';

// Hallucination 방지를 위한 유사도 임계값
// Gemini 임베딩 특성상 0.65로 조정 (질문+답변 임베딩 사용 시)
const SIMILARITY_THRESHOLD = 0.65;

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: '질문을 입력해주세요.' },
        { status: 400 }
      );
    }

    console.log('📝 User question:', question);

    // 1. 질문을 임베딩으로 변환
    // 단순히 질문만 임베딩 (접두사 없이)
    const questionEmbedding = await generateEmbedding(question);
    console.log('✅ Generated embedding');

    // 2. Pinecone에서 유사한 질문 검색 (Top-10으로 확대)
    const index = getIndex();
    const queryResponse = await index.query({
      vector: questionEmbedding,
      topK: 10,
      includeMetadata: true,
    });

    console.log('🔍 Search results:', queryResponse.matches?.length || 0);

    if (!queryResponse.matches || queryResponse.matches.length === 0) {
      return NextResponse.json({
        answer: '죄송합니다. 해당 질문에 대한 답변을 찾을 수 없습니다.',
        source: null,
        confidence: 0,
      });
    }

    // 디버깅: Top-3 결과 모두 출력
    console.log('\n📊 Top 3 matches:');
    queryResponse.matches.forEach((match, i) => {
      console.log(`  [${i + 1}] Score: ${match.score?.toFixed(4)} | Q: ${match.metadata?.question}`);
    });
    console.log('');

    // 3. 키워드 매칭을 통한 재랭킹 (Hybrid Search)
    // 사용자 질문의 핵심 키워드 추출
    const userKeywords = question.toLowerCase().split(/\s+/);

    // 각 매치에 키워드 보너스 점수 추가
    const rerankedMatches = queryResponse.matches.map(match => {
      const matchedQ = (match.metadata?.question as string || '').toLowerCase();
      let keywordBonus = 0;

      // 각 키워드가 매치되면 보너스 추가
      userKeywords.forEach(keyword => {
        if (keyword.length > 2 && matchedQ.includes(keyword)) {
          keywordBonus += 0.1;
        }
      });

      // 정확히 같은 질문이면 큰 보너스
      if (matchedQ === question.toLowerCase()) {
        keywordBonus += 0.5;
      }

      return {
        ...match,
        adjustedScore: (match.score || 0) + keywordBonus
      };
    });

    // 조정된 점수로 재정렬
    rerankedMatches.sort((a, b) => b.adjustedScore - a.adjustedScore);

    console.log('📊 After keyword reranking:');
    rerankedMatches.forEach((match, i) => {
      console.log(`  [${i + 1}] Adjusted: ${match.adjustedScore.toFixed(4)} | Q: ${match.metadata?.question}`);
    });
    console.log('');

    // 4. 가장 유사한 결과 선택
    const topMatch = rerankedMatches[0];
    const confidence = topMatch.adjustedScore;
    const confidencePercent = Math.min(confidence * 100, 100); // 100점 만점으로 변환

    console.log(`📊 Top match confidence: ${confidencePercent.toFixed(1)}점`);
    console.log(`📄 Matched question: ${topMatch.metadata?.question}`);

    // 4. 유사도 임계값 체크 (Hallucination 방지)
    if (confidence < SIMILARITY_THRESHOLD) {
      return NextResponse.json({
        answer: '죄송합니다. 정확한 답변을 제공할 수 없습니다. 다른 방식으로 질문해주시겠어요?',
        source: null,
        confidence: confidencePercent,
      });
    }

    // 5. 메타데이터에서 원본 답변 추출 (LLM 생성 금지)
    const answer = topMatch.metadata?.answer as string;
    const matchedQuestion = topMatch.metadata?.question as string;

    return NextResponse.json({
      answer: answer,
      source: matchedQuestion,
      confidence: confidencePercent,
    });

  } catch (error) {
    console.error('❌ Error in chat API:', error);
    return NextResponse.json(
      { error: '답변 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
