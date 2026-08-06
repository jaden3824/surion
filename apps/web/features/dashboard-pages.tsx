"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowRight, BadgeCheck, Bell, BellRing, Bookmark, Boxes, Check, CheckCircle2, ChevronRight, CircleUserRound, ClipboardCheck, Clock, FileQuestion, Flag, FolderCog, Gauge, HeartHandshake, Inbox, LayoutDashboard, Lock, LogIn, Mail, MapPin, Merge, MessageCircle, PackageCheck, PenLine, Search, Settings, ShieldCheck, Store, UserCog, Users, Wrench,
} from "lucide-react";
import type { ExpertStatus } from "@surion/domain";
import { Button, CaseCard, EmptyState, RoleBadge, SectionHeading, StatusBadge } from "@/components/ui";
import { categories, experts } from "@/lib/demo-data";
import { useDemoStore } from "./demo-store";

type DashboardGroup = "my" | "expert" | "admin";

const navGroups = {
  my: [
    ["/my/questions", "내 질문", FileQuestion], ["/my/activity", "댓글과 활동", Activity], ["/saved", "저장한 글", Bookmark], ["/notifications", "알림 센터", Bell], ["/repair-requests", "수리 요청", Wrench], ["/settings/profile", "프로필 설정", Settings],
  ],
  expert: [
    ["/expert", "전문가 홈", LayoutDashboard], ["/expert/feed", "맞춤 질문 피드", Gauge], ["/expert/answers", "답변 중인 질문", MessageCircle], ["/expert/settings", "관심 분야·알림", BellRing], ["/expert/repair-requests", "수리 요청 관리", Inbox], ["/expert/profile", "전문가 프로필 편집", Store],
  ],
  admin: [
    ["/admin/users", "사용자 관리", Users], ["/admin/experts", "전문가 인증", BadgeCheck], ["/admin/reports", "신고 관리", Flag], ["/admin/catalog", "카탈로그 관리", FolderCog], ["/admin/models/review", "임시 모델 검토", ClipboardCheck], ["/admin/models/merge", "중복 모델 통합", Merge], ["/admin/repair-requests", "수리 요청 현황", HeartHandshake],
  ],
} as const;

const dashboardTitles: Record<string, [string, string]> = {
  "my/questions": ["내 질문", "내가 등록한 질문의 답변과 진행 상태를 확인하세요."],
  "my/activity": ["댓글과 활동", "참여한 공개 대화와 도움 반응을 모아보세요."],
  saved: ["저장한 글", "나중에 다시 볼 고장 사례입니다."],
  notifications: ["알림 센터", "질문 매칭, 댓글, 수리 요청 소식을 확인하세요."],
  "repair-requests": ["보낸 수리 요청", "요청 상태와 비공개 대화를 확인하세요."],
  "settings/profile": ["프로필 설정", "공개 프로필과 계정 정보를 관리하세요."],
  expert: ["전문가 홈", "공개 답변 활동과 새 매칭을 한눈에 확인하세요."],
  "expert/feed": ["맞춤 질문 피드", "설정한 분야와 브랜드를 기준으로 계산한 질문입니다."],
  "expert/answers": ["답변 중인 질문", "내 답변 이후 새 대화가 있는 질문을 확인하세요."],
  "expert/settings": ["관심 분야와 알림 설정", "원하는 질문만 받을 수 있도록 조건을 설정하세요."],
  "expert/repair-requests": ["수리 요청 관리", "내 답변을 보고 들어온 비공개 요청입니다."],
  "expert/profile": ["전문가 프로필 편집", "답변 포트폴리오에 표시할 정보를 관리하세요."],
  "admin/users": ["사용자 관리", "계정 상태와 역할을 조회합니다."],
  "admin/experts": ["전문가 인증 상태 관리", "심사 상태는 관리자만 변경할 수 있습니다."],
  "admin/reports": ["게시글과 댓글 신고 관리", "신고 사유와 콘텐츠를 함께 검토하세요."],
  "admin/catalog": ["카테고리·브랜드·모델 관리", "게시글에서 축적되는 제품 정보를 정리합니다."],
  "admin/models/review": ["임시 모델 검토", "사용자가 직접 입력한 모델을 검토합니다."],
  "admin/models/merge": ["중복 모델 통합", "별칭은 유지하고 중복 항목을 대표 모델로 합칩니다."],
  "admin/repair-requests": ["수리 요청 상태 확인", "비공개 내용은 열지 않고 운영 상태만 확인합니다."],
};

export function DashboardPage({ path }: { path: string[] }) {
  const route = path.join("/");
  const group: DashboardGroup = path[0] === "expert" ? "expert" : path[0] === "admin" ? "admin" : "my";
  const [title, description] = dashboardTitles[route] ?? dashboardTitles[group];
  return <div className={`dashboard dashboard-${group}`}><div className="container dashboard-layout"><aside className="dashboard-sidebar"><div className="dashboard-user"><span>{group === "admin" ? "관" : group === "expert" ? "김" : "민"}</span><div><strong>{group === "admin" ? "수리온 운영자" : group === "expert" ? "김수리" : "민준아빠"}</strong><small>{group === "admin" ? "관리자" : group === "expert" ? "사업자 인증 전문가" : "일반 사용자"}</small></div></div><nav aria-label={`${group} 메뉴`}>{navGroups[group].map(([href, label, Icon]) => <Link key={href} href={href} className={`/${route}` === href || (href === `/${group}` && route === group) ? "active" : ""}><Icon />{label}{href === "/notifications" && <i>3</i>}</Link>)}</nav>{group !== "my" && <Link className="switch-workspace" href={group === "expert" ? "/my/questions" : "/expert"}><CircleUserRound />일반 사용자 화면<ChevronRight /></Link>}</aside><main className="dashboard-main"><header className="dashboard-header"><span className="eyebrow">{group === "admin" ? "운영 데모" : group === "expert" ? "전문가 작업공간" : "마이 수리온"}</span><h1>{title}</h1><p>{description}</p></header><DashboardContent route={route} group={group} /></main></div></div>;
}

function DashboardContent({ route, group }: { route: string; group: DashboardGroup }) {
  const store = useDemoStore();
  const [expertStatuses, setExpertStatuses] = useState<Record<string, ExpertStatus>>(() => Object.fromEntries(experts.map((expert) => [expert.id, expert.status])));
  const [savedNotice, setSavedNotice] = useState(false);
  const myCases = store.cases.filter((item) => ["민준아빠", "재택근무중"].includes(item.author)).slice(0, 5);
  const notifications = [
    ["n1", "reply", "김수리 전문가가 답변을 남겼어요", "충전독 접점 높이와 전원 상태를 확인해 보세요.", "방금", "/cases/case-1"],
    ["n2", "match", "새 질문 4건이 관심 분야와 일치해요", "청소가전 · 로보락 · 충전 증상", "18분 전", "/expert/feed"],
    ["n3", "request", "새 수리 요청이 도착했어요", "맑은방님이 택배 수리를 요청했습니다.", "1시간 전", "/expert/repair-requests"],
    ["n4", "reply", "내 댓글에 답글이 달렸어요", "추가 사진을 올렸습니다. 확인 부탁드려요.", "어제", "/cases/case-1"],
  ];

  if (route === "my/questions") return <div className="dashboard-card-list">{myCases.map((item) => <CaseCard key={item.id} item={item} />)}<Link className="button button-primary inline-action" href="/ask"><PenLine />새 질문 작성하기</Link></div>;
  if (route === "my/activity") return <div className="activity-feed">{store.comments.slice(0, 6).map((comment) => <Link href={`/cases/${comment.caseId}`} key={comment.id}><span className="activity-icon"><MessageCircle /></span><div><strong>{comment.author === "민준아빠" ? "내가 의견을 남겼어요" : `${comment.author}님의 공개 의견`}</strong><p>{comment.body}</p><small>{comment.createdAt} · 도움돼요 {comment.helpfulCount}</small></div><ChevronRight /></Link>)}</div>;
  if (route === "saved") { const saved = store.cases.filter((item) => store.savedCaseIds.includes(item.id)); return saved.length ? <div className="search-list">{saved.map((item) => <CaseCard key={item.id} item={item} />)}</div> : <EmptyState icon={<Bookmark />} title="저장한 글이 없어요" description="사례의 저장 버튼을 누르면 여기에서 다시 볼 수 있어요." />; }
  if (route === "notifications") return <div className="notifications-list"><div className="notification-toolbar"><span>읽지 않은 알림 {notifications.filter(([id]) => !store.notificationsRead.includes(id)).length}개</span><button onClick={() => notifications.forEach(([id]) => store.markNotificationRead(id))}><Check />모두 읽음</button></div>{notifications.map(([id, type, title, copy, time, href]) => <Link href={href} key={id} className={store.notificationsRead.includes(id) ? "read" : ""} onClick={() => store.markNotificationRead(id)}><span className={`notification-icon notification-${type}`}>{type === "request" ? <Wrench /> : type === "match" ? <Search /> : <MessageCircle />}</span><div><strong>{title}</strong><p>{copy}</p><small>{time}</small></div>{!store.notificationsRead.includes(id) && <i />}</Link>)}</div>;
  if (route === "repair-requests") return <RepairRequestDashboard expertMode={false} />;
  if (route === "settings/profile") return <ProfileForm expertMode={false} onSaved={() => setSavedNotice(true)} savedNotice={savedNotice} />;
  if (route === "expert") return <ExpertHome />;
  if (route === "expert/feed") return <ExpertFeed />;
  if (route === "expert/answers") return <div className="search-list">{store.cases.filter((item) => ["case-1", "case-3", "case-11"].includes(item.id)).map((item) => <CaseCard key={item.id} item={item} />)}</div>;
  if (route === "expert/settings") return <ExpertSettings savedNotice={savedNotice} onSaved={() => setSavedNotice(true)} />;
  if (route === "expert/repair-requests") return <RepairRequestDashboard expertMode />;
  if (route === "expert/profile") return <ProfileForm expertMode onSaved={() => setSavedNotice(true)} savedNotice={savedNotice} />;
  if (route === "admin/users") return <AdminUsers />;
  if (route === "admin/experts") return <AdminExperts statuses={expertStatuses} setStatuses={setExpertStatuses} />;
  if (route === "admin/reports") return <AdminReports />;
  if (route === "admin/catalog") return <AdminCatalog />;
  if (route === "admin/models/review") return <AdminModelReview />;
  if (route === "admin/models/merge") return <AdminModelMerge />;
  if (route === "admin/repair-requests") return <RepairRequestDashboard adminMode expertMode />;
  return <EmptyState icon={<LayoutDashboard />} title={`${group} 화면`} description="이 화면은 준비 중입니다." />;
}

function ExpertHome() {
  const { cases, repairRequests } = useDemoStore();
  const matching = cases.filter((item) => ["청소가전", "생활가전"].includes(item.category) && item.status !== "RESOLVED");
  return <><div className="stat-grid"><div><span><MessageCircle /></span><strong>12</strong><small>이번 주 답변</small><em>지난주보다 +3</em></div><div><span><CheckCircle2 /></span><strong>8</strong><small>유효 답변</small><em>유효율 92%</em></div><div><span><HeartHandshake /></span><strong>5</strong><small>도움된 답변</small><em>총 142개</em></div><div><span><Inbox /></span><strong>{repairRequests.filter((request) => request.status === "PENDING").length}</strong><small>대기 중 요청</small><em>확인 필요</em></div></div><section className="dashboard-section"><SectionHeading title="새로 매칭된 질문" description="카테고리·브랜드·증상 조건을 기반으로 한 규칙 점수입니다." href="/expert/feed" /><div className="search-list">{matching.slice(0, 3).map((item) => <CaseCard key={item.id} item={item} compact />)}</div></section><section className="expert-todo"><strong>오늘의 활동 제안</strong><div><span><Clock /></span><p><strong>답변 후 추가 정보가 올라왔어요</strong>로보락 S8 MaxV Ultra 질문에서 사진을 확인해 주세요.</p><Link href="/cases/case-1">대화 보기<ArrowRight /></Link></div></section></>;
}

function ExpertFeed() {
  const { cases } = useDemoStore();
  const matches = cases.filter((item) => !["RESOLVED", "CLOSED_UNRESOLVED"].includes(item.status)).slice(0, 7);
  return <div className="match-feed"><div className="match-rule"><Gauge /><div><strong>명확한 규칙으로 매칭해요</strong><p>카테고리 30 + 브랜드 25 + 모델 20 + 증상 15 + 활동 상태 8 − 현재 작업량</p></div><Link href="/expert/settings">조건 설정</Link></div>{matches.map((item, index) => <article key={item.id}><div className="match-score"><strong>{94 - index * 4}</strong><span>매칭</span></div><div className="match-case"><div><span>{item.category}</span><StatusBadge status={item.status} /></div><Link href={`/cases/${item.id}`}>{item.title}</Link><p>{item.brand} · {item.model}</p><div className="match-reasons"><span><Check />카테고리 일치</span>{index < 4 && <span><Check />취급 브랜드</span>}{index < 2 && <span><Check />증상 일치</span>}</div></div><Link className="button button-secondary" href={`/cases/${item.id}#conversation`}>답변하기</Link></article>)}</div>;
}

function RepairRequestDashboard({ expertMode, adminMode = false }: { expertMode: boolean; adminMode?: boolean }) {
  const { repairRequests, cases, updateRepairRequest } = useDemoStore();
  return <div className="request-dashboard"><div className="request-tabs"><button className="active">전체 {repairRequests.length}</button><button>대기 {repairRequests.filter((request) => request.status === "PENDING").length}</button><button>진행 중 {repairRequests.filter((request) => request.status === "ACCEPTED").length}</button><button>종료</button></div>{repairRequests.map((request) => { const item = cases.find((entry) => entry.id === request.caseId); const expert = experts.find((entry) => entry.id === request.expertId); return <article key={request.id}><header><span className={`request-status request-${request.status.toLowerCase()}`}>{request.status}</span><small>{request.createdAt}</small></header><h3>{item?.title}</h3><div className="request-parties"><span>{expertMode ? "요청자" : "전문가"}</span><strong>{expertMode ? "민준아빠" : expert?.name}</strong>{!adminMode && <RoleBadge tone={expertMode ? "user" : "business"}>{expertMode ? "질문자" : "인증 전문가"}</RoleBadge>}</div><dl><div><dt>방식</dt><dd>{request.method}</dd></div><div><dt>희망 일정</dt><dd>{request.preferredDate}</dd></div>{!adminMode && <div><dt>전달 내용</dt><dd>{request.note}</dd></div>}</dl>{adminMode ? <p className="admin-private-note"><Lock />운영자는 비공개 대화·주소·전화번호를 열람하지 않습니다.</p> : <div className="request-actions">{expertMode && request.status === "PENDING" && <><Button variant="secondary" onClick={() => updateRepairRequest(request.id, "REJECTED")}>거절</Button><Button onClick={() => updateRepairRequest(request.id, "ACCEPTED")}>수락</Button></>}<Link className="button button-secondary" href={`/cases/${request.caseId}`}>원문 보기</Link>{request.status === "ACCEPTED" && <Button><MessageCircle />비공개 대화</Button>}</div>}</article>; })}</div>;
}

function ProfileForm({ expertMode, onSaved, savedNotice }: { expertMode: boolean; onSaved: () => void; savedNotice: boolean }) {
  return <form className="settings-form" onSubmit={(event) => { event.preventDefault(); onSaved(); }}><section><h2>{expertMode ? "전문가 기본 정보" : "공개 프로필"}</h2><div className="profile-edit-row"><span className="large-avatar">{expertMode ? "김" : "민"}</span><button type="button" className="button button-secondary">사진 변경</button></div><label>{expertMode ? "닉네임 또는 업체명" : "닉네임"}<input defaultValue={expertMode ? "김수리" : "민준아빠"} /></label><label>소개<textarea rows={4} defaultValue={expertMode ? "로봇청소기와 무선청소기를 12년째 수리합니다. 원인을 먼저 설명하고 꼭 필요한 수리만 제안합니다." : "고장 경험을 차근차근 기록하고 있어요."} /></label>{expertMode && <><div className="field-grid"><label>서비스 가능 지역<input defaultValue="서울, 경기" /></label><label>수리 방식<input defaultValue="택배, 방문" /></label></div><label>전문 브랜드<input defaultValue="로보락, 다이슨, LG전자" /></label></>}</section><section><h2>계정 정보</h2><label>이메일<input type="email" defaultValue="demo@surion.kr" /></label><label>알림 수신<select defaultValue="web"><option value="web">웹 알림</option><option value="email">이메일 + 웹 알림</option><option value="none">받지 않음</option></select></label></section><div className="settings-actions"><Button type="submit"><Check />변경사항 저장</Button>{savedNotice && <span><CheckCircle2 />저장됐어요.</span>}</div></form>;
}

function ExpertSettings({ onSaved, savedNotice }: { onSaved: () => void; savedNotice: boolean }) {
  const [selected, setSelected] = useState(["청소가전", "생활가전"]);
  return <form className="settings-form" onSubmit={(event) => { event.preventDefault(); onSaved(); }}><section><h2>관심 카테고리</h2><p>선택한 분야의 새 질문이 맞춤 피드에 표시됩니다.</p><div className="setting-chips">{categories.map((category) => <label className={selected.includes(category.name) ? "selected" : ""} key={category.id}><input type="checkbox" checked={selected.includes(category.name)} onChange={() => setSelected((current) => current.includes(category.name) ? current.filter((name) => name !== category.name) : [...current, category.name])} />{category.name}</label>)}</div></section><section><h2>세부 매칭 조건</h2><label>취급 브랜드<input defaultValue="로보락, 다이슨, LG전자" /></label><label>자신 있는 모델<input defaultValue="S8 MaxV Ultra, V12 Detect Slim, 코드제로 A9S" /></label><label>증상 유형<input defaultValue="충전, 전원, 흡입력, 필터" /></label><div className="field-grid"><label>하루 최대 신규 질문 수<input type="number" defaultValue="12" /></label><label>활동 가능 시간<select defaultValue="weekday"><option value="weekday">평일 09:00–20:00</option><option value="always">항상</option><option value="weekend">주말 중심</option></select></label></div><div className="toggle-list"><label><span><strong>택배 수리 가능</strong><small>전국 사용자의 질문과 매칭</small></span><input type="checkbox" defaultChecked /></label><label><span><strong>새 질문 웹 알림</strong><small>점수 70점 이상 질문</small></span><input type="checkbox" defaultChecked /></label><label><span><strong>내 답변에 달린 댓글</strong><small>추가 정보와 질문자 답변</small></span><input type="checkbox" defaultChecked /></label></div></section><div className="settings-actions"><Button type="submit"><Check />설정 저장</Button>{savedNotice && <span><CheckCircle2 />저장됐어요.</span>}</div></form>;
}

function AdminUsers() {
  const users = ["민준아빠", "보름달", "재택근무중", "라떼좋아", "하늘소금", "수리온 운영자"];
  return <div className="admin-table-wrap"><div className="admin-toolbar"><label><Search /><input placeholder="닉네임 또는 이메일 검색" /></label><select><option>전체 상태</option><option>활동 중</option><option>정지</option></select></div><table className="admin-table"><thead><tr><th>사용자</th><th>역할</th><th>질문</th><th>댓글</th><th>가입일</th><th>상태</th></tr></thead><tbody>{users.map((name, index) => <tr key={name}><td><strong>{name}</strong><small>user{index + 1}@example.com</small></td><td><RoleBadge tone={index === 5 ? "admin" : "user"}>{index === 5 ? "관리자" : "일반 사용자"}</RoleBadge></td><td>{index * 3 + 1}</td><td>{index * 7 + 2}</td><td>2026.0{(index % 7) + 1}.12</td><td><span className="active-account">활동 중</span></td></tr>)}</tbody></table></div>;
}

function AdminExperts({ statuses, setStatuses }: { statuses: Record<string, ExpertStatus>; setStatuses: React.Dispatch<React.SetStateAction<Record<string, ExpertStatus>>> }) {
  return <div className="admin-table-wrap"><div className="admin-info"><ShieldCheck /><span><strong>서버 권한으로만 변경됩니다</strong><small>사용자가 자신의 인증 상태나 수리 가능 여부를 직접 올릴 수 없습니다.</small></span></div><table className="admin-table"><thead><tr><th>전문가</th><th>전문 분야</th><th>인증 상태</th><th>수리 가능</th><th>최근 활동</th></tr></thead><tbody>{experts.map((expert) => <tr key={expert.id}><td><strong>{expert.name}</strong><small>{expert.id}</small></td><td>{expert.categories.join(" · ")}</td><td><select value={statuses[expert.id]} onChange={(event) => setStatuses((current) => ({ ...current, [expert.id]: event.target.value as ExpertStatus }))}><option value="NONE">미신청</option><option value="PENDING">심사 중</option><option value="PERSONAL_VERIFIED">개인 전문가 인증</option><option value="BUSINESS_VERIFIED">사업자 전문가 인증</option><option value="REJECTED">반려</option><option value="SUSPENDED">정지</option></select></td><td><span className={expert.repairEnabled ? "enabled" : "disabled"}>{expert.repairEnabled ? "가능" : "중지"}</span></td><td>{expert.activeNow ? "오늘" : "3일 전"}</td></tr>)}</tbody></table></div>;
}

function AdminReports() {
  const [resolved, setResolved] = useState<string[]>([]);
  const reports = [["report-1", "광고성 댓글", "연락 주세요. 당일 수리 가능합니다.", "댓글 · case-5"], ["report-2", "위험한 수리 안내", "전원을 연결한 상태에서 단자를 확인하세요.", "댓글 · case-12"], ["report-3", "개인정보 노출", "본문 사진에 택배 송장이 포함됨", "게시글 · case-17"]];
  return <div className="report-list">{reports.map(([id, reason, body, target]) => <article className={resolved.includes(id) ? "resolved" : ""} key={id}><span className="report-icon"><Flag /></span><div><span className="eyebrow">{reason}</span><h3>{body}</h3><p>{target} · 신고 2건 · 오늘 11:20</p></div><div><Button variant="secondary">원문 보기</Button><Button onClick={() => setResolved((current) => [...current, id])}>{resolved.includes(id) ? <><Check />처리됨</> : "검토 완료"}</Button></div></article>)}</div>;
}

function AdminCatalog() {
  return <div className="catalog-grid"><article><span><Boxes /></span><strong>카테고리</strong><em>10</em><p>전자제품 전체 카테고리가 공개 화면에 표시됩니다.</p><button>정렬 관리<ChevronRight /></button></article><article><span><Store /></span><strong>브랜드</strong><em>16</em><p>게시글 입력과 관리자 검토를 통해 축적됩니다.</p><button>브랜드 관리<ChevronRight /></button></article><article><span><PackageCheck /></span><strong>정식 모델</strong><em>32</em><p>별칭과 대표 모델을 함께 관리합니다.</p><button>모델 관리<ChevronRight /></button></article><article><span><ClipboardCheck /></span><strong>검토 대기 모델</strong><em>4</em><p>사용자가 직접 입력한 임시 모델입니다.</p><Link href="/admin/models/review">검토하기<ChevronRight /></Link></article></div>;
}

function AdminModelReview() {
  const [reviewed, setReviewed] = useState<string[]>([]);
  const rows = [["tmp-1", "로보락", "S8 max v울트라", "S8 MaxV Ultra"], ["tmp-2", "캐논", "EOS R6 mark2", "EOS R6 Mark II"], ["tmp-3", "브랜드 미상", "인터폰 7인치", "신규 모델 검토"], ["tmp-4", "LG", "16ZD90Q-GX56K", "그램 16ZD90Q"]];
  return <div className="model-review-list">{rows.map(([id, brand, input, suggestion]) => <article key={id} className={reviewed.includes(id) ? "reviewed" : ""}><div><span className="eyebrow">사용자 직접 입력</span><h3>{brand} · {input}</h3><p>제안 대표 모델 <ArrowRight /> <strong>{suggestion}</strong></p></div><div><Button variant="secondary">새 모델로 등록</Button><Button onClick={() => setReviewed((current) => [...current, id])}>{reviewed.includes(id) ? <><Check />검토 완료</> : "기존 모델에 연결"}</Button></div></article>)}</div>;
}

function AdminModelMerge() {
  const [merged, setMerged] = useState(false);
  return <div className="merge-panel"><div className="merge-visual"><div><span>중복 후보</span><strong>LG gram 16ZD90Q</strong><small>사례 3건 · 별칭 1개</small></div><Merge /><div><span>대표 모델</span><strong>LG 그램 16ZD90Q</strong><small>사례 12건 · 검증됨</small></div></div><div className="merge-rules"><AlertTriangle /><span><strong>통합 전 확인</strong><small>게시글과 검색 링크는 대표 모델로 이동하며 기존 입력값은 별칭으로 보존됩니다. 자동 삭제되지 않습니다.</small></span></div><Button onClick={() => setMerged(true)} disabled={merged}>{merged ? <><Check />통합 예약됨</> : "대표 모델로 통합"}</Button></div>;
}

export function LoginPage({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const { setRole } = useDemoStore();
  const [signup, setSignup] = useState(mode === "signup");
  return <div className="auth-page"><div className="auth-brand"><span><Wrench /></span><h1>고장 경험이<br />누군가의 해결책이 됩니다.</h1><p>전문가와 사용자가 공개적으로 대화하고, 해결 결과를 함께 쌓아가는 수리 커뮤니티.</p><div><span><Check />질문과 답변은 검색 가능한 사례로</span><span><Check />답변 이력으로 전문가 신뢰 확인</span><span><Check />개인정보는 비공개 요청에서만</span></div></div><div className="auth-form-wrap"><form className="auth-form" onSubmit={(event) => { event.preventDefault(); setRole("questioner"); router.push("/my/questions"); }}><span className="eyebrow">수리온 시작하기</span><h2>{signup ? "회원가입" : "로그인"}</h2><p>{signup ? "하나의 계정으로 질문하고 전문가로도 활동할 수 있어요." : "질문과 수리 진행 상태를 이어서 확인하세요."}</p>{signup && <label>닉네임<input required placeholder="공개 프로필에 표시할 이름" /></label>}<label>이메일<input required type="email" defaultValue="demo@surion.kr" /></label><label>비밀번호<input required type="password" defaultValue="" /></label><Button type="submit"><LogIn />{signup ? "계정 만들기" : "로그인"}</Button><div className="auth-divider"><span>또는 데모 역할로 보기</span></div><div className="demo-logins"><button type="button" onClick={() => { setRole("expert"); router.push("/expert"); }}><BadgeCheck />전문가 데모</button><button type="button" onClick={() => { setRole("admin"); router.push("/admin/users"); }}><ShieldCheck />관리자 데모</button></div><p className="auth-switch">{signup ? "이미 계정이 있나요?" : "아직 계정이 없나요?"}<button type="button" onClick={() => setSignup(!signup)}>{signup ? "로그인" : "회원가입"}</button></p></form></div></div>;
}

export function StaticPage({ type }: { type: string }) {
  const data: Record<string, [string, string, string[]]> = {
    about: ["수리온 소개", "고장 경험을 공개 지식으로 바꿉니다.", ["제품 모델을 지정해 구체적으로 질문합니다.", "전문가와 일반 사용자가 같은 공간에서 의견을 나눕니다.", "답변을 확인한 질문자만 해당 전문가에게 수리를 요청합니다.", "실제 원인과 해결 결과가 다음 사용자를 위한 사례로 남습니다."]],
    safety: ["안전 가이드", "직접 확인은 안전한 범위까지만 해주세요.", ["점검 전 제품 전원과 플러그를 분리하세요.", "배터리 팽창, 타는 냄새, 연기, 물기에는 즉시 사용을 중단하세요.", "고전압·가스·냉매·회전날·리튬 배터리는 전문가에게 맡기세요.", "공개 사진에 주소, 전화번호, 송장, 얼굴이 없는지 확인하세요."]],
    terms: ["이용약관", "수리온 MVP 이용 원칙", ["공개 답변은 참고 정보이며 안전을 보장하는 전문 진단을 대체하지 않습니다.", "연락처만 남기는 광고성 답변과 위험한 수리 안내는 제한됩니다.", "실제 결제와 정산은 현재 제공하지 않습니다."]],
    privacy: ["개인정보처리방침", "공개 정보와 비공개 정보를 구분합니다.", ["질문과 댓글은 공개되며 검색 가능한 사례로 남습니다.", "주소, 전화번호, 요청 세부사항은 수리 요청 당사자만 볼 수 있습니다.", "공개 질문용 파일과 비공개 요청용 파일 저장소를 분리합니다."]],
  };
  const [title, subtitle, items] = data[type] ?? data.about;
  return <div className="static-page page-wrap"><div className="container narrow-container"><span className="eyebrow">수리온 원칙</span><h1>{title}</h1><p className="static-lead">{subtitle}</p><div className="static-list">{items.map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></div>)}</div><Link className="button button-primary" href="/">홈으로 돌아가기</Link></div></div>;
}
