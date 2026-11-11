# 최애시 타이머 개인정보처리방침

시행일: 2026년 11월 11일

최애시 타이머(이하 “확장 프로그램”)는 사용자의 개인정보를 외부 서버로 수집하거나 전송하지 않습니다. 확장 프로그램이 처리하는 정보는 아래에 설명된 기능을 제공하기 위해 사용자의 Chrome 프로필 안에서만 저장되고 처리됩니다.

## 1. 처리하는 정보

사용자가 직접 입력하거나 선택한 다음 정보를 처리합니다.

- 최애의 이름, 애칭·별명, 그룹명 및 생일의 월·일
- 사용자가 등록한 글쓰기 웹 주소(URL)
- 사용자가 선택하고 편집한 프로필 사진
- 알림 사용 여부, 미리 알림 시간 및 언어 설정
- 작성 중인 최애 등록 정보
- 최애 목록의 표시 순서

확장 프로그램은 계정 정보, 비밀번호, 결제 정보, 정확한 위치, 방문 기록 또는 사용자가 보고 있는 웹페이지의 내용을 수집하지 않습니다.

## 2. 정보의 이용 목적

처리하는 정보는 다음 목적으로만 사용됩니다.

- 생일을 기반으로 최애시 계산
- 다음 최애시와 남은 시간 표시
- 미리 알림 및 정각 알림 예약·표시
- 알림과 팝업에 이름, 애칭 및 프로필 사진 표시
- 알림 또는 글쓰기 버튼을 클릭했을 때 사용자가 등록한 URL 열기
- 작성 중인 등록 정보 임시 저장
- 사용자가 요청한 백업 파일 생성 및 복원

## 3. 저장 위치와 보관 기간

- 최애 정보와 알림 설정은 `chrome.storage.sync`에 저장됩니다. 사용자가 Chrome 동기화를 활성화한 경우 같은 Google 계정의 Chrome 환경으로 동기화될 수 있습니다.
- 언어 설정과 작성 중인 정보는 `chrome.storage.local`에 저장됩니다.
- 프로필 사진은 확장 프로그램 전용 IndexedDB에 저장됩니다.
- 알림 클릭 시 정확한 URL을 열기 위해 알림 식별자와 등록 URL을 `chrome.storage.local`에 임시 저장합니다. 이 정보는 링크를 정상적으로 연 뒤 삭제되며, 열지 않은 경우에도 최대 7일 또는 최근 50개까지만 보관됩니다.
- 알림 예약 정보는 Chrome의 `alarms` 기능으로 관리됩니다.
- 프로필 사진, 작성 중인 정보와 알림 클릭용 임시 URL은 동기화되지 않으며 해당 기기에만 저장됩니다. 다른 기기의 프로필 사진은 백업·복원 기능으로 직접 이전해야 합니다.
- 확장 프로그램은 자체 외부 서버나 데이터베이스를 운영하지 않습니다.

정보는 사용자가 해당 항목을 삭제하거나 확장 프로그램을 제거할 때까지 로컬에 남을 수 있습니다. Chrome 또는 운영체제의 동작에 따라 확장 프로그램 제거 시 로컬 데이터가 삭제될 수 있으므로, 필요한 경우 제거 전에 백업 기능을 이용해야 합니다.

## 4. 외부 전송 및 제3자 제공

확장 프로그램은 저장된 정보를 개발자나 제3자에게 전송, 판매, 대여 또는 공유하지 않습니다. 분석 도구, 광고 SDK, 추적 도구를 사용하지 않습니다.

사용자가 글쓰기 링크나 알림을 클릭하면 사용자가 직접 등록한 URL이 새 Chrome 탭 또는 창에서 열립니다. 이때 해당 웹사이트에는 일반적인 브라우저 접속 정보가 전달될 수 있으며, 이후의 정보 처리는 해당 웹사이트의 개인정보처리방침을 따릅니다.

## 5. 백업 파일

사용자가 백업 기능을 실행하면 최애 정보, 설정 및 프로필 사진이 포함된 JSON 파일이 사용자의 기기에 생성됩니다. 백업 파일은 외부 서버로 업로드되지 않습니다. 파일의 보관, 이동, 공유 및 삭제에 대한 책임은 사용자에게 있습니다.

## 6. 사용 권한

확장 프로그램은 다음 Chrome 권한을 사용합니다.

- `storage`: 최애 정보, 설정, 임시 작성 내용과 알림 클릭 대상을 로컬에 저장하기 위해 사용합니다.
- `alarms`: 미리 알림과 정각 알림을 예약하고 유지하기 위해 사용합니다.
- `notifications`: 최애시 시스템 알림과 사용자가 요청한 테스트 알림을 표시하기 위해 사용합니다.

확장 프로그램은 모든 웹사이트의 내용을 읽거나 변경할 수 있는 호스트 권한을 요청하지 않습니다.

## 7. 사용자의 선택과 데이터 삭제

사용자는 확장 프로그램에서 개별 최애를 삭제할 수 있습니다. 전체 데이터를 삭제하려면 Chrome에서 확장 프로그램을 제거하거나 해당 확장 프로그램의 사이트 데이터를 삭제할 수 있습니다.

데이터를 보관하려면 삭제 또는 제거 전에 백업 기능으로 JSON 파일을 저장할 수 있습니다.

## 8. 보안

확장 프로그램은 정보를 Chrome 프로필의 확장 프로그램 전용 저장 영역에 보관합니다. 다만 사용자의 기기나 Chrome 프로필에 접근할 수 있는 사람이 로컬 정보 또는 사용자가 생성한 백업 파일에 접근할 가능성은 있습니다. 공용 기기에서는 백업 파일과 Chrome 프로필을 안전하게 관리해야 합니다.

## 9. 개인정보처리방침의 변경

기능 또는 정보 처리 방식이 변경되면 이 문서를 수정하고 시행일을 갱신합니다. 중요한 변경 사항은 저장소의 릴리스 안내 또는 확장 프로그램 배포 정보에 고지할 수 있습니다.

확장 프로그램이 Chrome 웹 스토어 사용자 데이터 정책의 적용을 받는 정보를 사용하는 경우, 해당 정보의 사용은 제한적 사용 요건을 포함한 [Chrome 웹 스토어 사용자 데이터 정책](https://developer.chrome.com/docs/webstore/program-policies/policies#protecting-user-privacy)을 준수합니다.

## 10. 문의

개인정보처리방침 또는 확장 프로그램에 관한 문의와 문제 제보는 다음 GitHub Issues에서 접수할 수 있습니다.

- https://github.com/hahbr88/bias_timer/issues

---

# Bias Time Timer Privacy Policy

Effective date: November 11, 2026

Bias Time Timer (the “Extension”) does not collect or transmit personal information to an external server. Information handled by the Extension is stored and processed only within the user's Chrome profile to provide the features described below.

## 1. Information processed

The Extension processes information that the user enters or selects:

- A favorite's name, nickname, group name, and birth month and day
- A user-provided posting URL
- A profile photo selected and edited by the user
- Notification preferences, reminder time, and language preference
- In-progress favorite registration data
- The display order of favorites

The Extension does not collect account credentials, passwords, payment information, precise location, browsing history, or the contents of webpages the user visits.

## 2. How information is used

Information is used only to:

- Calculate favorite times from a birthday
- Display the next favorite time and countdown
- Schedule and display early and on-time notifications
- Display names, nicknames, and profile photos in notifications and the popup
- Open a user-provided URL when a notification or posting button is clicked
- Temporarily save an in-progress registration
- Create and restore a backup at the user's request

## 3. Storage and retention

- Favorite data and notification settings are stored in `chrome.storage.sync`. When the user enables Chrome Sync, this data may synchronize across Chrome environments signed in to the same Google account.
- Language preferences and drafts are stored in `chrome.storage.local`.
- Profile photos are stored in the Extension's IndexedDB database.
- To reliably open the correct URL after a notification click, the Extension temporarily stores a notification identifier and its user-provided URL in `chrome.storage.local`. It is deleted after the link opens successfully and is otherwise retained for no longer than seven days or the most recent 50 entries.
- Notification schedules are managed through Chrome's `alarms` API.
- Profile photos, drafts, and temporary notification click URLs are not synchronized and remain on the device. Profile photos must be moved to another device manually through backup and restore.
- The Extension does not operate an external server or database.

Information may remain locally until the user deletes the relevant item or removes the Extension. Chrome or the operating system may delete local data when the Extension is removed. Users should create a backup before removal if they wish to retain their data.

## 4. External transmission and third parties

The Extension does not transmit, sell, rent, or share stored information with the developer or third parties. It does not use analytics, advertising SDKs, or tracking tools.

When the user clicks a posting link or notification, the user-provided URL opens in a Chrome tab or window. The destination website may receive ordinary browser connection information, and its own privacy policy governs any subsequent processing.

## 5. Backup files

When the user uses the backup feature, a JSON file containing favorite data, settings, and profile photos is created on the user's device. The file is not uploaded to an external server. The user is responsible for storing, moving, sharing, and deleting the backup file.

## 6. Permissions

The Extension uses these Chrome permissions:

- `storage`: Stores favorite data, settings, drafts, and temporary notification click targets locally.
- `alarms`: Schedules and maintains early and on-time notifications.
- `notifications`: Displays favorite-time notifications and user-requested test notifications.

The Extension does not request host permissions that allow it to read or change the contents of all websites.

## 7. User choices and deletion

Users can delete individual favorites inside the Extension. To delete all Extension data, users can remove the Extension from Chrome or clear its site data.

Users who want to retain their data can save a JSON backup before deletion or removal.

## 8. Security

Information is kept in extension-specific storage within the Chrome profile. However, anyone with access to the user's device or Chrome profile may be able to access local information or backup files created by the user. Users should secure their Chrome profile and backup files, especially on shared devices.

## 9. Changes to this policy

This document and its effective date will be updated when features or information-handling practices change. Material changes may also be announced in repository release notes or Extension distribution information.

The use of information received under the Chrome Web Store User Data Policy will comply with the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/policies#protecting-user-privacy), including its Limited Use requirements.

## 10. Contact

Questions, privacy inquiries, and issue reports can be submitted through GitHub Issues:

- https://github.com/hahbr88/bias_timer/issues
