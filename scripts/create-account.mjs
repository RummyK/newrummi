// 사용법:
//   node scripts/create-account.mjs student 20601 홍길동 임시비밀번호123
//   node scripts/create-account.mjs teacher kimareum 임시비밀번호456 김아름
//
// 실행하면 비밀번호를 안전하게 해시로 바꾼 뒤, Supabase SQL Editor에 붙여넣을 INSERT문을 출력합니다.
// 이 스크립트는 로컬 컴퓨터에서만 실행하세요 (node_modules 설치 필요: npm install).

import bcrypt from "bcryptjs";

const [, , type, ...rest] = process.argv;

async function main() {
  if (type === "student") {
    const [studentNumber, name, password] = rest;
    if (!studentNumber || !name || !password) {
      console.log("사용법: node scripts/create-account.mjs student <학번> <이름> <비밀번호>");
      return;
    }
    const hash = await bcrypt.hash(password, 10);
    console.log(
      `insert into students (student_number, name, password_hash) values ('${studentNumber}', '${name}', '${hash}');`
    );
  } else if (type === "teacher") {
    const [username, password, name] = rest;
    if (!username || !password || !name) {
      console.log("사용법: node scripts/create-account.mjs teacher <아이디> <비밀번호> <이름>");
      return;
    }
    const hash = await bcrypt.hash(password, 10);
    console.log(
      `insert into teachers (username, password_hash, name) values ('${username}', '${hash}', '${name}');`
    );
  } else {
    console.log("첫 번째 인자는 student 또는 teacher 여야 합니다.");
  }
}

main();
