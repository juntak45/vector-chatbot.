# Vector DB 기반 Q&A 챗봇

ESTSoft 바이브코딩 인턴십 과제

## 배포 URL
- **서비스**: https://vector-chatbot-git-main-juntaks-projects.vercel.app
- **GitHub**: https://github.com/juntak45/vector-chatbot

## 기술 스택

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Vector DB**: Pinecone
- **Embedding**: Google Gemini API (text-embedding-004)
- **배포**: Vercel

## 핵심 기능

### 1. Hallucination 방지
```typescript
const SIMILARITY_THRESHOLD = 0.65;
```
- 유사도 65점 미만일 경우 답변 거부
- LLM 생성 없이 **원본 답변만 반환**
- 불확실한 응답 차단

### 2. Hybrid Search
```typescript
// 벡터 유사도 + 키워드 매칭
const adjustedScore = vectorScore + keywordBonus;
```
- Top-10 벡터 검색
- 키워드 매칭으로 재랭킹 (+0.1/키워드)
- 정확히 일치 시 +0.5 보너스

### 3. 신뢰도 시각화 (100점 만점)
- 실시간 신뢰도 점수 표시
- 75점 이상: 초록색 / 미만: 노란색
- 매칭된 원본 질문 표시

## 프로젝트 구조

```
vector-chatbot/
├── app/
│   ├── page.tsx              # 메인 UI
│   └── api/chat/route.ts     # 챗봇 API
├── lib/
│   ├── pinecone.ts           # Pinecone 설정
│   └── gemini.ts             # 임베딩 생성
├── scripts/
│   ├── upload-data.ts        # 데이터 업로드
│   └── reset-and-upload.ts   # 리셋 후 업로드
└── data/
    └── [ESTSoft]+바이브+...xlsx
```

## 설치 및 실행

### 1. 환경변수 설정 (.env.local)
```
PINECONE_API_KEY=your_key
PINECONE_INDEX_NAME=qa-chatbot
GEMINI_API_KEY=your_key
```

### 2. 설치 및 실행
```bash
npm install
npm run dev
```

### 3. 데이터 업로드
```bash
npx tsx scripts/reset-and-upload.ts
```

## API 명세

### POST /api/chat

**Request:**
```json
{
  "question": "Perso.ai는 어떤 서비스인가요?"
}
```

**Response:**
```json
{
  "answer": "Perso.ai는 이스트소프트가 개발한 다국어 AI 영상 더빙 플랫폼으로, 누구나 언어의 장벽 없이 영상을 제작하고 공유할 수 있도록 돕는 AI SaaS 서비스입니다.",
  "source": "Perso.ai는 어떤 서비스인가요?",
  "confidence": 85.3
}
```

## 정확도 향상 전략

1. **임계값 기반 필터링**: 65점 미만 답변 거부
2. **Hybrid Search**: 벡터 + 키워드 결합
3. **원본 답변만 사용**: LLM 생성 금지
4. **질문+답변 임베딩**: 더 풍부한 의미 표현

---

**개발자**: 오준탁
**개발 기간**: 2025년 11월
