# Personal AI Hub

나만을 위한 AI가 모여있는 웹 플랫폼입니다.

## 기능

### 문서함
- 이력서, 포트폴리오, 주간보고서 템플릿 등 개인 문서 관리
- PDF, DOCX, PPTX, Excel, Markdown 파일 지원
- Gemini 3 Flash로 문서 자동 파싱 및 키워드 추출

### AI 기능
1. **자기소개서 AI** - 문서함의 이력서와 회사/직무 정보를 바탕으로 맞춤형 자기소개서 생성
2. **주간보고 AI** - 기존 보고서 스타일을 학습하여 구조화된 주간보고서 생성
3. **기획서 AI** - Deep Research 기반 시장/법률/기술 조사 후 상세 기획서 작성
4. **다국어 AI** - 텍스트 번역, SRT 자막 번역, 비즈니스 이메일 작성
5. **경제 이슈 AI** - IT/경제 뉴스 요약, 관심 종목 추적, 소비 분석
6. **여행 코스 AI** - 맞춤형 여행/데이트 코스, 일정, 예산, 준비물 체크리스트

## 기술 스택

### Frontend
- React 19 + TypeScript
- Vite 6
- Tailwind CSS + shadcn/ui
- Zustand (상태관리)
- TanStack Query (데이터 페칭)
- React Router 7

### Backend
- FastAPI
- SQLAlchemy 2.x (비동기)
- LangGraph + LangChain
- PostgreSQL 16
- Redis 7

### AI/LLM
- OpenAI GPT-5 시리즈
- Google Gemini 3
- Anthropic Claude 4.5

### 배포
- Frontend: Vercel
- Backend: Railway
- CI/CD: GitHub Actions

## 로컬 개발 환경 설정

### 1. 저장소 클론

```bash
git clone https://github.com/yourusername/personal-ai-hub.git
cd personal-ai-hub
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
# .env 파일을 열고 필요한 값 입력
```

### 3. Docker로 데이터베이스 실행

```bash
docker-compose up -d postgres redis
```

### 4. Backend 설정

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 데이터베이스 마이그레이션
alembic upgrade head

# 서버 실행
uvicorn app.main:app --reload --port 8000
```

### 5. Frontend 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 6. 접속

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API 문서: http://localhost:8000/docs

## 환경 변수

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/personal_ai_hub

# Redis
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=your-secret-key-here

# LLM API Keys
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
ANTHROPIC_API_KEY=sk-ant-...

# Email (Resend)
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@yourdomain.com
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000
```

## 프로젝트 구조

```
personal-ai-hub/
├── frontend/                    # React 프론트엔드
│   ├── src/
│   │   ├── components/          # UI 컴포넌트
│   │   ├── pages/               # 페이지 컴포넌트
│   │   ├── stores/              # Zustand 스토어
│   │   ├── services/            # API 서비스
│   │   ├── hooks/               # 커스텀 훅
│   │   ├── types/               # TypeScript 타입
│   │   └── lib/                 # 유틸리티
│   └── vercel.json
│
├── backend/                     # FastAPI 백엔드
│   ├── app/
│   │   ├── api/                 # API 라우터
│   │   ├── core/                # 설정, 보안, DB
│   │   ├── models/              # SQLAlchemy 모델
│   │   ├── schemas/             # Pydantic 스키마
│   │   ├── services/            # 비즈니스 로직
│   │   ├── graphs/              # LangGraph 워크플로우
│   │   └── main.py
│   ├── alembic/                 # DB 마이그레이션
│   ├── Dockerfile
│   └── railway.toml
│
├── docker-compose.yml
├── .github/workflows/ci.yml
└── README.md
```

## 배포

### Vercel (Frontend)

1. Vercel에서 새 프로젝트 생성
2. GitHub 저장소 연결
3. Root Directory를 `frontend`로 설정
4. 환경 변수 설정: `VITE_API_URL`

### Railway (Backend)

1. Railway에서 새 프로젝트 생성
2. GitHub 저장소 연결
3. Root Directory를 `backend`로 설정
4. PostgreSQL 및 Redis 애드온 추가
5. 환경 변수 설정

### GitHub Secrets

CI/CD를 위해 다음 secrets 설정:

- `RAILWAY_TOKEN`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `OPENAI_API_KEY`
- `GOOGLE_API_KEY`
- `ANTHROPIC_API_KEY`

## 라이선스

MIT License
