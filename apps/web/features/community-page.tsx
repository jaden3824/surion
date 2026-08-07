"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, PenLine, SlidersHorizontal } from "lucide-react";
import { BoardSelector } from "@/components/board-selector";
import { Avatar, CaseCard } from "@/components/ui";
import { boardHref, filterCasesByBoard, getBoardById, normalizeBoardId } from "@/lib/boards";
import { useDemoStore } from "./demo-store";

type CommunityStatus = "all" | "unresolved" | "resolved";

export function CommunityPage({ initialBoard }: { initialBoard?: string } = {}) {
  const params = useSearchParams();
  const router = useRouter();
  const { cases, profileAvatar, favoriteBoardIds, toggleFavoriteBoard } = useDemoStore();
  const selectedBoard = normalizeBoardId(params.get("board") ?? initialBoard);
  const selectedCategory = getBoardById(selectedBoard);
  const status = (params.get("status") === "resolved" ? "resolved" : params.get("status") === "unresolved" ? "unresolved" : "all") as CommunityStatus;
  const sort = params.get("sort") === "comments" ? "comments" : params.get("sort") === "popular" ? "popular" : "recent";
  const boardCases = filterCasesByBoard(cases, selectedBoard);
  const filteredCases = boardCases.filter((item) => status === "all" || (status === "resolved" ? item.status === "RESOLVED" : item.status !== "RESOLVED"));
  const visibleCases = sort === "comments" ? [...filteredCases].sort((a, b) => b.comments - a.comments) : sort === "popular" ? [...filteredCases].sort((a, b) => (b.helpful + b.comments) - (a.helpful + a.comments)) : filteredCases;
  const askHref = boardHref("/ask", selectedBoard);

  function updateParam(key: "status" | "sort", value: string) {
    const next = new URLSearchParams(params.toString());
    if ((key === "status" && value === "all") || (key === "sort" && value === "recent")) next.delete(key);
    else next.set(key, value);
    router.replace(`/community${next.size ? `?${next}` : ""}`, { scroll: false });
  }

  return <div className="page-wrap community-page"><div className="page-hero compact-hero"><div className="container"><span className="eyebrow">수리온 커뮤니티</span><h1>{selectedCategory ? `${selectedCategory.name} 게시판` : "전체글보기"}</h1><p>{selectedCategory ? selectedCategory.description : "여러 사람이 올린 질문과 해결 경험을 최신순으로 확인하세요."}</p></div></div><div className="container board-layout community-page-layout"><div className="community-board-column"><BoardSelector selectedId={selectedBoard} hrefFor={(id) => boardHref("/community", id, params)} favoriteIds={favoriteBoardIds} onToggleFavorite={toggleFavoriteBoard} /><div className="board-sidebar-help"><strong>게시판 이용 안내</strong><p>한 사람의 글이 대표 사례가 되지 않아요. 각자의 경험을 올리고 댓글로 이어가세요.</p><Link href="/about">이용 방법 보기</Link></div></div><main className="board-content"><BoardSelector compact selectedId={selectedBoard} onChange={(id) => router.push(boardHref("/community", id, params))} favoriteIds={favoriteBoardIds} onToggleFavorite={toggleFavoriteBoard} /><div className="board-content-head"><div><span>{selectedCategory ? "게시판 글보기" : "전체글보기"}</span><h2>{selectedCategory ? `${selectedCategory.name} 글` : "모든 게시글"}</h2><p>최근 올라온 글부터 둘러보세요.</p></div><Link className="button button-primary" href={askHref}><PenLine />새 글 올리기</Link></div><Link className="feed-compose-card" href={askHref}><Avatar name="내 프로필" src={profileAvatar || undefined} size="md" /><span><strong>질문이나 해결 경험을 남겨보세요</strong><small>제품과 증상을 적으면 같은 경험을 가진 사람들이 댓글을 남길 수 있어요.</small></span><em>글쓰기</em></Link><div className="community-toolbar"><nav className="community-tabs" aria-label="게시글 상태">{([['all', '전체'], ['unresolved', '해결 전'], ['resolved', '해결 완료']] as const).map(([value, label]) => <button key={value} className={status === value ? "active" : ""} onClick={() => updateParam("status", value)} aria-pressed={status === value}>{label}</button>)}</nav><label className="sort-select"><SlidersHorizontal aria-hidden="true" /><span className="sr-only">정렬 방식</span><select value={sort} onChange={(event) => updateParam("sort", event.target.value)}><option value="recent">최신순</option><option value="popular">인기순</option><option value="comments">댓글 많은 순</option></select><ChevronDown aria-hidden="true" /></label></div><div className="community-list community-list-single">{visibleCases.map((item) => <CaseCard key={item.id} item={item} compact />)}</div>{!visibleCases.length && <div className="board-empty"><strong>이 게시판에는 아직 글이 없어요.</strong><p>첫 글을 남기면 게시판 목록에 바로 표시됩니다.</p><Link className="button button-primary" href={askHref}>첫 글 올리기</Link></div>}</main></div></div>;
}
