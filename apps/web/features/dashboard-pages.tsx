"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity, AlertTriangle, ArrowRight, BadgeCheck, Bell, BellRing, Bookmark, Boxes, Check, CheckCircle2, ChevronRight, CircleUserRound, ClipboardCheck, Clock, Eye, EyeOff, FileQuestion, Flag, FolderCog, Gauge, HeartHandshake, ImagePlus, Inbox, LayoutDashboard, LoaderCircle, Lock, Merge, MessageCircle, PackageCheck, PenLine, Search, Settings, ShieldCheck, Store, Trash2, Users, Wrench,
} from "lucide-react";
import type { ExpertStatus } from "@surion/domain";
import { Avatar, Button, CaseCard, EmptyState, RoleBadge, SectionHeading, StatusBadge } from "@/components/ui";
import { BrandLogo } from "@/components/brand-logo";
import type { AuthViewer } from "@/lib/auth/types";
import { categories, experts } from "@/lib/demo-data";
import authStyles from "./auth-page.module.css";
import { useDemoStore } from "./demo-store";

type DashboardGroup = "my" | "expert" | "admin";

const navGroups = {
  my: [
    ["/my/questions", "내 글", FileQuestion], ["/my/activity", "댓글과 활동", Activity], ["/saved", "저장한 글", Bookmark], ["/notifications", "알림 센터", Bell], ["/repair-requests", "수리 요청", Wrench], ["/settings/profile", "프로필 설정", Settings],
  ],
  expert: [
    ["/expert", "전문가 홈", LayoutDashboard], ["/expert/feed", "맞춤 글 피드", Gauge], ["/expert/answers", "댓글 남긴 글", MessageCircle], ["/expert/settings", "관심 분야·알림", BellRing], ["/expert/repair-requests", "수리 요청 관리", Inbox], ["/expert/profile", "전문가 프로필 편집", Store],
  ],
  admin: [
    ["/admin/users", "사용자 관리", Users], ["/admin/experts", "전문가 인증", BadgeCheck], ["/admin/reports", "신고 관리", Flag], ["/admin/catalog", "카탈로그 관리", FolderCog], ["/admin/models/review", "임시 모델 검토", ClipboardCheck], ["/admin/models/merge", "중복 모델 통합", Merge], ["/admin/repair-requests", "수리 요청 현황", HeartHandshake],
  ],
} as const;

const dashboardTitles: Record<string, [string, string]> = {
  "my/questions": ["내 글", "내가 등록한 글의 댓글과 진행 상태를 확인하세요."],
  "my/activity": ["댓글과 활동", "참여한 공개 대화와 도움 반응을 모아보세요."],
  saved: ["저장한 글", "나중에 다시 볼 고장 사례입니다."],
  notifications: ["알림 센터", "새 댓글, 게시글 매칭, 수리 요청 소식을 확인하세요."],
  "repair-requests": ["보낸 수리 요청", "요청 상태와 비공개 대화를 확인하세요."],
  "settings/profile": ["프로필 설정", "공개 프로필과 계정 정보를 관리하세요."],
  expert: ["전문가 홈", "공개 댓글과 새 글 매칭을 한눈에 확인하세요."],
  "expert/feed": ["맞춤 글 피드", "설정한 분야와 브랜드를 기준으로 계산한 게시글입니다."],
  "expert/answers": ["댓글 남긴 글", "내 댓글 이후 새 대화가 있는 게시글을 확인하세요."],
  "expert/settings": ["관심 분야와 알림 설정", "원하는 게시글만 받을 수 있도록 조건을 설정하세요."],
  "expert/repair-requests": ["수리 요청 관리", "내 공개 활동을 보고 들어온 비공개 요청입니다."],
  "expert/profile": ["전문가 프로필 편집", "공개 프로필에 표시할 정보를 관리하세요."],
  "admin/users": ["사용자 관리", "계정 상태와 역할을 조회합니다."],
  "admin/experts": ["전문가 인증 상태 관리", "심사 상태는 관리자만 변경할 수 있습니다."],
  "admin/reports": ["게시글과 댓글 신고 관리", "신고 사유와 콘텐츠를 함께 검토하세요."],
  "admin/catalog": ["카테고리·브랜드·모델 관리", "게시글에서 축적되는 제품 정보를 정리합니다."],
  "admin/models/review": ["임시 모델 검토", "사용자가 직접 입력한 모델을 검토합니다."],
  "admin/models/merge": ["중복 모델 통합", "별칭은 유지하고 중복 항목을 대표 모델로 합칩니다."],
  "admin/repair-requests": ["수리 요청 상태 확인", "비공개 내용은 열지 않고 운영 상태만 확인합니다."],
};

export function DashboardPage({ path, viewer }: { path: string[]; viewer: AuthViewer | null }) {
  const route = path.join("/");
  const group: DashboardGroup = path[0] === "expert" ? "expert" : path[0] === "admin" ? "admin" : "my";
  const [title, description] = dashboardTitles[route] ?? dashboardTitles[group];
  const { profileAvatar } = useDemoStore();
  const profileName = group === "admin" ? "수리온 운영자" : group === "expert" ? "김수리" : viewer?.nickname ?? "민준아빠";
  const profilePhoto = group === "admin" ? undefined : group === "my" && viewer ? viewer.avatarUrl ?? undefined : profileAvatar === "" ? undefined : profileAvatar ?? (group === "expert" ? experts[0].avatarUrl : undefined);
  return <div className={`dashboard dashboard-${group}`}><div className="container dashboard-layout"><aside className="dashboard-sidebar"><div className="dashboard-user"><Avatar name={profileName} src={profilePhoto} size="md" /><div><strong>{profileName}</strong><small>{group === "admin" ? "관리자" : group === "expert" ? "사업자 인증 전문가" : "일반 사용자"}</small></div></div><nav aria-label={`${group} 메뉴`}>{navGroups[group].map(([href, label, Icon]) => <Link key={href} href={href} className={`/${route}` === href || (href === `/${group}` && route === group) ? "active" : ""}><Icon />{label}{href === "/notifications" && <i>3</i>}</Link>)}</nav>{group !== "my" && <Link className="switch-workspace" href={group === "expert" ? "/my/questions" : "/expert"}><CircleUserRound />일반 사용자 화면<ChevronRight /></Link>}</aside><main className="dashboard-main"><header className="dashboard-header"><span className="eyebrow">{group === "admin" ? "운영 데모" : group === "expert" ? "전문가 작업공간" : "마이 수리온"}</span><h1>{title}</h1><p>{description}</p></header><DashboardContent route={route} group={group} viewer={viewer} /></main></div></div>;
}

function DashboardContent({ route, group, viewer }: { route: string; group: DashboardGroup; viewer: AuthViewer | null }) {
  const store = useDemoStore();
  const [expertStatuses, setExpertStatuses] = useState<Record<string, ExpertStatus>>(() => Object.fromEntries(experts.map((expert) => [expert.id, expert.status])));
  const [savedNotice, setSavedNotice] = useState(false);
  const myCases = store.cases.filter((item) => viewer ? item.authorId === viewer.id : ["민준아빠", "재택근무중"].includes(item.author)).slice(0, 5);
  const myComments = viewer ? store.comments.filter((comment) => comment.authorId === viewer.id) : store.comments.slice(0, 6);
  const notifications = [
    ["n1", "reply", "김수리님이 댓글을 남겼어요", "충전독 접점 높이와 전원 상태를 확인해 보세요.", "방금", "/cases/case-1"],
    ["n2", "match", "새 질문 4건이 관심 분야와 일치해요", "청소가전 · 로보락 · 충전 증상", "18분 전", "/expert/feed"],
    ["n3", "request", "새 수리 요청이 도착했어요", "맑은방님이 택배 수리를 요청했습니다.", "1시간 전", "/expert/repair-requests"],
    ["n4", "reply", "내 댓글에 답글이 달렸어요", "추가 사진을 올렸습니다. 확인 부탁드려요.", "어제", "/cases/case-1"],
  ];

  if (route === "my/questions") return myCases.length ? <div className="dashboard-card-list">{myCases.map((item) => <CaseCard key={item.id} item={item} />)}<Link className="button button-primary inline-action" href="/ask"><PenLine />새 질문 작성하기</Link></div> : <EmptyState icon={<FileQuestion />} title="아직 작성한 글이 없어요" description="고장 질문이나 직접 해결한 경험을 첫 글로 남겨보세요." />;
  if (route === "my/activity") return myComments.length ? <div className="activity-feed">{myComments.map((comment) => <Link href={`/cases/${comment.caseId}`} key={comment.id}><span className="activity-icon"><MessageCircle /></span><div><strong>{viewer || comment.author === "민준아빠" ? "내가 댓글을 남겼어요" : `${comment.author}님의 공개 댓글`}</strong><p>{comment.body}</p><small>{comment.createdAt} · 도움돼요 {comment.helpfulCount}</small></div><ChevronRight /></Link>)}</div> : <EmptyState icon={<MessageCircle />} title="아직 남긴 댓글이 없어요" description="공개 글에서 경험과 해결 방법을 자유롭게 나눠보세요." />;
  if (route === "saved") { const saved = store.cases.filter((item) => store.savedCaseIds.includes(item.id)); return saved.length ? <div className="search-list">{saved.map((item) => <CaseCard key={item.id} item={item} />)}</div> : <EmptyState icon={<Bookmark />} title="저장한 글이 없어요" description="사례의 저장 버튼을 누르면 여기에서 다시 볼 수 있어요." />; }
  if (route === "notifications") return <div className="notifications-list"><div className="notification-toolbar"><span>읽지 않은 알림 {notifications.filter(([id]) => !store.notificationsRead.includes(id)).length}개</span><button onClick={() => notifications.forEach(([id]) => store.markNotificationRead(id))}><Check />모두 읽음</button></div>{notifications.map(([id, type, title, copy, time, href]) => <Link href={href} key={id} className={store.notificationsRead.includes(id) ? "read" : ""} onClick={() => store.markNotificationRead(id)}><span className={`notification-icon notification-${type}`}>{type === "request" ? <Wrench /> : type === "match" ? <Search /> : <MessageCircle />}</span><div><strong>{title}</strong><p>{copy}</p><small>{time}</small></div>{!store.notificationsRead.includes(id) && <i />}</Link>)}</div>;
  if (route === "repair-requests") return <RepairRequestDashboard expertMode={false} />;
  if (route === "settings/profile") return <ProfileForm expertMode={false} viewer={viewer} onSaved={() => setSavedNotice(true)} savedNotice={savedNotice} />;
  if (route === "expert") return <ExpertHome />;
  if (route === "expert/feed") return <ExpertFeed />;
  if (route === "expert/answers") return <div className="search-list">{store.cases.filter((item) => ["case-1", "case-3", "case-11"].includes(item.id)).map((item) => <CaseCard key={item.id} item={item} />)}</div>;
  if (route === "expert/settings") return <ExpertSettings savedNotice={savedNotice} onSaved={() => setSavedNotice(true)} />;
  if (route === "expert/repair-requests") return <RepairRequestDashboard expertMode />;
  if (route === "expert/profile") return <ProfileForm expertMode viewer={null} onSaved={() => setSavedNotice(true)} savedNotice={savedNotice} />;
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
  return <><div className="stat-grid"><div><span><MessageCircle /></span><strong>12</strong><small>이번 주 댓글</small><em>지난주보다 +3</em></div><div><span><CheckCircle2 /></span><strong>8</strong><small>정보가 충분한 댓글</small><em>작성률 92%</em></div><div><span><HeartHandshake /></span><strong>5</strong><small>도움된 댓글</small><em>총 142개</em></div><div><span><Inbox /></span><strong>{repairRequests.filter((request) => request.status === "PENDING").length}</strong><small>대기 중 요청</small><em>확인 필요</em></div></div><section className="dashboard-section"><SectionHeading title="새로 매칭된 글" description="카테고리·브랜드·증상 조건을 기반으로 한 규칙 점수입니다." href="/expert/feed" /><div className="search-list">{matching.slice(0, 3).map((item) => <CaseCard key={item.id} item={item} compact />)}</div></section><section className="expert-todo"><strong>확인하면 좋은 대화</strong><div><span><Clock /></span><p><strong>댓글 뒤에 추가 정보가 올라왔어요</strong>로보락 S8 MaxV Ultra 글에서 사진을 확인해 주세요.</p><Link href="/cases/case-1">대화 보기<ArrowRight /></Link></div></section></>;
}

function ExpertFeed() {
  const { cases } = useDemoStore();
  const matches = cases.filter((item) => !["RESOLVED", "CLOSED_UNRESOLVED"].includes(item.status)).slice(0, 7);
  return <div className="match-feed"><div className="match-rule"><Gauge /><div><strong>명확한 규칙으로 매칭해요</strong><p>카테고리 30 + 브랜드 25 + 모델 20 + 증상 15 + 수리 가능 여부 8 − 현재 작업량</p></div><Link href="/expert/settings">조건 설정</Link></div>{matches.map((item, index) => <article key={item.id}><div className="match-score"><strong>{94 - index * 4}</strong><span>매칭</span></div><div className="match-case"><div><span>{item.category}</span><StatusBadge status={item.status} /></div><Link href={`/cases/${item.id}`}>{item.title}</Link><p>{item.brand} · {item.model}</p><div className="match-reasons"><span><Check />카테고리 일치</span>{index < 4 && <span><Check />취급 브랜드</span>}{index < 2 && <span><Check />증상 일치</span>}</div></div><Link className="button button-secondary" href={`/cases/${item.id}#conversation`}>댓글 쓰기</Link></article>)}</div>;
}

function RepairRequestDashboard({ expertMode, adminMode = false }: { expertMode: boolean; adminMode?: boolean }) {
  const { repairRequests, cases, updateRepairRequest } = useDemoStore();
  return <div className="request-dashboard"><div className="request-tabs"><button className="active">전체 {repairRequests.length}</button><button>대기 {repairRequests.filter((request) => request.status === "PENDING").length}</button><button>진행 중 {repairRequests.filter((request) => request.status === "ACCEPTED").length}</button><button>종료</button></div>{repairRequests.map((request) => { const item = cases.find((entry) => entry.id === request.caseId); const expert = experts.find((entry) => entry.id === request.expertId); return <article key={request.id}><header><span className={`request-status request-${request.status.toLowerCase()}`}>{request.status}</span><small>{request.createdAt}</small></header><h3>{item?.title}</h3><div className="request-parties"><span>{expertMode ? "요청자" : "전문가"}</span><strong>{expertMode ? "민준아빠" : expert?.name}</strong>{!adminMode && <RoleBadge tone={expertMode ? "user" : "business"}>{expertMode ? "질문자" : "인증 전문가"}</RoleBadge>}</div><dl><div><dt>방식</dt><dd>{request.method}</dd></div><div><dt>희망 일정</dt><dd>{request.preferredDate}</dd></div>{!adminMode && <div><dt>전달 내용</dt><dd>{request.note}</dd></div>}</dl>{adminMode ? <p className="admin-private-note"><Lock />운영자는 비공개 대화·주소·전화번호를 열람하지 않습니다.</p> : <div className="request-actions">{expertMode && request.status === "PENDING" && <><Button variant="secondary" onClick={() => updateRepairRequest(request.id, "REJECTED")}>거절</Button><Button onClick={() => updateRepairRequest(request.id, "ACCEPTED")}>수락</Button></>}<Link className="button button-secondary" href={`/cases/${request.caseId}`}>원문 보기</Link>{request.status === "ACCEPTED" && <Button><MessageCircle />비공개 대화</Button>}</div>}</article>; })}</div>;
}

function ProfilePhotoPicker({ name, value, initialSrc, onChange }: { name: string; value: string | null; initialSrc?: string; onChange: (value: string) => void }) {
  const [error, setError] = useState("");
  const displayedPhoto = value === "" ? undefined : value ?? initialSrc;

  function choosePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!(["image/jpeg", "image/png", "image/webp"] as string[]).includes(file.type)) {
      setError("JPG, PNG, WEBP 이미지만 올릴 수 있어요.");
      event.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("프로필 사진은 2MB 이하로 선택해 주세요.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { onChange(String(reader.result)); setError(""); };
    reader.onerror = () => setError("사진을 불러오지 못했어요. 다른 파일을 선택해 주세요.");
    reader.readAsDataURL(file);
  }

  return <div className="profile-photo-picker"><Avatar name={name} src={displayedPhoto} size="xl" /><div className="profile-photo-actions"><div><label className="button button-secondary"><ImagePlus />사진 선택<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} /></label>{displayedPhoto && <button type="button" className="button button-ghost" onClick={() => { onChange(""); setError(""); }}><Trash2 />사진 삭제</button>}</div><p className="profile-photo-help">사진은 선택 사항이에요. 올리지 않으면 누구에게나 같은 기본 이미지가 표시됩니다. JPG·PNG·WEBP, 최대 2MB.</p>{error && <p className="profile-photo-error" role="alert">{error}</p>}</div></div>;
}

function AccountDeletion() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function deleteAccount(event: React.FormEvent) {
    event.preventDefault();
    if (!password || confirmation !== "탈퇴") return;
    setDeleting(true);
    setError("");
    try {
      await authRequest("/api/auth/account", { password }, "DELETE");
      router.replace("/");
      router.refresh();
    } catch (requestError) {
      if (requestError instanceof AuthRequestError && requestError.code === "INVALID_CURRENT_PASSWORD") {
        setError("현재 비밀번호를 확인해 주세요.");
      } else {
        setError("계정을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setDeleting(false);
    }
  }

  return <section className="account-danger-zone" aria-labelledby="account-deletion-title"><div><h2 id="account-deletion-title">회원 탈퇴</h2><p>계정, 공개 프로필과 프로필 사진이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.</p></div>{!expanded ? <Button type="button" variant="secondary" onClick={() => setExpanded(true)}>탈퇴 안내 확인</Button> : <form onSubmit={deleteAccount}><p>본인 확인을 위해 현재 비밀번호와 <strong>탈퇴</strong>를 입력해 주세요.</p><label htmlFor="delete-account-password">현재 비밀번호<input id="delete-account-password" type="password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} autoComplete="current-password" maxLength={128} required /></label><label htmlFor="delete-account-confirmation">확인 문구<input id="delete-account-confirmation" value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setError(""); }} autoComplete="off" placeholder="탈퇴" required /></label>{error && <p className="account-danger-error" role="alert">{error}</p>}<div className="account-danger-actions"><Button type="button" variant="secondary" onClick={() => { setExpanded(false); setPassword(""); setConfirmation(""); setError(""); }} disabled={deleting}>취소</Button><button className="button button-danger" type="submit" disabled={deleting || !password || confirmation !== "탈퇴"}>{deleting ? <><LoaderCircle className="spin" />탈퇴 처리 중</> : <><Trash2 />계정 영구 삭제</>}</button></div></form>}</section>;
}

function ProfileForm({ expertMode, viewer, onSaved, savedNotice }: { expertMode: boolean; viewer: AuthViewer | null; onSaved: () => void; savedNotice: boolean }) {
  const router = useRouter();
  const { profileAvatar, setProfileAvatar } = useDemoStore();
  const profileName = expertMode ? "김수리" : viewer?.nickname ?? "민준아빠";
  const [nickname, setNickname] = useState(profileName);
  const [bio, setBio] = useState(expertMode ? "로봇청소기와 무선청소기를 12년째 수리합니다. 원인을 먼저 설명하고 꼭 필요한 수리만 제안합니다." : viewer ? viewer.bio : "고장 경험을 차근차근 기록하고 있어요.");
  const [realAvatar, setRealAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!viewer || expertMode) {
      onSaved();
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      await authRequest("/api/auth/profile", {
        nickname,
        bio,
        avatarDataUrl: realAvatar?.startsWith("data:image/") ? realAvatar : undefined,
        removeAvatar: realAvatar === "",
      }, "PATCH");
      setRealAvatar(null);
      onSaved();
      router.refresh();
    } catch (requestError) {
      setSaveError(requestError instanceof Error ? requestError.message : "프로필을 저장하지 못했어요.");
    } finally {
      setSaving(false);
    }
  }

  const avatarValue = viewer && !expertMode ? realAvatar : profileAvatar;
  const changeAvatar = viewer && !expertMode ? setRealAvatar : setProfileAvatar;
  return <><form className="settings-form" onSubmit={saveProfile}><section><h2>{expertMode ? "전문가 기본 정보" : "공개 프로필"}</h2><ProfilePhotoPicker name={nickname} value={avatarValue} initialSrc={expertMode ? experts[0].avatarUrl : viewer?.avatarUrl ?? undefined} onChange={changeAvatar} /><label>{expertMode ? "닉네임 또는 업체명" : "닉네임"}<input value={nickname} onChange={(event) => setNickname(event.target.value)} minLength={2} maxLength={20} required /></label><label>소개<textarea rows={4} value={bio} onChange={(event) => setBio(event.target.value)} maxLength={500} placeholder="고장 경험이나 관심 제품을 간단히 소개해 주세요." /></label>{expertMode && <><div className="field-grid"><label>서비스 가능 지역<input defaultValue="서울, 경기" /></label><label>수리 방식<input defaultValue="택배, 방문" /></label></div><label>전문 브랜드<input defaultValue="로보락, 다이슨, LG전자" /></label></>}</section><section><h2>계정 정보</h2><label>이메일<input type="email" defaultValue={viewer?.email ?? "demo@surion.kr"} readOnly={Boolean(viewer)} /></label><label>알림 수신<select defaultValue="web"><option value="web">웹 알림</option><option value="email">이메일 + 웹 알림</option><option value="none">받지 않음</option></select></label></section><div className="settings-actions"><Button type="submit" disabled={saving}>{saving ? <><LoaderCircle className="spin" />저장 중</> : <><Check />변경사항 저장</>}</Button>{savedNotice && <span><CheckCircle2 />저장됐어요.</span>}{saveError && <span role="alert">{saveError}</span>}</div></form>{viewer && !expertMode && <AccountDeletion />}</>;
}

function ExpertSettings({ onSaved, savedNotice }: { onSaved: () => void; savedNotice: boolean }) {
  const [selected, setSelected] = useState(["청소가전", "생활가전"]);
  return <form className="settings-form" onSubmit={(event) => { event.preventDefault(); onSaved(); }}><section><h2>관심 게시판</h2><p>선택한 분야의 새 글이 맞춤 피드에 표시됩니다.</p><div className="setting-chips">{categories.map((category) => <label className={selected.includes(category.name) ? "selected" : ""} key={category.id}><input type="checkbox" checked={selected.includes(category.name)} onChange={() => setSelected((current) => current.includes(category.name) ? current.filter((name) => name !== category.name) : [...current, category.name])} />{category.name}</label>)}</div></section><section><h2>세부 매칭 조건</h2><label>취급 브랜드<input defaultValue="로보락, 다이슨, LG전자" /></label><label>자신 있는 모델<input defaultValue="S8 MaxV Ultra, V12 Detect Slim, 코드제로 A9S" /></label><label>증상 유형<input defaultValue="충전, 전원, 흡입력, 필터" /></label><div className="field-grid"><label>하루 최대 새 글 수<input type="number" defaultValue="12" /></label><label>응답 가능 시간<select defaultValue="weekday"><option value="weekday">평일 09:00–20:00</option><option value="always">언제든 가능</option><option value="weekend">주말 중심</option></select></label></div><div className="toggle-list"><label><span><strong>택배 수리 가능</strong><small>전국 사용자의 글과 매칭</small></span><input type="checkbox" defaultChecked /></label><label><span><strong>새 글 웹 알림</strong><small>점수 70점 이상 게시글</small></span><input type="checkbox" defaultChecked /></label><label><span><strong>내 댓글에 달린 답글</strong><small>추가 정보와 이어지는 대화</small></span><input type="checkbox" defaultChecked /></label></div></section><div className="settings-actions"><Button type="submit"><Check />설정 저장</Button>{savedNotice && <span><CheckCircle2 />저장됐어요.</span>}</div></form>;
}

function AdminUsers() {
  const users = ["민준아빠", "보름달", "재택근무중", "라떼좋아", "하늘소금", "수리온 운영자"];
  return <div className="admin-table-wrap"><div className="admin-toolbar"><label><Search /><input placeholder="닉네임 또는 이메일 검색" /></label><select><option>전체 계정 상태</option><option>정상</option><option>정지</option></select></div><table className="admin-table"><thead><tr><th>사용자</th><th>역할</th><th>게시글</th><th>댓글</th><th>가입일</th><th>계정 상태</th></tr></thead><tbody>{users.map((name, index) => <tr key={name}><td><strong>{name}</strong><small>user{index + 1}@example.com</small></td><td><RoleBadge tone={index === 5 ? "admin" : "user"}>{index === 5 ? "관리자" : "일반 사용자"}</RoleBadge></td><td>{index * 3 + 1}</td><td>{index * 7 + 2}</td><td>2026.0{(index % 7) + 1}.12</td><td><span className="active-account">정상</span></td></tr>)}</tbody></table></div>;
}

function AdminExperts({ statuses, setStatuses }: { statuses: Record<string, ExpertStatus>; setStatuses: React.Dispatch<React.SetStateAction<Record<string, ExpertStatus>>> }) {
  return <div className="admin-table-wrap"><div className="admin-info"><ShieldCheck /><span><strong>서버 권한으로만 변경됩니다</strong><small>사용자가 자신의 인증 상태나 수리 가능 여부를 직접 올릴 수 없습니다.</small></span></div><table className="admin-table"><thead><tr><th>전문가</th><th>전문 분야</th><th>인증 상태</th><th>수리 가능</th></tr></thead><tbody>{experts.map((expert) => <tr key={expert.id}><td><strong>{expert.name}</strong><small>{expert.id}</small></td><td>{expert.categories.join(" · ")}</td><td><select value={statuses[expert.id]} onChange={(event) => setStatuses((current) => ({ ...current, [expert.id]: event.target.value as ExpertStatus }))}><option value="NONE">미신청</option><option value="PENDING">심사 중</option><option value="PERSONAL_VERIFIED">개인 전문가 인증</option><option value="BUSINESS_VERIFIED">사업자 전문가 인증</option><option value="REJECTED">반려</option><option value="SUSPENDED">정지</option></select></td><td><span className={expert.repairEnabled ? "enabled" : "disabled"}>{expert.repairEnabled ? "가능" : "중지"}</span></td></tr>)}</tbody></table></div>;
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

type AuthStep = "credentials" | "profile";
type CredentialField = "email" | "password" | "passwordConfirm";
type CredentialErrors = Partial<Record<CredentialField, string>>;

type AuthResponse = {
  ok?: boolean;
  code?: string;
  isNewUser?: boolean;
  onboardingComplete?: boolean;
  redirectTo?: string;
  message?: string;
  warning?: string | null;
  error?: string | { message?: string };
};

class AuthRequestError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = "AuthRequestError";
  }
}

function safeLocalPath(candidate: string | null | undefined, fallback = "/my/questions") {
  if (!candidate?.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) return fallback;
  try {
    const base = new URL("https://surion.local");
    const parsed = new URL(candidate, base);
    return parsed.origin === base.origin ? `${parsed.pathname}${parsed.search}${parsed.hash}` : fallback;
  } catch {
    return fallback;
  }
}

function safeAuthNext() {
  if (typeof window === "undefined") return "/my/questions";
  return safeLocalPath(new URLSearchParams(window.location.search).get("next"));
}

async function authRequest(path: string, body: Record<string, unknown>, method: "POST" | "PATCH" | "DELETE" = "POST") {
  const response = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({})) as AuthResponse;
  if (!response.ok || payload.ok === false) {
    const serverMessage = typeof payload.error === "string" ? payload.error : payload.error?.message;
    throw new AuthRequestError(payload.message || serverMessage || "잠시 후 다시 시도해 주세요.", response.status, payload.code);
  }
  return payload;
}

function validateCredentials(mode: "login" | "signup", email: string, password: string, passwordConfirm: string) {
  const errors: CredentialErrors = {};
  const normalizedEmail = email.trim();
  if (!normalizedEmail) errors.email = "이메일을 입력해 주세요.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) errors.email = "이메일 형식을 확인해 주세요.";

  if (!password) errors.password = "비밀번호를 입력해 주세요.";
  else if (mode === "signup" && password.length < 12) errors.password = "비밀번호는 12자 이상 입력해 주세요.";
  else if (password.length > 128) errors.password = "비밀번호는 128자 이하로 입력해 주세요.";

  if (mode === "signup") {
    if (!passwordConfirm) errors.passwordConfirm = "비밀번호를 한 번 더 입력해 주세요.";
    else if (passwordConfirm !== password) errors.passwordConfirm = "비밀번호가 서로 다릅니다.";
  }
  return errors;
}

export function LoginPage({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const { setRole } = useDemoStore();
  const [step, setStep] = useState<AuthStep>("credentials");
  const [returnTo, setReturnTo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [credentialErrors, setCredentialErrors] = useState<CredentialErrors>({});
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [isOver14, setIsOver14] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [consentError, setConsentError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setHydrated(true);
    setReturnTo(safeAuthNext());
    const params = new URLSearchParams(window.location.search);
    setStep(params.get("step") === "profile" ? "profile" : "credentials");
    const callbackError = params.get("auth_error") || params.get("error");
    setError(callbackError === "not_configured"
      ? "현재 로그인 서비스를 사용할 수 없어요. 잠시 후 다시 시도해 주세요."
      : callbackError
        ? "로그인을 마치지 못했어요. 이메일과 비밀번호를 다시 확인해 주세요."
        : "");
    setCredentialErrors({});
    setPassword("");
    setPasswordConfirm("");
    setShowPassword(false);
    setShowPasswordConfirm(false);
  }, [mode]);

  function resetFeedback() {
    setError("");
  }

  function validateCredentialField(field: CredentialField) {
    const nextErrors = validateCredentials(mode, email, password, passwordConfirm);
    setCredentialErrors((current) => ({ ...current, [field]: nextErrors[field] }));
  }

  function changeCredential(field: CredentialField, value: string) {
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    if (field === "passwordConfirm") setPasswordConfirm(value);
    setCredentialErrors((current) => field === "password"
      ? { ...current, password: undefined, passwordConfirm: undefined }
      : { ...current, [field]: undefined });
    resetFeedback();
  }

  async function submitCredentials(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validateCredentials(mode, email, password, passwordConfirm);
    setCredentialErrors(nextErrors);
    const trimmedNickname = nickname.trim();
    const nicknameInvalid = mode === "signup" && (trimmedNickname.length < 2 || trimmedNickname.length > 20);
    const consentInvalid = mode === "signup" && (!isOver14 || !termsAccepted || !privacyAccepted);
    setNicknameError(nicknameInvalid ? "닉네임은 2~20자로 입력해 주세요." : "");
    setConsentError(consentInvalid ? "가입하려면 필수 항목에 모두 동의해 주세요." : "");
    resetFeedback();
    if (Object.keys(nextErrors).length > 0 || nicknameInvalid || consentInvalid) {
      window.requestAnimationFrame(() => {
        const firstInvalidId = nextErrors.email
          ? "auth-email"
          : nextErrors.password
            ? "auth-password"
            : nextErrors.passwordConfirm
              ? "auth-password-confirm"
              : nicknameInvalid
                ? "auth-nickname"
                : "auth-age";
        document.getElementById(firstInvalidId)?.focus();
      });
      return;
    }

    setLoading(true);
    try {
      const result = await authRequest(`/api/auth/${mode}`, {
        email: email.trim().toLowerCase(),
        password,
        ...(mode === "signup" ? {
          nickname: trimmedNickname,
          isOver14,
          termsAccepted,
          privacyAccepted,
        } : {}),
        next: safeAuthNext(),
      });
      if (result.onboardingComplete === false || result.redirectTo?.startsWith("/signup")) {
        const next = safeAuthNext();
        const profileUrl = safeLocalPath(result.redirectTo, `/signup?step=profile&next=${encodeURIComponent(next)}`);
        setStep("profile");
        router.replace(profileUrl);
        return;
      }
      setRole("questioner");
      router.push(safeLocalPath(result.redirectTo, safeAuthNext()));
      router.refresh();
    } catch (requestError) {
      if (requestError instanceof AuthRequestError && requestError.code === "ACCOUNT_SUSPENDED") {
        setError("이용이 제한된 계정입니다. 문의가 필요하면 운영자에게 알려 주세요.");
      } else if (requestError instanceof AuthRequestError && requestError.status >= 500) {
        setError("현재 로그인 서비스를 사용할 수 없어요. 잠시 후 다시 시도해 주세요.");
      } else {
        setError(mode === "login"
          ? "이메일 또는 비밀번호를 확인해 주세요."
          : "회원가입을 완료하지 못했어요. 입력 내용을 확인하거나 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function completeProfile(event: React.FormEvent) {
    event.preventDefault();
    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length < 2 || trimmedNickname.length > 20) {
      setNicknameError("닉네임은 2~20자로 입력해 주세요.");
    } else {
      setNicknameError("");
    }
    if (!isOver14 || !termsAccepted || !privacyAccepted) {
      setConsentError("가입하려면 필수 항목에 모두 동의해 주세요.");
    } else {
      setConsentError("");
    }
    resetFeedback();
    if (trimmedNickname.length < 2 || trimmedNickname.length > 20 || !isOver14 || !termsAccepted || !privacyAccepted) return;

    setLoading(true);
    try {
      const result = await authRequest("/api/auth/profile", {
        nickname: trimmedNickname,
        isOver14,
        termsAccepted,
        privacyAccepted,
        next: safeAuthNext(),
      });
      setRole("questioner");
      const destination = safeLocalPath(result.redirectTo, safeAuthNext());
      router.push(destination);
      router.refresh();
    } catch (requestError) {
      if (requestError instanceof AuthRequestError && requestError.code === "NICKNAME_TAKEN") {
        setNicknameError("이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해 주세요.");
        window.requestAnimationFrame(() => document.getElementById("auth-nickname")?.focus());
      } else if (requestError instanceof AuthRequestError && requestError.status >= 500) {
        setError("프로필을 저장할 수 없어요. 잠시 후 다시 시도해 주세요.");
      } else {
        setError(requestError instanceof Error ? requestError.message : "프로필을 만들지 못했어요.");
      }
    } finally {
      setLoading(false);
    }
  }

  const title = step === "profile" ? "수리온 프로필 만들기" : mode === "login" ? "다시 만나 반가워요" : "수리온에 가입하기";
  const description = step === "profile"
    ? "공개 활동에 사용할 닉네임과 필수 항목만 확인하면 끝나요."
    : returnTo.startsWith("/ask")
      ? `${mode === "login" ? "로그인" : "가입"} 후 작성 중이던 글 화면으로 바로 돌아갑니다.`
      : mode === "login"
        ? "가입한 이메일과 비밀번호로 로그인해 주세요."
        : "필수 정보만 한 번에 입력하고 수리 경험을 나눠보세요.";
  const showDemoTools = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const allConsentsAccepted = isOver14 && termsAccepted && privacyAccepted;
  const nextQuery = returnTo ? `?next=${encodeURIComponent(returnTo)}` : "";

  return (
    <div className="auth-page" data-entry={mode}>
      <div className="auth-form-wrap">
        <div className="auth-form">
          <div className="auth-logo"><BrandLogo /></div>
          {step === "credentials" && <nav className={authStyles.tabs} aria-label="로그인과 회원가입 선택">
            <Link href={`/login${nextQuery}`} aria-current={mode === "login" ? "page" : undefined}>로그인</Link>
            <Link href={`/signup${nextQuery}`} aria-current={mode === "signup" ? "page" : undefined}>회원가입</Link>
          </nav>}
          <span className="eyebrow">{step === "profile" ? "가입 마지막 단계" : mode === "login" ? "로그인" : "회원가입"}</span>
          <h2>{title}</h2>
          <p>{description}</p>

          {error && <div className="auth-message auth-error" role="alert">{error}</div>}

          {step === "credentials" && <>
            <form className={authStyles.credentialForm} onSubmit={submitCredentials} noValidate>
              <div className={authStyles.fieldGroup}>
                <label htmlFor="auth-email">이메일</label>
                <input id="auth-email" type="email" value={email} onChange={(event) => changeCredential("email", event.target.value)} onBlur={() => validateCredentialField("email")} autoComplete="email" inputMode="email" placeholder="example@email.com" disabled={!hydrated || loading} aria-invalid={Boolean(credentialErrors.email)} aria-describedby={credentialErrors.email ? "auth-email-error" : undefined} autoFocus />
                {credentialErrors.email && <p className={authStyles.fieldError} id="auth-email-error">{credentialErrors.email}</p>}
              </div>
              <div className={authStyles.fieldGroup}>
                <label htmlFor="auth-password">비밀번호</label>
                <div className={authStyles.passwordField}>
                  <input id="auth-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => changeCredential("password", event.target.value)} onBlur={() => validateCredentialField("password")} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder={mode === "signup" ? "12자 이상 입력해 주세요" : "비밀번호를 입력해 주세요"} disabled={!hydrated || loading} aria-invalid={Boolean(credentialErrors.password)} aria-describedby={credentialErrors.password ? "auth-password-error" : mode === "signup" ? "auth-password-help" : undefined} />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"} aria-pressed={showPassword} disabled={loading}>{showPassword ? <EyeOff /> : <Eye />}</button>
                </div>
                {mode === "signup" && !credentialErrors.password && <p className={authStyles.fieldHint} id="auth-password-help">12자 이상의 긴 문장을 권장해요. 다른 서비스와 겹치지 않게 만들어 주세요.</p>}
                {credentialErrors.password && <p className={authStyles.fieldError} id="auth-password-error">{credentialErrors.password}</p>}
              </div>
              {mode === "signup" && <div className={authStyles.fieldGroup}>
                <label htmlFor="auth-password-confirm">비밀번호 확인</label>
                <div className={authStyles.passwordField}>
                  <input id="auth-password-confirm" type={showPasswordConfirm ? "text" : "password"} value={passwordConfirm} onChange={(event) => changeCredential("passwordConfirm", event.target.value)} onBlur={() => validateCredentialField("passwordConfirm")} autoComplete="new-password" placeholder="비밀번호를 한 번 더 입력해 주세요" disabled={!hydrated || loading} aria-invalid={Boolean(credentialErrors.passwordConfirm)} aria-describedby={credentialErrors.passwordConfirm ? "auth-password-confirm-error" : undefined} />
                  <button type="button" onClick={() => setShowPasswordConfirm((current) => !current)} aria-label={showPasswordConfirm ? "비밀번호 확인 숨기기" : "비밀번호 확인 표시"} aria-pressed={showPasswordConfirm} disabled={loading}>{showPasswordConfirm ? <EyeOff /> : <Eye />}</button>
                </div>
                {credentialErrors.passwordConfirm && <p className={authStyles.fieldError} id="auth-password-confirm-error">{credentialErrors.passwordConfirm}</p>}
              </div>}
              {mode === "signup" && <>
                <div className={authStyles.fieldGroup}>
                  <label htmlFor="auth-nickname">닉네임</label>
                  <input id="auth-nickname" minLength={2} maxLength={20} value={nickname} onChange={(event) => { setNickname(event.target.value); setNicknameError(""); resetFeedback(); }} onBlur={() => setNicknameError(nickname.trim().length >= 2 && nickname.trim().length <= 20 ? "" : "닉네임은 2~20자로 입력해 주세요.")} autoComplete="nickname" placeholder="2~20자로 입력해 주세요" disabled={!hydrated || loading} aria-invalid={Boolean(nicknameError)} aria-describedby={nicknameError ? "auth-nickname-error" : "auth-nickname-help"} />
                  {nicknameError ? <p className={authStyles.fieldError} id="auth-nickname-error">{nicknameError}</p> : <p className={authStyles.fieldHint} id="auth-nickname-help">게시글과 댓글에 공개됩니다. 실명은 입력하지 않아도 돼요.</p>}
                </div>
                <fieldset className={authStyles.consentFieldset}>
                  <legend>필수 확인 및 동의</legend>
                  <div className="auth-consent-list">
                    <div className="auth-consent-row"><input id="auth-age" type="checkbox" checked={isOver14} onChange={(event) => { setIsOver14(event.target.checked); setConsentError(""); }} disabled={loading} /><label htmlFor="auth-age"><strong>[필수]</strong> 만 14세 이상입니다.</label></div>
                    <div className="auth-consent-row"><input id="auth-terms" type="checkbox" checked={termsAccepted} onChange={(event) => { setTermsAccepted(event.target.checked); setConsentError(""); }} disabled={loading} /><label htmlFor="auth-terms"><strong>[필수]</strong> 이용약관에 동의합니다.</label><Link href="/terms" target="_blank">보기</Link></div>
                    <div className="auth-consent-row"><input id="auth-privacy" type="checkbox" checked={privacyAccepted} onChange={(event) => { setPrivacyAccepted(event.target.checked); setConsentError(""); }} disabled={loading} /><label htmlFor="auth-privacy"><strong>[필수]</strong> 개인정보 수집·이용에 동의합니다.</label><Link href="/privacy" target="_blank">보기</Link></div>
                  </div>
                  {consentError && <p className={authStyles.consentError} role="alert">{consentError}</p>}
                </fieldset>
              </>}
              <Button className={authStyles.submitButton} type="submit" disabled={!hydrated || loading}>{loading && <LoaderCircle className="spin" />}{loading ? mode === "login" ? "로그인 중" : "가입 중" : mode === "login" ? "로그인" : "가입 완료"}</Button>
            </form>
            <p className={authStyles.accountPrompt}>{mode === "login" ? "아직 계정이 없나요?" : "이미 계정이 있나요?"}<Link href={`/${mode === "login" ? "signup" : "login"}${nextQuery}`}>{mode === "login" ? "회원가입" : "로그인"}</Link></p>
            <Link className="auth-browse-link" href="/community">비회원 둘러보기</Link>
          </>}

          {step === "profile" && <form className="auth-profile-form" onSubmit={completeProfile}>
            <label htmlFor="auth-nickname">닉네임</label>
            <input id="auth-nickname" minLength={2} maxLength={20} value={nickname} onChange={(event) => { setNickname(event.target.value); setNicknameError(""); resetFeedback(); }} onBlur={() => setNicknameError(nickname.trim().length >= 2 && nickname.trim().length <= 20 ? "" : "닉네임은 2~20자로 입력해 주세요.")} autoComplete="nickname" placeholder="2~20자로 입력해 주세요" aria-invalid={Boolean(nicknameError)} aria-describedby={nicknameError ? "auth-nickname-error" : "auth-nickname-help"} autoFocus />
            {nicknameError ? <p className={authStyles.fieldError} id="auth-nickname-error">{nicknameError}</p> : <p className="auth-field-help" id="auth-nickname-help">게시글과 댓글에 공개됩니다. 실명은 입력하지 않아도 돼요.</p>}
            <p className={authStyles.profilePhotoLater}>프로필 사진은 가입 후 설정에서 원할 때 추가할 수 있어요.</p>
            <div className="auth-consent-list" aria-label="필수 확인 및 약관 동의">
              <div className={`${authStyles.consentAll} auth-consent-row`}><input id="auth-all" type="checkbox" checked={allConsentsAccepted} onChange={(event) => { const checked = event.target.checked; setIsOver14(checked); setTermsAccepted(checked); setPrivacyAccepted(checked); setConsentError(""); }} /><label htmlFor="auth-all">필수 항목 모두 동의</label></div>
              <div className="auth-consent-row"><input id="auth-age" type="checkbox" checked={isOver14} onChange={(event) => { setIsOver14(event.target.checked); setConsentError(""); }} /><label htmlFor="auth-age"><strong>[필수]</strong> 만 14세 이상입니다.</label></div>
              <div className="auth-consent-row"><input id="auth-terms" type="checkbox" checked={termsAccepted} onChange={(event) => { setTermsAccepted(event.target.checked); setConsentError(""); }} /><label htmlFor="auth-terms"><strong>[필수]</strong> 이용약관에 동의합니다.</label><Link href="/terms" target="_blank">보기</Link></div>
              <div className="auth-consent-row"><input id="auth-privacy" type="checkbox" checked={privacyAccepted} onChange={(event) => { setPrivacyAccepted(event.target.checked); setConsentError(""); }} /><label htmlFor="auth-privacy"><strong>[필수]</strong> 개인정보 수집·이용에 동의합니다.</label><Link href="/privacy" target="_blank">보기</Link></div>
            </div>
            {consentError && <p className={authStyles.consentError} role="alert">{consentError}</p>}
            <Button type="submit" disabled={!hydrated || loading}>{loading && <LoaderCircle className="spin" />}{loading ? "프로필 저장 중" : "가입 완료"}</Button>
          </form>}

          {step === "credentials" && showDemoTools && <details className="auth-dev-tools"><summary>개발용 데모 화면</summary><div className="demo-logins"><button type="button" onClick={() => { setRole("questioner"); router.push("/my/questions"); }}><CircleUserRound />일반 사용자</button><button type="button" onClick={() => { setRole("expert"); router.push("/expert"); }}><BadgeCheck />전문가</button><button type="button" onClick={() => { setRole("admin"); router.push("/admin/users"); }}><ShieldCheck />관리자</button></div></details>}
        </div>
      </div>
    </div>
  );
}

export function StaticPage({ type }: { type: string }) {
  const data: Record<string, [string, string, string[]]> = {
    about: ["수리온 소개", "고장 경험을 공개 지식으로 바꿉니다.", ["제품 모델을 지정해 질문이나 해결 경험을 올립니다.", "모든 사용자가 같은 댓글 공간에서 자유롭게 대화합니다.", "필요한 경우 공개 활동을 확인한 뒤 전문가에게 수리를 요청합니다.", "여러 사람의 실제 원인과 해결 결과가 쌓이고, 나중에 모델·증상별로 연결됩니다."]],
    safety: ["안전 가이드", "직접 확인은 안전한 범위까지만 해주세요.", ["점검 전 제품 전원과 플러그를 분리하세요.", "배터리 팽창, 타는 냄새, 연기, 물기에는 즉시 사용을 중단하세요.", "고전압·가스·냉매·회전날·리튬 배터리는 전문가에게 맡기세요.", "공개 사진에 주소, 전화번호, 송장, 얼굴이 없는지 확인하세요."]],
    terms: ["이용약관", "수리온 공개 MVP 이용 원칙", ["계정은 본인이 관리할 수 있는 이메일로 만들고 다른 사람의 계정을 사용하지 않습니다.", "공개 댓글은 참고 정보이며 안전을 보장하는 전문 진단을 대체하지 않습니다.", "연락처만 남기는 광고성 댓글, 개인정보 노출, 위험한 수리 안내는 제한됩니다.", "회원은 설정에서 탈퇴할 수 있습니다. 공용 게시글 저장 기능을 열기 전 공개 글·댓글의 익명화와 보존 기준을 별도로 확정합니다.", "실제 결제와 정산은 현재 제공하지 않습니다."]],
    privacy: ["개인정보처리방침", "필요한 정보만 받고 공개 범위를 분명히 합니다.", ["필수 정보는 이메일, 공개 닉네임, 만 14세 이상 확인과 필수 동의 기록입니다. 비밀번호는 원문이 아니라 인증용 해시로 저장됩니다.", "로그인과 보안을 위해 세션 쿠키, 접속 IP와 브라우저 정보가 생성될 수 있습니다. 프로필 사진과 소개는 선택 사항입니다.", "계정 정보는 로그인·계정 관리·부정 이용 방지를 위해 회원 탈퇴 시까지 보관하고, 관계 법령상 의무가 있는 경우에만 정해진 기간 동안 별도로 보관합니다.", "닉네임, 선택한 사진·소개, 향후 작성할 게시글과 댓글은 공개될 수 있습니다. 이메일, 세션 정보와 현재 접속 상태는 다른 사용자에게 공개하지 않습니다.", "계정 데이터는 Vercel을 통해 연결한 Neon Postgres에, 선택 프로필 사진은 Vercel Blob에 저장합니다. 정식 운영 전 처리위탁·국외 이전 세부사항과 운영자 문의처를 법률 검토 후 고지합니다.", "전화번호·성별·주소는 가입 과정에서 받지 않습니다. 설정에서 프로필을 수정하거나 현재 비밀번호 확인 후 계정과 프로필 사진을 삭제할 수 있습니다."]],
  };
  const [title, subtitle, items] = data[type] ?? data.about;
  return <div className="static-page page-wrap"><div className="container narrow-container"><span className="eyebrow">수리온 원칙</span><h1>{title}</h1><p className="static-lead">{subtitle}</p><div className="static-list">{items.map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></div>)}</div><Link className="button button-primary" href="/">홈으로 돌아가기</Link></div></div>;
}
