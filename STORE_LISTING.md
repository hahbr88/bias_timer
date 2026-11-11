# Chrome 웹 스토어 등록 자료

이 문서는 Chrome 웹 스토어 개발자 대시보드에 입력할 문구와 제출 전 확인 사항을 정리한 내부 배포 자료입니다. 실제 기능 또는 데이터 처리 방식이 변경되면 이 문서와 `PRIVACY.md`를 함께 갱신해야 합니다.

## 기본 정보

- 제품명: `최애시 타이머`
- 영문 제품명: `Bias Time Timer`
- 추천 카테고리: `생산성(Productivity)`
- 홈페이지: `https://github.com/hahbr88/bias_timer`
- 지원 URL: `https://github.com/hahbr88/bias_timer/issues`
- 개인정보처리방침: `https://github.com/hahbr88/bias_timer/blob/main/PRIVACY.md`

## 한국어 등록 문구

### 요약

132자 이하로 사용하는 문구입니다.

```text
최애의 생일로 특별한 시간을 계산하고, 미리·정각 알림과 글쓰기 링크를 제공하는 Chrome 확장 프로그램입니다.
```

### 상세 설명

```text
최애시 타이머는 최애의 생일을 바탕으로 하루 두 번의 특별한 시간을 계산하고 알려주는 Chrome 확장 프로그램입니다.

최애의 이름과 애칭, 생일, 프로필 사진을 등록하면 다음 최애시까지 남은 시간을 확인할 수 있습니다. 원하는 시간만큼 미리 알림을 설정하고, 정각 알림을 통해 최애시를 놓치지 마세요.

주요 기능

• 최애의 생일을 기반으로 하루 두 번의 최애시 자동 계산
• 다음 최애시까지 실시간 카운트다운
• 최애별 1분부터 30분 전까지 미리 알림 설정
• 미리 알림과 정각 알림을 각각 켜고 끄는 기능
• 애칭과 프로필 사진이 표시되는 시스템 알림
• 정시 1분 동안 강조되는 현재 최애시 화면
• 저장한 링크로 바로 이동하는 글쓰기 버튼
• 여러 최애 등록과 드래그 앤 드롭 순서 변경
• Chrome 동기화를 통한 최애 정보와 알림 설정 공유
• 프로필 사진 정방형 자르기와 미리보기
• 작성 중인 등록 내용 자동 임시 저장
• 최애 정보와 프로필 사진의 JSON 백업 및 복원
• 알림 권한과 다음 예약을 확인하는 알림 진단 기능
• 한국어 및 영어 인터페이스

최애 정보와 알림 설정은 Chrome 동기화가 켜진 동일 계정의 Chrome 사이에서 동기화될 수 있습니다. 프로필 사진은 각 기기에만 저장되며 개발자 서버로 전송되지 않습니다. 사진을 다른 기기로 옮기려면 백업·복원 기능을 이용할 수 있습니다.

알림은 Chrome이 실행 중이거나 백그라운드에서 동작할 때 제공됩니다. 운영체제의 알림 설정, 집중 모드 및 Chrome 실행 상태에 따라 표시 시점이 달라질 수 있습니다.
```

## English listing copy

### Summary

Use this text as the item summary. It is under the 132-character limit.

```text
Calculate special times from your favorite's birthday and receive early and on-time notifications with posting links.
```

### Detailed description

```text
Bias Time Timer is a Chrome extension that calculates two special times each day from your favorite's birthday and reminds you when they arrive.

Add a name, nickname, birthday, and profile photo to see a live countdown to the next favorite time. Choose an early reminder from 1 to 30 minutes and use on-time notifications so you do not miss the moment.

Key features

• Two favorite times calculated automatically from a birthday
• Live countdown to the next favorite time
• Per-favorite early reminders from 1 to 30 minutes
• Separate controls for early and on-time notifications
• System notifications with nicknames and profile photos
• A highlighted current-time card during the exact minute
• Posting buttons that open user-saved links
• Multiple favorites with drag-and-drop ordering
• Favorite data and notification settings shared through Chrome Sync
• Square profile photo cropping and preview
• Automatic draft saving while adding a favorite
• JSON backup and restore for favorite data and photos
• Notification diagnostics for permission and schedule checks
• Korean and English interfaces

Favorite data and notification settings can sync across Chrome browsers on the same account when Chrome Sync is enabled. Profile photos remain on each device and are not sent to a developer-operated server. Photos can be moved through backup and restore.

Notifications are available while Chrome is running or operating in the background. Delivery may vary depending on operating-system notification settings, focus modes, and Chrome's running state.
```

## 개인정보 보호 탭

### 단일 목적 설명

```text
사용자가 등록한 최애의 생일을 기반으로 특별한 시각을 계산하고, 해당 시각의 카운트다운과 Chrome 시스템 알림 및 사용자가 저장한 글쓰기 링크 이동 기능을 제공합니다.
```

### Single purpose description (English)

```text
Calculates special times from birthdays entered by the user and provides countdowns, Chrome system notifications, and access to user-saved posting links for those times.
```

### 권한 사용 사유

#### `storage`

```text
최애의 이름, 애칭, 그룹명, 생일, 글쓰기 링크와 알림 설정을 Chrome 동기화 저장소에 보관하고, 언어 설정, 작성 중인 임시 정보와 알림 클릭 대상은 로컬 저장소에 보관하기 위해 사용합니다. 프로필 사진은 확장 프로그램 전용 IndexedDB에 기기별로 저장하며 동기화하지 않습니다. 개발자 서버로는 전송하지 않습니다.
```

#### `alarms`

```text
사용자가 설정한 미리 알림과 정각 알림을 예약하고, Chrome 서비스 워커가 휴면 상태일 때도 예약 시각에 알림 처리를 시작하기 위해 사용합니다.
```

#### `notifications`

```text
최애시 미리 알림, 정각 알림 및 사용자가 직접 요청한 테스트 알림을 운영체제의 Chrome 알림으로 표시하기 위해 사용합니다.
```

### Permission justifications (English)

#### `storage`

```text
Stores favorite names, nicknames, group names, birthdays, posting links, and notification settings in Chrome sync storage. Language preferences, drafts, and temporary notification click targets remain in local storage. Profile photos remain per-device in the Extension's IndexedDB database and are not synchronized or sent to a developer-operated server.
```

#### `alarms`

```text
Schedules user-configured early and on-time reminders and starts notification handling at the scheduled time when the extension service worker is dormant.
```

#### `notifications`

```text
Displays early reminders, on-time favorite-time alerts, and test notifications explicitly requested by the user through Chrome's system notification interface.
```

### 원격 코드

다음 항목을 선택합니다.

```text
아니요, 원격 코드를 사용하지 않습니다.
No, I am not using remote code.
```

모든 JavaScript와 CSS는 업로드하는 확장 프로그램 패키지에 포함됩니다. 사용자가 저장한 URL을 새 탭이나 창으로 여는 기능은 해당 페이지의 코드를 확장 프로그램에서 실행하는 것이 아닙니다.

### 사용자 데이터 공개 가이드

대시보드 문구는 변경될 수 있으므로 제출 시 표시되는 항목을 기준으로 최종 확인합니다.

- 로컬에만 저장되는 데이터도 처리 사실을 공개합니다.
- 이름과 프로필 사진 또는 사용자 입력 폼에 해당하는 선택지가 있으면 해당 항목을 선택하는 것이 안전합니다.
- 사용자의 웹 방문 기록을 읽거나 수집하지 않으므로 `웹 기록(Web history)`은 선택하지 않습니다.
- 웹페이지 내용을 읽거나 변경하지 않으므로 `웹사이트 콘텐츠(Website content)`는 선택하지 않습니다.
- 클릭, 키 입력 또는 사용 통계를 분석하거나 전송하지 않으므로 분석 목적의 `사용자 활동(User activity)`은 선택하지 않습니다.
- 위치, 금융·결제, 건강, 인증 정보, 개인 통신은 처리하지 않습니다.
- 데이터는 개발자 또는 제3자에게 판매·공유·전송되지 않습니다.
- 광고, 신용 평가 또는 대출 목적으로 사용하지 않습니다.
- 사람이 사용자 데이터를 읽지 않습니다.
- 공개한 단일 목적을 제공하는 데 필요한 범위로만 사용합니다.
- 제한적 사용(Limited Use) 인증 항목은 실제 동작과 일치하므로 모두 확인합니다.

개인정보처리방침 URL:

```text
https://github.com/hahbr88/bias_timer/blob/main/PRIVACY.md
```

## 배포 범위

첫 공개 테스트가 필요하면 `비공개(Unlisted)` 또는 `신뢰할 수 있는 테스터(Trusted testers)`로 먼저 검증한 뒤 공개 전환하는 방식을 권장합니다. 일반 사용자에게 바로 공개하려면 공개 범위를 선택하고 지원 국가 제한은 두지 않습니다.

## 그래픽 자료

### 필수

- 스토어 아이콘: 128×128 PNG
- 스크린샷: 1280×800 PNG 또는 JPEG, 최소 1장, 최대 5장
- 스크린샷은 모서리가 네모이고 여백 없이 전체 영역을 사용

### 권장 스크린샷 구성

1. `01-next-and-list.png`: 다음 최애시 카운트다운과 등록 목록
2. `02-current-favorite.png`: “지금은 OO시!!” 정시 강조 카드와 글쓰기 버튼
3. `03-registration.png`: 최애 등록, 생일, 미리 알림 슬라이더
4. `04-photo-crop.png`: 프로필 사진 자르기와 미리보기
5. `05-notification-diagnostics.png`: 알림 진단 및 테스트 알림 화면

실제 인물 사진을 스토어 이미지에 사용할 때는 사용 권리를 확인합니다. 권리 확인이 어려우면 직접 만든 예시 이미지, 저작권 문제가 없는 이미지 또는 사진 없는 테스트 데이터를 사용합니다.

### 선택

- 소형 프로모션 이미지: 440×280 PNG 또는 JPEG
- 마키 프로모션 이미지: 1400×560 PNG 또는 JPEG
- YouTube 소개 영상

## 지원 및 홈페이지

- 홈페이지 URL: `https://github.com/hahbr88/bias_timer`
- 지원 URL: `https://github.com/hahbr88/bias_timer/issues`
- 지원 이메일은 개발자 대시보드에 실제로 확인 가능한 주소를 등록

GitHub Issues를 지원 창구로 사용할 경우 저장소의 Issues 기능이 활성화되어 있고 외부 사용자가 새 이슈를 작성할 수 있는지 확인합니다.

## 업로드 전 체크리스트

- [ ] `package.json`과 `wxt.config.ts`의 버전이 동일함
- [ ] 공개할 버전 번호가 이전 업로드보다 높음
- [ ] `npm.cmd run typecheck` 통과
- [ ] `npm.cmd test` 통과
- [ ] `npm.cmd run build` 통과
- [ ] 새 Chrome 프로필에서 프로덕션 빌드 설치 확인
- [ ] 한국어와 영어 UI 확인
- [ ] 개인정보처리방침 GitHub URL을 로그아웃 상태에서 확인
- [ ] GitHub Issues가 공개되어 있는지 확인
- [ ] 스토어 설명과 실제 기능이 일치함
- [ ] 개인정보 보호 탭 답변과 `PRIVACY.md` 내용이 일치함
- [ ] 스크린샷에 개인 정보, 개발자 도구 또는 테스트용 민감 URL이 노출되지 않음
- [ ] 스크린샷에 사용 권리가 불명확한 인물 사진이 포함되지 않음
- [ ] 확장 프로그램 ZIP의 루트에 `manifest.json`이 있음

## 패키지 생성

```powershell
npm.cmd run zip
```

생성된 ZIP 파일의 압축을 열어 `manifest.json`이 최상위에 있는지 확인한 뒤 Chrome 웹 스토어 개발자 대시보드의 `새 항목 추가`에서 업로드합니다.
