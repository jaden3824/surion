import type { CaseComment, CaseSummary, Category, Expert, RepairRequest } from "@surion/domain";

export const categories: Category[] = [
  { id: "cleaning", name: "청소가전", icon: "Sparkles", description: "로봇청소기·무선청소기" },
  { id: "kitchen", name: "주방가전", icon: "CookingPot", description: "커피머신·식기세척기" },
  { id: "living", name: "생활가전", icon: "Wind", description: "세탁기·에어컨·공기청정기" },
  { id: "pc", name: "PC/주변기기", icon: "Monitor", description: "노트북·모니터·프린터" },
  { id: "mobile", name: "모바일/웨어러블", icon: "Smartphone", description: "스마트폰·태블릿·워치" },
  { id: "av", name: "영상/음향", icon: "Tv", description: "TV·스피커·이어폰" },
  { id: "camera", name: "카메라", icon: "Camera", description: "카메라·렌즈·짐벌" },
  { id: "game", name: "게임기", icon: "Gamepad2", description: "콘솔·컨트롤러" },
  { id: "tools", name: "공구/전동장비", icon: "Drill", description: "드릴·그라인더·배터리" },
  { id: "etc", name: "기타 전자제품", icon: "MoreHorizontal", description: "분류되지 않은 전자제품" },
];

export const brands = [
  "삼성전자", "LG전자", "다이슨", "로보락", "샤오미", "애플", "레노버", "ASUS", "소니", "캐논", "니콘", "닌텐도", "드롱기", "필립스", "보쉬", "마끼다",
];

export const models = [
  "로보락 S8 MaxV Ultra", "로보락 Q Revo", "다이슨 V12 Detect Slim", "다이슨 V15", "LG 그램 16ZD90Q", "LG 코드제로 A9S", "삼성 오디세이 G5", "삼성 비스포크 제트", "드롱기 EC685", "드롱기 마그니피카", "MacBook Air M2", "iPhone 15 Pro", "Galaxy S24", "Galaxy Watch6", "Lenovo ThinkPad X1", "ASUS ROG Zephyrus", "Sony WH-1000XM5", "Sony A7 IV", "Canon EOS R6", "Nikon Z6 II", "Nintendo Switch OLED", "DualSense", "Xiaomi Pad 6", "Xiaomi Air Purifier 4", "Philips Airfryer XXL", "Bosch GSB 18V-55", "Makita DDF484", "LG OLED C3", "Samsung QLED Q80", "LG Tromm FX24", "Samsung Bespoke Dishwasher", "Epson L3256",
];

export const experts: Expert[] = [
  {
    id: "expert-kim", name: "김수리", status: "BUSINESS_VERIFIED", intro: "로봇청소기와 무선청소기를 12년째 수리합니다. 원인을 먼저 설명하고 꼭 필요한 수리만 제안합니다.", categories: ["청소가전", "생활가전"], brands: ["로보락", "다이슨", "LG전자"], regions: ["서울", "경기"], methods: ["택배", "방문"], answers: 186, validAnswers: 174, helpfulAnswers: 142, confirmedSolutions: 67, repairRequests: 54, repairsCompleted: 49, responseTime: "평균 42분", repairEnabled: true, activeNow: true,
  },
  {
    id: "expert-park", name: "박기사의 전자연구소", status: "BUSINESS_VERIFIED", intro: "노트북·모니터 전원 및 화면 고장을 보드 단위로 점검합니다.", categories: ["PC/주변기기", "영상/음향"], brands: ["삼성전자", "LG전자", "레노버", "ASUS"], regions: ["전국"], methods: ["택배", "방문"], answers: 241, validAnswers: 226, helpfulAnswers: 190, confirmedSolutions: 88, repairRequests: 76, repairsCompleted: 70, responseTime: "평균 1시간", repairEnabled: true, activeNow: true,
  },
  {
    id: "expert-choi", name: "최바리스타", status: "PERSONAL_VERIFIED", intro: "가정용 커피머신의 누수, 스팀, 추출 불량을 주로 다룹니다.", categories: ["주방가전"], brands: ["드롱기", "필립스"], regions: ["부산", "경남"], methods: ["택배"], answers: 98, validAnswers: 91, helpfulAnswers: 77, confirmedSolutions: 41, repairRequests: 19, repairsCompleted: 17, responseTime: "평균 2시간", repairEnabled: true, activeNow: false,
  },
  {
    id: "expert-lee", name: "이동형 엔지니어", status: "BUSINESS_VERIFIED", intro: "스마트폰과 태블릿의 충전·배터리·침수 증상을 안전하게 안내합니다.", categories: ["모바일/웨어러블"], brands: ["삼성전자", "애플", "샤오미"], regions: ["대전", "세종"], methods: ["방문", "출장"], answers: 132, validAnswers: 125, helpfulAnswers: 101, confirmedSolutions: 56, repairRequests: 44, repairsCompleted: 39, responseTime: "평균 55분", repairEnabled: true, activeNow: true,
  },
  {
    id: "expert-han", name: "한컷 카메라수리", status: "PERSONAL_VERIFIED", intro: "미러리스 카메라와 렌즈의 셔터·AF·마운트 문제를 진단합니다.", categories: ["카메라"], brands: ["소니", "캐논", "니콘"], regions: ["전국"], methods: ["택배"], answers: 74, validAnswers: 69, helpfulAnswers: 58, confirmedSolutions: 29, repairRequests: 11, repairsCompleted: 10, responseTime: "평균 3시간", repairEnabled: false, activeNow: false,
  },
  {
    id: "expert-jung", name: "정공구", status: "PERSONAL_VERIFIED", intro: "전동공구 배터리와 모터, 스위치 계통을 점검합니다.", categories: ["공구/전동장비", "게임기"], brands: ["보쉬", "마끼다", "닌텐도"], regions: ["인천", "경기"], methods: ["택배", "방문"], answers: 63, validAnswers: 59, helpfulAnswers: 47, confirmedSolutions: 21, repairRequests: 18, repairsCompleted: 15, responseTime: "평균 1시간 30분", repairEnabled: true, activeNow: true,
  },
];

const caseRows = [
  ["case-1", "청소가전", "로보락", "S8 MaxV Ultra", "충전독에 올리면 표시등이 꺼집니다", "충전독에 들어간 뒤 5초 정도 지나면 표시등이 꺼지고 충전이 시작되지 않습니다.", "DIAGNOSING", "민준아빠", 1284, 8, 42, 31, "user_entered", "충전,충전독"],
  ["case-2", "청소가전", "다이슨", "V12 Detect Slim", "작동 중 갑자기 멈추고 필터 표시가 떠요", "필터를 세척하고 완전히 말렸는데도 10초 정도 작동 후 멈춥니다.", "OPEN", "보름달", 842, 3, 17, 12, "confirmed", "전원,필터"],
  ["case-3", "PC/주변기기", "LG전자", "그램 16ZD90Q", "화면이 간헐적으로 깜빡입니다", "각도를 바꿀 때 화면이 검게 변했다 돌아옵니다. 외부 모니터는 정상입니다.", "RESOLVED", "재택근무중", 2190, 11, 65, 49, "confirmed", "화면,케이블"],
  ["case-4", "주방가전", "드롱기", "EC685", "커피머신 아래쪽에서 물이 새는 것 같습니다", "추출할 때만 본체 아래로 물이 고입니다. 물통은 정상입니다.", "DIAGNOSING", "라떼좋아", 655, 6, 23, 17, "confirmed", "누수,추출"],
  ["case-5", "PC/주변기기", "삼성전자", "오디세이 G5", "전원은 켜지는데 화면이 나오지 않습니다", "전원 LED는 들어오지만 입력 신호 없음도 표시되지 않고 검은 화면입니다.", "NEEDS_INFORMATION", "겜돌이92", 1108, 7, 34, 19, "confirmed", "전원,화면"],
  ["case-6", "모바일/웨어러블", "애플", "iPhone 15 Pro", "충전 케이블을 한쪽으로 눌러야 충전돼요", "여러 케이블을 바꿔도 동일하고 무선 충전은 정상입니다.", "RESOLVED", "하늘소금", 1760, 5, 38, 44, "confirmed", "충전,단자"],
  ["case-7", "영상/음향", "소니", "WH-1000XM5", "오른쪽에서 바람 소리 같은 잡음이 납니다", "노이즈 캔슬링을 켜면 오른쪽에서만 웅웅거리는 소리가 납니다.", "OPEN", "출근러", 729, 4, 20, 9, "confirmed", "잡음,노이즈캔슬링"],
  ["case-8", "카메라", "소니", "A7 IV", "셔터를 누르면 가끔 카메라 오류가 표시됩니다", "연사 촬영 후 오류가 잦고 전원을 다시 켜면 잠시 괜찮습니다.", "RESOLVED", "주말사진가", 988, 6, 31, 27, "confirmed", "셔터,오류"],
  ["case-9", "게임기", "닌텐도", "Switch OLED", "왼쪽 조이콘이 혼자 움직여요", "보정 후에도 캐릭터가 천천히 왼쪽으로 움직입니다.", "RESOLVED", "도토리", 3201, 14, 82, 71, "confirmed", "스틱,드리프트"],
  ["case-10", "공구/전동장비", "보쉬", "GSB 18V-55", "드릴이 돌다가 힘을 받으면 멈춥니다", "배터리를 완충해도 나사 체결 중 바로 멈추고 표시등이 깜빡입니다.", "OPEN", "셀프집수리", 466, 2, 11, 6, "confirmed", "모터,배터리"],
  ["case-11", "생활가전", "LG전자", "트롬 FX24", "탈수할 때 금속 긁는 소리가 납니다", "세탁량이 적어도 탈수 고속 구간에서 소음이 커집니다.", "IN_REPAIR", "은하수", 1477, 9, 45, 33, "confirmed", "소음,탈수"],
  ["case-12", "주방가전", "필립스", "Airfryer XXL", "예열 중 타는 냄새와 연기가 납니다", "기름때를 청소했는데 히터 쪽에서 옅은 연기가 계속 납니다.", "RESOLVED", "한끼뚝딱", 1366, 8, 52, 58, "confirmed", "안전,연기"],
  ["case-13", "모바일/웨어러블", "삼성전자", "Galaxy Watch6", "운동 중 화면이 자꾸 꺼지고 재부팅됩니다", "배터리 50% 이상인데 GPS 운동을 시작하면 재부팅됩니다.", "OPEN", "러닝초보", 397, 1, 8, 3, "confirmed", "재부팅,배터리"],
  ["case-14", "영상/음향", "LG전자", "OLED C3", "화면 아래에 가로줄이 생겼어요", "흰 배경에서 특히 잘 보이고 모든 입력에서 같은 위치에 나타납니다.", "CLOSED_UNRESOLVED", "무비나잇", 1880, 10, 56, 22, "confirmed", "패널,가로줄"],
  ["case-15", "PC/주변기기", "레노버", "ThinkPad X1", "USB-C 충전이 인식됐다 끊어집니다", "정품 어댑터와 다른 PD 충전기 모두 1분 간격으로 연결이 끊깁니다.", "RESOLVED", "문서왕", 925, 5, 29, 25, "confirmed", "USB-C,충전"],
  ["case-16", "카메라", "캐논", "모델명 확인 중", "중고 카메라인데 렌즈 인식이 안 됩니다", "모델명을 찾지 못했습니다. 렌즈를 장착하면 통신 오류가 나타납니다.", "NEEDS_INFORMATION", "필름감성", 211, 3, 5, 2, "unknown", "모델확인,렌즈"],
  ["case-17", "기타 전자제품", "브랜드 확인 중", "모델명 확인 중", "현관 인터폰 화면은 켜지는데 소리가 안 들려요", "입주 때부터 있던 제품이라 브랜드와 모델을 모르겠습니다. 명판 사진을 올렸습니다.", "OPEN", "새집살이", 188, 2, 4, 1, "unknown", "모델확인,음향"],
  ["case-18", "게임기", "소니", "DualSense", "R2 트리거가 헐겁고 입력이 계속 잡힙니다", "떨어뜨린 뒤부터 R2가 원위치로 돌아오지 않습니다.", "RESOLVED", "플스생활", 1180, 7, 36, 32, "confirmed", "트리거,파손"],
  ["case-19", "생활가전", "샤오미", "Air Purifier 4", "센서 수치가 계속 001로 고정됩니다", "요리 직후에도 미세먼지 수치가 바뀌지 않습니다.", "REPAIR_REQUESTED", "맑은방", 541, 4, 13, 10, "confirmed", "센서,공기질"],
  ["case-20", "공구/전동장비", "마끼다", "DDF484", "배터리가 충전기에서 빨강·초록으로 번갈아 깜빡여요", "사용 후 뜨거운 상태에서 꽂은 뒤부터 식혀도 같은 증상입니다.", "RESOLVED", "목공취미", 774, 6, 21, 29, "confirmed", "배터리,충전"],
] as const;

export const initialCases: CaseSummary[] = caseRows.map((row, index) => ({
  id: row[0], category: row[1], brand: row[2], model: row[3], title: row[4], symptom: row[5], status: row[6], author: row[7], views: row[8], comments: row[9], saves: row[10], helpful: row[11], modelIdentificationStatus: row[12], tags: row[13].split(","), createdAt: `${index < 8 ? "오늘" : index < 14 ? "어제" : "3일 전"} ${String(9 + (index % 9)).padStart(2, "0")}:${index % 2 ? "40" : "15"}`, solvedBy: row[6] === "RESOLVED" ? experts[index % experts.length].name : undefined,
}));

export const initialComments: CaseComment[] = [
  { id: "c1", caseId: "case-1", authorId: "expert-user-kim", author: "김수리", role: "BUSINESS_EXPERT", expertId: "expert-kim", type: "EXPERT_OPINION", body: "표시등이 바로 꺼진다면 충전 접점 오염과 도크 어댑터 전압 저하를 먼저 나눠 봐야 합니다. 전원 플러그를 뽑은 뒤 본체와 도크의 금속 접점을 마른 천으로 닦고 다시 올려 보세요. 젖은 천이나 금속 도구는 사용하지 마세요.", createdAt: "오늘 10:02", validExpertAnswer: true, helpfulCount: 24 },
  { id: "c2", caseId: "case-1", authorId: "user-demo", author: "민준아빠", role: "QUESTIONER", type: "GENERAL", body: "접점을 닦아도 같았습니다. 도크에서 본체를 살짝 들어 올리면 표시등이 다시 들어옵니다.", createdAt: "오늘 10:21", replyToCommentId: "c1", replyToLabel: "김수리 전문가의 의견", helpfulCount: 2 },
  { id: "c3", caseId: "case-1", authorId: "expert-user-park", author: "박기사의 전자연구소", role: "BUSINESS_EXPERT", expertId: "expert-park", type: "EXPERT_OPINION", body: "들어 올릴 때 반응한다면 어댑터보다 도크의 스프링 접점 높이 차이 가능성이 더 커 보입니다. 좌우 접점이 같은 높이로 부드럽게 올라오는지 전원을 분리한 상태에서 눈으로만 확인해 주세요.", createdAt: "오늘 10:48", validExpertAnswer: true, helpfulCount: 19 },
  { id: "c4", caseId: "case-1", authorId: "user-3", author: "로봇이좋아", role: "USER", type: "USER_EXPERIENCE", body: "같은 모델에서 도크 아래 전원 케이블이 끝까지 안 들어가 비슷한 증상이 있었습니다. 한 번 뺐다가 딸깍 들어가게 연결하고 해결됐어요.", createdAt: "오늘 11:04", helpfulCount: 8 },
  { id: "c5", caseId: "case-1", authorId: "expert-user-kim", author: "김수리", role: "BUSINESS_EXPERT", expertId: "expert-kim", type: "REQUEST_INFORMATION", body: "추가로 본체 앱의 배터리 잔량이 오르는지, 도크 좌우 접점 높이가 다른지 사진을 부탁드립니다. 사진만으로 접점부 점검 필요 여부를 더 좁힐 수 있습니다.", createdAt: "오늘 11:18", replyToCommentId: "c2", replyToLabel: "질문자의 추가 정보", validExpertAnswer: true, helpfulCount: 11 },
  { id: "c6", caseId: "case-1", authorId: "expert-user-jung", author: "정공구", role: "EXPERT", expertId: "expert-jung", type: "SAFETY_WARNING", body: "도크는 AC 전원을 사용하므로 분해하거나 접점에 드라이버를 대지 마세요. 외관 확인과 마른 천 청소까지만 권합니다.", createdAt: "오늘 11:33", validExpertAnswer: true, helpfulCount: 16 },
  { id: "c7", caseId: "case-3", authorId: "expert-user-park", author: "박기사의 전자연구소", role: "BUSINESS_EXPERT", expertId: "expert-park", type: "EXPERT_OPINION", body: "외부 모니터가 정상이고 힌지 각도에 따라 바뀐다면 LCD 케이블 접촉 문제 가능성이 높습니다.", createdAt: "7월 28일", validExpertAnswer: true, helpfulCount: 38 },
  { id: "c8", caseId: "case-3", authorId: "user-2", author: "재택근무중", role: "QUESTIONER", type: "RESOLUTION_UPDATE", body: "서비스센터에서 디스플레이 케이블을 교체했고 이후 일주일간 정상입니다.", createdAt: "8월 2일", helpfulCount: 21 },
];

export const initialRepairRequests: RepairRequest[] = [
  { id: "request-1", caseId: "case-19", expertId: "expert-kim", requesterId: "user-demo", method: "택배", preferredDate: "2026-08-10", note: "센서 청소 후에도 동일합니다.", status: "PENDING", createdAt: "오늘 09:30" },
  { id: "request-2", caseId: "case-11", expertId: "expert-park", requesterId: "user-4", method: "방문", preferredDate: "2026-08-08", note: "주말 방문을 희망합니다.", status: "ACCEPTED", createdAt: "어제 14:20" },
  { id: "request-3", caseId: "case-4", expertId: "expert-choi", requesterId: "user-5", method: "택배", preferredDate: "2026-08-12", note: "포장 방법 안내 부탁드립니다.", status: "REJECTED", createdAt: "3일 전" },
];

export const statusLabel: Record<CaseSummary["status"], string> = {
  OPEN: "답변 대기",
  NEEDS_INFORMATION: "추가 정보 필요",
  DIAGNOSING: "원인 확인 중",
  REPAIR_REQUESTED: "수리 요청됨",
  IN_REPAIR: "수리 진행 중",
  RESOLVED: "해결 완료",
  CLOSED_UNRESOLVED: "미해결 종료",
};

export const commentTypeLabel: Record<CaseComment["type"], string> = {
  GENERAL: "일반 의견",
  EXPERT_OPINION: "전문가 의견",
  REQUEST_INFORMATION: "추가 확인 필요",
  USER_EXPERIENCE: "경험 공유",
  RESOLUTION_UPDATE: "해결 업데이트",
  SAFETY_WARNING: "안전 주의",
};

export const roleLabel: Record<CaseComment["role"], string> = {
  QUESTIONER: "질문자",
  EXPERT: "개인 전문가",
  BUSINESS_EXPERT: "사업자 인증 전문가",
  USER: "일반 사용자",
  ADMIN: "관리자",
};
