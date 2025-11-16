# Vector DB 기반 Q&A 챗봇 시스템

ESTSoft 바이브코딩 인턴십 과제 - Hallucination 없는 정확한 답변만 제공하는 지식 챗봇

## 프로젝트 개요

이 프로젝트는 **Vector Database**를 활용하여 사전 정의된 Q&A 데이터에서만 정확한 답변을 제공하는 챗봇 시스템입니다. LLM이 임의로 답변을 생성하지 않고, 유사도 검색을 통해 가장 적합한 원본 답변만을 반환하여 **Hallucination을 완전히 방지**합니다.

## 기술 스택

### Frontend
- **Next.js 16** - React 기반 풀스택 프레임워크
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 유틸리티 우선 스타일링

### Backend & AI
- **Pinecone** - Vector Database (벡터 저장 및 유사도 검색)
- **Google Gemini API** - 텍스트 임베딩 생성 (`text-embedding-004` 모델)
- **Next.js API Routes** - 서버리스 API 엔드포인트

### 배포
- **Vercel** - 프로덕션 배포 및 호스팅

## 핵심 기능 및 Hallucination 방지 전략

### 1. 유사도 임계값 (Similarity Threshold)
```typescript
const SIMILARITY_THRESHOLD = 0.65;
```
- 유사도가 **0.65 이하**인 경우 답변을 제공하지 않음
- "정확한 답변을 제공할 수 없습니다" 메시지 반환
- 불확실한 답변 차단

### 2. 원본 답변만 사용 (No LLM Generation)
```typescript
const answer = topMatch.metadata?.answer as string;
```
- LLM이 새로운 답변을 생성하지 않음
- Pinecone 메타데이터에 저장된 **원본 답변만 추출**하여 반환
- 100% 신뢰할 수 있는 응답 보장

### 3. Top-K 제한 및 Hybrid Search
```typescript
const queryResponse = await index.query({
  vector: questionEmbedding,
  topK: 10,
  includeMetadata: true,
});

// 키워드 매칭 재랭킹
userKeywords.forEach(keyword => {
  if (keyword.length > 2 && matchedQ.includes(keyword)) {
    keywordBonus += 0.1;
  }
});
```
- 상위 10개 결과를 벡터 유사도로 검색
- **Hybrid Search**: 키워드 매칭으로 재랭킹
- 정확히 일치하는 질문에 +0.5 보너스 부여
- 가장 높은 점수의 1개 결과만 반환

### 4. 신뢰도 시각화 (100점 만점)
- 각 답변에 유사도 점수 **(0-100점)** 표시
- 75점 이상: 초록색 바, 75점 미만: 노란색 바
- 사용자가 답변의 신뢰성을 직접 확인 가능
- 매칭된 원본 질문도 함께 표시

## 프로젝트 구조

```
vector-chatbot/
├── app/
│   ├── page.tsx                    # 메인 UI (ChatGPT 스타일 인터페이스)
│   ├── globals.css                 # 글로벌 스타일 및 애니메이션
│   └── api/
│       └── chat/
│           └── route.ts            # 챗봇 API (유사도 검색 + 답변 반환)
├── lib/
│   ├── pinecone.ts                 # Pinecone 클라이언트 설정
│   └── gemini.ts                   # Gemini 임베딩 생성
├── scripts/
│   ├── upload-data.ts              # Excel 데이터 → Vector DB 업로드
│   ├── reset-and-upload.ts         # 기존 데이터 삭제 후 재업로드
│   └── check-data.ts               # Pinecone 데이터 확인
├── data/
│   └── [ESTSoft]+바이브+코딩+인턴+샘플+Q_A+데이터+1.xlsx
├── .env.local                      # 환경 변수 (API Keys)
└── package.json
```

## 로컬 실행 방법

### 1. 환경 설정

#### 필수 API Keys 준비
- **Pinecone API Key**: [Pinecone Console](https://app.pinecone.io/)
- **Gemini API Key**: [Google AI Studio](https://aistudio.google.com/app/apikey)

#### `.env.local` 파일 생성
```bash
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=qa-chatbot
GEMINI_API_KEY=your_gemini_api_key
```

### 2. 의존성 설치
```bash
npm install
```

### 3. Pinecone 인덱스 생성
Pinecone 콘솔에서 다음 설정으로 인덱스 생성:
- **Index Name**: `qa-chatbot`
- **Dimensions**: `768`
- **Metric**: `cosine`
- **Cloud**: `AWS`
- **Region**: `us-east-1`

### 4. 데이터 업로드
```bash
npm run upload
```

**예상 출력:**
```
🚀 Starting data upload process...
📂 Reading file: ...
✅ Parsed 13 Q&A pairs
🔍 Checking Pinecone index...
✅ Index already exists
🔄 Generating embeddings and uploading...
[1/13] 바이브코딩 인턴 지원자격이 어떻게 되나요?...
  ✓ Uploaded
...
✅ Upload completed!
📊 Total: 13 Q&A pairs uploaded
```

### 5. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## Vercel 배포 가이드

### 1. GitHub에 푸시
```bash
git init
git add .
git commit -m "Initial commit: Vector chatbot"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Vercel 배포
1. [Vercel Dashboard](https://vercel.com/new) 접속
2. GitHub 저장소 연결
3. **Environment Variables** 설정:
   - `PINECONE_API_KEY`
   - `PINECONE_INDEX_NAME`
   - `GEMINI_API_KEY`
4. **Deploy** 클릭

### 3. 배포 후 확인
- 배포 URL에서 챗봇 동작 테스트
- 샘플 질문으로 답변 정확도 검증

## 주요 API 명세

### POST `/api/chat`

**Request:**
```json
{
  "question": "바이브코딩 인턴 지원자격이 어떻게 되나요?"
}
```

**Response (성공 - 유사도 ≥ 0.65):**
```json
{
  "answer": "바이브코딩 인턴 지원에는 별도의 자격요건이 없습니다...",
  "source": "바이브코딩 인턴 지원자격이 어떻게 되나요?",
  "confidence": 92.5
}
```

**Response (실패 - 유사도 < 0.65):**
```json
{
  "answer": "죄송합니다. 정확한 답변을 제공할 수 없습니다. 다른 방식으로 질문해주시겠어요?",
  "source": null,
  "confidence": 55.3
}
```

## 설계 철학

### 왜 Vector DB인가?
1. **의미적 유사도 검색**: 키워드 매칭보다 정확한 질문 이해
2. **확장성**: 새로운 Q&A 추가 시 단순히 벡터 업로드만 하면 됨
3. **속도**: 수백만 개의 벡터에서도 밀리초 단위 검색

### 왜 LLM 생성을 금지했는가?
- **Hallucination 제로**: 사실이 아닌 내용 생성 방지
- **신뢰성**: 모든 답변이 검증된 원본 데이터
- **일관성**: 동일 질문에 항상 동일한 답변

## 개선 가능한 부분

1. **다국어 지원**: 영어 Q&A 추가 및 언어 감지
2. **하이브리드 검색**: BM25 + Vector 검색 결합
3. **피드백 시스템**: 사용자가 답변 품질 평가
4. **대화 히스토리**: 이전 대화 맥락 고려
5. **관리자 대시보드**: Q&A 관리 UI

## 기술 블로그 작성 아이디어

- "Hallucination 없는 챗봇 만들기: Vector DB의 힘"
- "Pinecone + Gemini로 5분 만에 지식 챗봇 구축하기"
- "유사도 임계값 최적화: 0.75가 정답일까?"

## 라이선스

MIT License

## 문의

프로젝트 관련 문의사항은 이슈로 남겨주세요.

---

**개발자**: ESTSoft 바이브코딩 인턴십 지원자
**개발 기간**: 2025년 11월
**기술 키워드**: `Vector DB`, `RAG`, `Hallucination Prevention`, `Next.js`, `Pinecone`, `Gemini`
