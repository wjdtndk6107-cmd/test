## Supabase 설정 방법 (이 프로젝트용)

### 1) 스키마 생성
- Supabase 대시보드 → **SQL Editor** → New query
- 아래 파일 내용을 그대로 붙여넣고 실행
  - `supabase/schema.sql`

### 2) Auth 설정(판매자 로그인)
이 앱은 판매자 화면에서 `signInWithOtp`(이메일 매직링크)를 사용합니다.

- Supabase 대시보드 → **Authentication → Providers → Email**
  - Email provider 활성화
  - (필요 시) 이메일 발송 설정

### 3) 환경변수(Vite)
로컬의 `.env.local`에 아래 키가 있어야 합니다.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 4) 동작 확인
- 홈(`/`)에서 공구 목록 로딩이 에러 없이 되고
- 판매자(`/seller`)에서 이메일 입력 → 매직링크 로그인 후
- `/seller/create`에서 공구 생성이 되면 연결이 정상입니다.

