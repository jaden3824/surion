"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, BadgeCheck, Search, Star, TrendingUp, Wrench } from "lucide-react";
import { Avatar, CaseCard, SectionHeading } from "@/components/ui";
import { categories, experts } from "@/lib/demo-data";
import { useDemoStore } from "./demo-store";

export function HomePage() {
  const { cases, favoriteBoardIds, profileAvatar } = useDemoStore();
  const [query, setQuery] = useState("");
  const router = useRouter();
  const popularPosts = [...cases].sort((a, b) => (b.comments * 4 + b.helpful * 2 + b.views / 100) - (a.comments * 4 + a.helpful * 2 + a.views / 100)).slice(0, 5);
  const favoriteBoards = categories.filter((board) => favoriteBoardIds.includes(board.id)).slice(0, 4);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedQuery = String(new FormData(event.currentTarget).get("q") ?? query).trim();
    router.push(`/search${submittedQuery ? `?q=${encodeURIComponent(submittedQuery)}` : ""}`);
  }

  return (
    <div className="home-page">
      <section className="hero hero-simple">
        <div className="hero-inner hero-inner-simple">
          <div className="hero-copy">
            <span className="hero-kicker">전자제품 수리 경험 커뮤니티</span>
            <h1>전자제품이 고장 났나요?<br /><em>같은 증상부터 찾아보세요.</em></h1>
            <p>여러 사람이 올린 고장 경험과 댓글을 찾아보고, 내 이야기도 바로 남길 수 있어요.</p>
            <form className="hero-search" action="/search" method="get" onSubmit={submitSearch} role="search">
              <Search aria-hidden="true" />
              <label className="sr-only" htmlFor="home-search">제품명, 모델명 또는 고장 증상</label>
              <input id="home-search" name="q" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="예: 갤럭시 S23 충전이 안 돼요" aria-label="고장 사례 검색" />
              <button type="submit">검색</button>
            </form>
            <div className="quick-search"><span>자주 찾는 증상</span>{["다이슨 멈춤", "로보락 충전", "LG 그램 화면", "커피머신 누수"].map((term) => <Link key={term} href={`/search?q=${encodeURIComponent(term)}`}>{term}</Link>)}</div>
            <div className="hero-actions"><Link className="button button-primary" href="/ask"><Wrench />새 글 올리기</Link><Link className="button button-secondary" href="/community">전체글보기<ArrowRight /></Link></div>
          </div>
        </div>
      </section>

      <section className="home-section popular-section" id="community">
        <div className="container popular-layout">
          <div className="popular-main">
            <div className="favorite-board-shortcuts" aria-label="즐겨찾는 게시판 바로가기">
              <strong><Star aria-hidden="true" />즐겨찾는 게시판</strong>
              <nav>
                {favoriteBoards.length > 0
                  ? favoriteBoards.map((board) => <Link className="favorite-board-shortcut" href={`/community?board=${board.id}`} key={board.id}>{board.name}</Link>)
                  : <span>게시판 목록의 별표로 추가할 수 있어요.</span>}
              </nav>
              <Link href="/community">관리</Link>
            </div>
            <SectionHeading eyebrow="지금 많이 보는 글" title="수리온 인기글" description="댓글과 공감이 활발한 글을 옆으로 넘겨볼 수 있어요." href="/community" linkLabel="전체글보기" />
            <Link className="feed-compose-card" href="/ask"><Avatar name="내 프로필" src={profileAvatar || undefined} size="md" /><span><strong>어떤 제품에 문제가 생겼나요?</strong><small>질문이나 내가 해결한 경험을 자유롭게 남겨보세요.</small></span><em>글쓰기</em></Link>
            <div className="popular-posts-rail" role="list" aria-label="인기 게시글">{popularPosts.map((item, index) => <div className="popular-post" role="listitem" key={item.id}><span className="popular-rank"><TrendingUp aria-hidden="true" />{index + 1}</span><CaseCard item={item} compact /></div>)}</div>
            <div className="popular-footer"><span>전체 게시판의 최신 글과 해결 전·완료 글은 목록에서 확인할 수 있어요.</span><Link className="button button-secondary" href="/community">게시판 전체 보기<ArrowRight /></Link></div>
          </div>
        </div>
      </section>

      <section className="home-section expert-section">
        <div className="container">
          <SectionHeading eyebrow="수리 전문가" title="공개 활동을 보고 전문가를 확인하세요" description="전문 분야와 커뮤니티 참여 기록을 확인한 뒤 필요한 경우 수리를 요청할 수 있어요." href="/experts" linkLabel="전문가 전체 보기" />
          <div className="expert-grid">{experts.slice(0, 3).map((expert) => <Link className="expert-card" href={`/experts/${expert.id}`} key={expert.id}><Avatar name={expert.name} src={expert.avatarUrl} size="lg" /><div className="expert-card-main"><div className="expert-name"><strong>{expert.name}</strong>{expert.status === "BUSINESS_VERIFIED" ? <span><BadgeCheck />사업자 인증</span> : <span className="personal-badge"><BadgeCheck />개인 전문가</span>}</div><p>{expert.intro}</p><div className="expert-tags">{expert.categories.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="expert-stats"><span><strong>{expert.answers}</strong>공개 댓글</span><span><strong>{expert.helpfulAnswers}</strong>도움된 댓글</span><span><strong>{expert.responseTime.replace("평균 ", "")}</strong>평균 응답</span></div></div></Link>)}</div>
        </div>
      </section>
    </div>
  );
}
