# GitHub 배포 가이드

현재 작업한 결과물을 `psj066.github.io` 리포지토리에 올리는 순서입니다.

## 1. 기존 폴더 정리 (선택사항)
만약 이미 `psj066.github.io` 폴더가 있고 그 안에 작업하신 거라면 이 단계는 건너뛰셔도 됩니다.
지금 작업하신 폴더(`CCC_순_Profile`)의 내용물을 GitHub 리포지토리 폴더로 옮겨야 합니다.

## 2. 파일 이동
작업하신 모든 파일(`index.html`, `css`, `js`, `assets` 등)을 `psj066.github.io` 로컬 저장소 폴더에 복사/덮어쓰기 하세요.

*주의: `google_apps_script.js` 파일은 서버 코드이므로 GitHub에 올릴 필요는 없으나, 백업용으로 올려도 무방합니다.*

## 3. Git 명령어 실행 (터미널)
터미널(CMD 또는 PowerShell)을 열고, `psj066.github.io` 폴더로 이동한 뒤 아래 명령어를 순서대로 입력하세요.

```bash
# 1. 변경된 파일 모두 스테이징
git add .

# 2. 커밋 메시지 작성
git commit -m "Update: Apply Warm & Cozy theme and add Google Drive backend"

# 3. GitHub로 푸시 (업로드)
git push origin main
```
*(만약 브랜치 이름이 `master`라면 `git push origin master` 입력)*

## 4. 확인
약 1~5분 뒤 `https://psj066.github.io` 에 접속해서 변경사항이 적용되었는지 확인하세요.
(브라우저 캐시 때문에 바로 안 보일 수 있으니, `Ctrl + Shift + R` 로 강력 새로고침을 하세요.)
