"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, ArrowLeft, BadgeCheck, Bookmark, Check, CheckCircle2, ChevronRight, Clock, Eye, Flag, Heart, Image as ImageIcon, Info, Lock, MapPin, MessageCircle, MoreHorizontal, Paperclip, Send, Share2, ShieldAlert, ThumbsUp, UserRound, Wrench, X,
} from "lucide-react";
import { canRequestRepair } from "@surion/domain";
import type { CaseComment, Expert, RepairRequest, Resolution } from "@surion/domain";
import { Button, ResolutionBadge, RoleBadge } from "@/components/ui";
import { categories, commentTypeLabel, experts, roleLabel } from "@/lib/demo-data";
import { useDemoStore } from "./demo-store";

const roleTone = { QUESTIONER: "questioner", EXPERT: "expert", BUSINESS_EXPERT: "business", USER: "user", ADMIN: "admin" } as const;
const resolutionMethods: Resolution["method"][] = ["직접 해결", "수리온 전문가에게 수리", "외부 수리업체", "제조사 서비스센터", "제품 교체", "미해결 종료"];

export function CaseDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { cases, comments, repairRequests, savedCaseIds, addComment, addRepairRequest, resolveCase, toggleSaved, role, setRole } = useDemoStore();
  const item = cases.find((entry) => entry.id === id) ?? cases[0];
  const thread = comments.filter((comment) => comment.caseId === item.id);
  const [commentBody, setCommentBody] = useState("");
  const [commentType, setCommentType] = useState<CaseComment["type"]>("GENERAL");
  const [replyTo, setReplyTo] = useState<CaseComment | null>(null);
  const [requestExpert, setRequestExpert] = useState<Expert | null>(null);
  const [resolutionOpen, setResolutionOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [helpful, setHelpful] = useState<string[]>([]);
  const [sameProblem, setSameProblem] = useState(false);
  const categorySlug = categories.find((category) => category.name === item.category)?.id ?? "etc";
  const answerCount = thread.length || item.comments;
  const composerIdentity = role === "expert"
    ? { avatar: "김", name: "김수리" }
    : role === "admin"
      ? { avatar: "관", name: "수리온 운영자" }
      : role === "questioner"
        ? { avatar: "민", name: item.author }
        : { avatar: "경", name: "경험나눔" };

  const answeringExperts = useMemo(() => experts.filter((expert) => thread.some((comment) => comment.expertId === expert.id && comment.validExpertAnswer)), [thread]);
  const activeRequest = repairRequests.find((request) => request.caseId === item.id && ["PENDING", "ACCEPTED"].includes(request.status));

  function commentTypeIsAllowed(type: CaseComment["type"], currentRole: typeof role) {
    if (type === "GENERAL" || type === "USER_EXPERIENCE") return true;
    if (currentRole === "expert") return ["EXPERT_OPINION", "REQUEST_INFORMATION", "SAFETY_WARNING"].includes(type);
    return currentRole === "questioner" && type === "RESOLUTION_UPDATE";
  }

  function changeRole(nextRole: typeof role) {
    setRole(nextRole);
    if (!commentTypeIsAllowed(commentType, nextRole)) setCommentType("GENERAL");
  }

  function submitComment(event: React.FormEvent) {
    event.preventDefault();
    if (commentBody.trim().length < 2) return;
    const isExpert = role === "expert";
    const safeCommentType = commentTypeIsAllowed(commentType, role) ? commentType : "GENERAL";
    addComment({
      id: `comment-${Date.now()}`, caseId: item.id, authorId: isExpert ? "expert-user-kim" : role === "admin" ? "admin-user" : "user-demo", author: composerIdentity.name, role: isExpert ? "BUSINESS_EXPERT" : role === "admin" ? "ADMIN" : role === "questioner" ? "QUESTIONER" : "USER", expertId: isExpert ? "expert-kim" : undefined, type: safeCommentType, body: commentBody.trim(), createdAt: "방금", replyToCommentId: replyTo?.id, replyToLabel: replyTo ? `${replyTo.author}님의 답변` : undefined, validExpertAnswer: isExpert && ["EXPERT_OPINION", "REQUEST_INFORMATION", "SAFETY_WARNING"].includes(safeCommentType) && commentBody.trim().length >= 30, helpfulCount: 0,
    });
    setCommentBody(""); setReplyTo(null); setNotice("답변이 등록됐어요.");
  }

  return (
    <div className="case-detail page-wrap">
      <div className="case-breadcrumb"><div className="container"><button onClick={() => router.back()}><ArrowLeft />목록으로</button><span>{item.category}<ChevronRight />{item.brand}<ChevronRight />{item.model}</span></div></div>
      <div className="container case-layout">
        <article className="case-main">
          <header className="case-header">
            <div className="case-labels"><ResolutionBadge status={item.status} /><Link href={`/category/${categorySlug}`}>{item.category} 게시판</Link>{item.modelIdentificationStatus === "unknown" && <span className="unknown-model"><Info />모델 확인 필요</span>}</div>
            <h1>{item.title}</h1>
            <div className="case-author"><span className="avatar">민</span><div><strong>{item.author}<RoleBadge tone="questioner">질문자</RoleBadge></strong><span>{item.createdAt} · 수정됨</span></div><button className="more-button" aria-label="게시글 메뉴"><MoreHorizontal /></button></div>
            <div className="case-metrics"><span><Eye />조회 {item.views.toLocaleString()}</span><span><MessageCircle />답변 {answerCount}</span><span><Bookmark />저장 {item.saves}</span><div><button onClick={() => setSameProblem(!sameProblem)} className={sameProblem ? "selected" : ""}><UserRound />나도 같은 증상 {item.helpful + Number(sameProblem)}</button><button onClick={() => toggleSaved(item.id)} className={savedCaseIds.includes(item.id) ? "selected" : ""}><Bookmark fill={savedCaseIds.includes(item.id) ? "currentColor" : "none"} />{savedCaseIds.includes(item.id) ? "저장됨" : "저장"}</button><button onClick={() => navigator.clipboard?.writeText(window.location.href).then(() => setNotice("링크를 복사했어요."))}><Share2 />공유</button></div></div>
          </header>

          <section className="product-summary"><span className="product-summary-icon"><Wrench /></span><div><small>{item.brand}</small><strong>{item.model}</strong><Link href={`/models/${encodeURIComponent(item.model)}`}>이 모델의 해결 사례 보기<ChevronRight /></Link></div></section>

          <section className="case-body">
            <h2>증상 설명</h2><p className="lead-copy">{item.symptom}</p>
            <dl className="case-facts"><div><dt>사용 기간</dt><dd>{id === "case-1" ? "약 1년 4개월" : "약 2년"}</dd></div><div><dt>발생 시점</dt><dd>{id === "case-1" ? "3일 전부터" : "일주일 전부터"}</dd></div><div><dt>증상 유형</dt><dd>{item.tags.join(" · ")}</dd></div><div><dt>발생 빈도</dt><dd>사용할 때마다</dd></div></dl>
            <div className="attempt-box"><h3>이미 시도한 조치</h3><ul><li>전원을 완전히 분리한 뒤 10분 후 다시 연결했습니다.</li><li>접점과 외관을 마른 천으로 청소했습니다.</li><li>앱과 제품을 재시작했지만 같은 증상입니다.</li></ul></div>
            <div className="case-media"><div><ImageIcon /><span>충전독_접점.jpg</span></div><div><ImageIcon /><span>제품_명판.jpg</span></div></div>
            <div className="added-info"><span><Info /></span><div><strong>질문자가 추가한 정보</strong><small>오늘 10:20</small><p>본체를 도크에서 살짝 들어 올리면 표시등이 다시 켜집니다. 좌우 접점 사진을 추가했습니다.</p></div></div>
            <p className="edit-history"><Clock />마지막 수정 오늘 10:22 · <button>수정 이력 보기</button></p>
          </section>

          {item.status === "RESOLVED" && <section className="resolution-card"><span className="resolution-check"><CheckCircle2 /></span><div><span className="eyebrow">채택된 해결 결과</span><h2>질문자가 해결 완료를 확인했어요</h2><p>아래 공개 답변과 질문자의 해결 기록을 참고해 같은 증상인지 확인해 보세요.</p><dl><div><dt>해결 방식</dt><dd>{item.solvedBy ?? "직접 해결"}</dd></div><div><dt>공개 답변</dt><dd>{answerCount}개</dd></div></dl><button><ThumbsUp />이 해결 사례가 도움됐어요 <strong>{item.helpful}</strong></button></div></section>}

          <section className="conversation" id="conversation">
            <div className="conversation-head"><div><span className="eyebrow">공개 답변</span><h2>답변과 경험 {answerCount}개</h2><p>일반 사용자와 전문가가 같은 공간에서 원인을 함께 확인합니다.</p></div><details className="demo-role-control"><summary>데모 역할 바꾸기</summary><label>현재 역할<select value={role} onChange={(event) => changeRole(event.target.value as typeof role)}><option value="questioner">질문자</option><option value="expert">전문가</option><option value="user">일반 사용자</option><option value="admin">관리자</option></select></label></details></div>
            <div className="conversation-guide"><Info /><span><strong>공개 답변에는 개인정보를 적지 마세요.</strong> 주소·전화번호·견적 정보는 수리 요청의 비공개 공간에서만 나눌 수 있습니다.</span></div>
            <div className="timeline">
              {thread.length ? thread.map((comment) => (
                <article className={`comment comment-${comment.role.toLowerCase()} ${comment.type === "SAFETY_WARNING" ? "safety-comment" : ""}`} key={comment.id}>
                  <span className="comment-avatar">{comment.author[0]}</span>
                  <div className="comment-content">
                    {comment.replyToLabel && <div className="reply-label">↳ {comment.replyToLabel}에 답변</div>}
                    <header><div><strong>{comment.author}</strong><RoleBadge tone={roleTone[comment.role]}>{roleLabel[comment.role]}</RoleBadge>{comment.expertId && experts.find((expert) => expert.id === comment.expertId)?.activeNow && <span className="active-label">활동 중</span>}</div><span>{comment.createdAt}{comment.edited && " · 수정됨"}</span></header>
                    <span className={`comment-type type-${comment.type.toLowerCase()}`}>{comment.type === "SAFETY_WARNING" && <ShieldAlert />}{commentTypeLabel[comment.type]}</span>
                    <p>{comment.deleted ? "삭제된 답변입니다" : comment.body}</p>
                    <footer><button className={helpful.includes(comment.id) ? "selected" : ""} onClick={() => setHelpful((current) => current.includes(comment.id) ? current.filter((value) => value !== comment.id) : [...current, comment.id])}><ThumbsUp />도움돼요 {comment.helpfulCount + Number(helpful.includes(comment.id))}</button><button onClick={() => { setReplyTo(comment); document.getElementById("comment-form")?.scrollIntoView({ behavior: "smooth" }); }}><MessageCircle />답글</button><button><Flag />신고</button></footer>
                    {comment.expertId && <div className="comment-expert-actions"><Link href={`/experts/${comment.expertId}`}>프로필 보기</Link><button disabled={!canRequestRepair({ currentUserId: role === "questioner" ? "user-demo" : "other-user", questionAuthorId: "user-demo", expert: experts.find((expert) => expert.id === comment.expertId)!, comments: thread, caseId: item.id, caseStatus: item.status, repairRequests })} onClick={() => setRequestExpert(experts.find((expert) => expert.id === comment.expertId) ?? null)}><Wrench />이 전문가에게 수리 요청</button></div>}
                  </div>
                </article>
              )) : <div className="no-comments"><MessageCircle /><strong>아직 답변이 없어요</strong><p>비슷한 경험이나 확인 방법을 첫 답변으로 남겨주세요.</p></div>}
            </div>

            <form className="comment-form" id="comment-form" onSubmit={submitComment}>
              <div className="comment-form-head"><div><span className="avatar">{composerIdentity.avatar}</span><strong>{composerIdentity.name}</strong><RoleBadge tone={role === "expert" ? "business" : role === "admin" ? "admin" : role === "questioner" ? "questioner" : "user"}>{role === "expert" ? "사업자 인증 전문가" : role === "admin" ? "관리자" : role === "questioner" ? "질문자" : "일반 사용자"}</RoleBadge></div><select value={commentType} onChange={(event) => setCommentType(event.target.value as CaseComment["type"])} aria-label="답변 유형"><option value="GENERAL">일반 답변</option>{role === "expert" && <><option value="EXPERT_OPINION">전문가 의견</option><option value="REQUEST_INFORMATION">추가 확인 필요</option><option value="SAFETY_WARNING">안전 주의</option></>}<option value="USER_EXPERIENCE">경험 공유</option>{role === "questioner" && <option value="RESOLUTION_UPDATE">해결 업데이트</option>}</select></div>
              {replyTo && <div className="replying-to">{replyTo.author}님의 답변에 답변 중<button type="button" onClick={() => setReplyTo(null)}><X /></button></div>}
              <textarea value={commentBody} onChange={(event) => setCommentBody(event.target.value)} placeholder={role === "expert" ? "가능한 원인, 추가로 확인할 정보, 안전 주의사항을 답변해 주세요." : "비슷한 경험이나 도움이 될 만한 확인 방법을 답변해 주세요."} rows={5} />
              {role === "expert" && <div className="valid-answer-hint"><Check /><span>가능한 원인이나 추가 확인 내용을 포함한 충분한 답변은 ‘유효 답변’으로 기록됩니다. 연락처만 남기는 답변은 허용되지 않습니다.</span></div>}
              <div className="comment-form-footer"><button type="button" className="attach-button"><Paperclip />사진 첨부</button><span>{commentBody.length}/3000</span><Button type="submit" disabled={commentBody.trim().length < 2}><Send />답변 등록</Button></div>
            </form>
          </section>
        </article>

        <aside className="case-sidebar">
          <div className="sidebar-card status-card"><span className="eyebrow">질문 상태</span><ResolutionBadge status={item.status} /><p>{item.status === "RESOLVED" ? "질문자가 해결을 확인했으며, 해결 기록이 공개 사례로 남았습니다." : "아직 해결 전입니다. 공개 답변을 확인하거나 경험을 나눠주세요."}</p></div>
          {activeRequest && <div className="sidebar-card active-request-card"><Lock /><span><strong>비공개 수리 요청 {activeRequest.status === "PENDING" ? "대기 중" : "진행 중"}</strong><small>{experts.find((expert) => expert.id === activeRequest.expertId)?.name}</small></span><Link href="/repair-requests">요청 확인</Link></div>}
          <div className="sidebar-card answer-experts"><span className="eyebrow">이 글에 답변한 전문가</span>{answeringExperts.length ? answeringExperts.map((expert) => <div key={expert.id}><span className="sidebar-avatar">{expert.name[0]}</span><div><Link href={`/experts/${expert.id}`}>{expert.name}<BadgeCheck /></Link><small>{expert.categories.join(" · ")}</small><span>{expert.helpfulAnswers}개의 도움된 답변</span></div><button aria-label={`${expert.name} 프로필`}><ChevronRight /></button></div>) : <p>아직 전문가 답변이 없습니다.</p>}</div>
          <div className="sidebar-card safety-card"><ShieldAlert /><div><strong>직접 확인은 안전하게</strong><p>전원 분리 후 외관 확인까지만 권장합니다. 감전·화재 위험이 있으면 즉시 사용을 중단하세요.</p><Link href="/safety">안전 가이드 보기</Link></div></div>
          {!["RESOLVED", "CLOSED_UNRESOLVED"].includes(item.status) && role === "questioner" && <button className="resolve-button" onClick={() => setResolutionOpen(true)}><CheckCircle2 />해결 결과 등록하기</button>}
        </aside>
      </div>
      {notice && <div className="toast" role="status"><Check />{notice}<button onClick={() => setNotice("")}><X /></button></div>}
      {requestExpert && <RepairRequestModal expert={requestExpert} caseId={item.id} onClose={() => setRequestExpert(null)} onSubmit={(request) => { addRepairRequest(request); setRequestExpert(null); setNotice("비공개 수리 요청을 보냈어요."); }} />}
      {resolutionOpen && <ResolutionModal comments={thread} onClose={() => setResolutionOpen(false)} onSubmit={(resolution) => { resolveCase(item.id, resolution); setResolutionOpen(false); setNotice("해결 결과가 등록됐어요."); }} />}
    </div>
  );
}

function RepairRequestModal({ expert, caseId, onClose, onSubmit }: { expert: Expert; caseId: string; onClose: () => void; onSubmit: (request: RepairRequest) => void }) {
  const [method, setMethod] = useState<RepairRequest["method"]>("택배");
  const [date, setDate] = useState("2026-08-12");
  const [note, setNote] = useState("");
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="repair-title"><button className="modal-close" onClick={onClose}><X /></button><span className="modal-icon"><Wrench /></span><span className="eyebrow">비공개 요청</span><h2 id="repair-title">{expert.name}에게 수리를 요청할까요?</h2><p>이 요청과 이후 대화는 질문자와 전문가만 볼 수 있습니다.</p><div className="request-expert-summary"><span>{expert.name[0]}</span><div><strong>{expert.name}<BadgeCheck /></strong><small>{expert.categories.join(" · ")} · {expert.responseTime}</small></div></div><fieldset className="method-picker"><legend>수리 방식</legend>{(["택배", "방문", "출장"] as const).map((value) => <label className={method === value ? "selected" : ""} key={value}><input type="radio" name="method" checked={method === value} onChange={() => setMethod(value)} />{value}</label>)}</fieldset><label>희망 일정<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label>전문가에게 전달할 내용<textarea rows={4} value={note} onChange={(event) => setNote(event.target.value)} placeholder="증상과 요청 사항을 더 알려주세요." /></label><div className="quote-ready"><Info />견적 기능은 준비 중입니다. MVP에서는 전문가가 요청을 수락하거나 거절할 수 있습니다.</div><div className="modal-actions"><Button variant="secondary" onClick={onClose}>취소</Button><Button onClick={() => onSubmit({ id: `request-${Date.now()}`, caseId, expertId: expert.id, requesterId: "user-demo", method, preferredDate: date, note, status: "PENDING", createdAt: "방금" })} disabled={!date}>요청 보내기</Button></div></div></div>;
}

function ResolutionModal({ comments, onClose, onSubmit }: { comments: CaseComment[]; onClose: () => void; onSubmit: (resolution: Resolution) => void }) {
  const [form, setForm] = useState<Resolution>({ method: "직접 해결", cause: "", summary: "", duration: "1주 이내", working: true });
  return <div className="modal-backdrop" role="presentation"><div className="modal resolution-modal" role="dialog" aria-modal="true" aria-labelledby="resolution-title"><button className="modal-close" onClick={onClose}><X /></button><span className="modal-icon success"><CheckCircle2 /></span><span className="eyebrow">해결 사례 완성</span><h2 id="resolution-title">어떻게 해결됐나요?</h2><p>남겨주신 결과는 비슷한 문제를 겪는 사용자에게 큰 도움이 됩니다.</p><label>해결 방식<select value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value as Resolution["method"] })}>{resolutionMethods.map((method) => <option key={method}>{method}</option>)}</select></label><label>실제 원인<input value={form.cause} onChange={(event) => setForm({ ...form, cause: event.target.value })} placeholder="예: 충전독 왼쪽 접점 스프링 불량" /></label><label>해결 방법 요약<textarea rows={3} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} placeholder="어떤 조치로 해결됐는지 알려주세요." /></label><div className="field-grid"><label>실제 수리비<input type="number" value={form.cost ?? ""} onChange={(event) => setForm({ ...form, cost: Number(event.target.value) })} placeholder="원" /></label><label>해결까지 걸린 기간<select value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })}><option>하루 이내</option><option>3일 이내</option><option>1주 이내</option><option>2주 이상</option></select></label></div><label>도움을 준 답변<select value={form.helperCommentId ?? ""} onChange={(event) => setForm({ ...form, helperCommentId: event.target.value })}><option value="">선택 안 함</option>{comments.filter((comment) => comment.role.includes("EXPERT")).map((comment) => <option value={comment.id} key={comment.id}>{comment.author} · {comment.body.slice(0, 30)}…</option>)}</select></label><label className="check-row"><input type="checkbox" checked={form.working} onChange={(event) => setForm({ ...form, working: event.target.checked })} />현재 정상 작동하고 있어요</label><div className="modal-actions"><Button variant="secondary" onClick={onClose}>나중에</Button><Button onClick={() => onSubmit(form)} disabled={form.cause.length < 2 || form.summary.length < 5}>해결 결과 등록</Button></div></div></div>;
}
