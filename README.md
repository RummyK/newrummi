# 정보 학습 사이트 (1단계: 로그인 뼈대)

지금 이 코드는 "학생(학번+이름+비밀번호) / 교사(아이디+비밀번호) 로그인"까지만 동작합니다.
파이썬 문제풀이 화면, 과목 자료 업로드는 이 로그인 시스템이 배포 확인된 뒤 다음 단계로 이어서 만듭니다.

## 1. Supabase에 테이블 만들기

1. https://supabase.com 대시보드 접속 → 본인 프로젝트 선택
2. 왼쪽 메뉴 **SQL Editor** 클릭 → New query
3. `supabase/schema.sql` 파일 내용을 전체 복사해서 붙여넣고 **Run**
4. 왼쪽 메뉴 **Table Editor**에서 `students`, `teachers` 등 6개 테이블이 생겼는지 확인

## 2. GitHub에 코드 올리기

터미널(맥은 터미널 앱, 윈도우는 명령 프롬프트/PowerShell)에서 이 폴더로 이동한 뒤:

```bash
git init
git add .
git commit -m "첫 배포: 로그인 시스템"
```

이후 GitHub 사이트에서 새 저장소(Repository)를 하나 만들고(Public/Private 상관없음, README 추가 없이 빈 저장소로 생성), 생성 후 나오는 안내에 따라 아래처럼 연결합니다:

```bash
git remote add origin https://github.com/본인아이디/저장소이름.git
git branch -M main
git push -u origin main
```

## 3. Vercel에 배포하기

1. https://vercel.com 대시보드 → **Add New → Project**
2. 방금 만든 GitHub 저장소 선택 → Import
3. **Environment Variables** 항목에 아래 3개를 입력 (값은 Supabase 대시보드 > Project Settings > API 에서 확인):
   - `NEXT_PUBLIC_SUPABASE_URL` → 프로젝트 URL (예: `https://eoqdpldfjfjbizymapjn.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY` → **service_role** 키 (secret이라고 표시된 것, anon 키 아님)
   - `SESSION_SECRET` → 아무 32자 이상 랜덤 문자열 (예: 비밀번호 생성기로 만든 긴 문자열)
4. **Deploy** 클릭 → 1~2분 후 `https://프로젝트이름.vercel.app` 주소로 사이트가 뜹니다

## 4. 첫 교사/학생 계정 만들기

비밀번호는 반드시 해시로 저장해야 하므로, 계정은 이 스크립트로 만듭니다.

로컬 컴퓨터(방금 GitHub에 올린 폴더)에서:

```bash
npm install
node scripts/create-account.mjs teacher kimareum 원하는비밀번호 김아름
```

출력된 `insert into teachers ...` 문장을 복사해서 Supabase **SQL Editor**에 붙여넣고 Run 하면 교사 계정이 생성됩니다. 학생 계정도 같은 방식입니다:

```bash
node scripts/create-account.mjs student 20601 홍길동 학생비밀번호
```

## 5. 확인

배포된 주소로 접속 → `/login`(학생) 또는 `/teacher/login`(교사)에서 방금 만든 계정으로 로그인이 되는지 확인해주세요.

---

막히는 부분 있으면 화면 캡처나 에러 메시지를 그대로 보여주시면 바로 봐드릴게요.
