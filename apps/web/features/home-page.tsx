"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, BadgeCheck, CheckCircle2, Search, Wrench } from "lucide-react";
import { CategoryIcon } from "@/components/icons";
import { CaseCard, SectionHeading } from "@/components/ui";
import { categories, experts } from "@/lib/demo-data";
import { useDemoStore } from "./demo-store";

type FeedFilter = "all" | "unresolved" | "resolved" | "active";

export function HomePage() {
  const { cases } = useDemoStore();
  const [query, setQuery] = useState("");
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("all");
  const [selectedBoard, setSelectedBoard] = useState("all");
  const router = useRouter();
  const selectedCategory = categories.find((category) => category.id === selectedBoard);
  const askHref = selectedCategory ? `/ask?category=${selectedCategory.id}` : "/ask";
  const boardCases = selectedCategory ? cases.filter((item) => item.category === selectedCategory.name) : cases;
  const filteredFeed = feedFilter === "resolved"
    ? boardCases.filter((item) => item.status === "RESOLVED")
    : feedFilter === "unresolved"
      ? boardCases.filter((item) => item.status !== "RESOLVED")
      : feedFilter === "active"
        ? [...boardCases].sort((a, b) => b.comments - a.comments)
        : boardCases;
  const feedItems = filteredFeed.slice(0, 10);

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
            <span className="hero-kicker">전자제품 수리 질문과 해결 사례</span>
            <h1>전자제품이 고장 났나요?<br /><em>같은 증상부터 찾아보세요.</em></h1>
            <p>사용자 경험과 전문가 답변을 검색하고, 원하는 내용이 없으면 바로 질문할 수 있어요.</p>
            <form className="hero-search" action="/search" method="get" onSubmit={submitSearch} role="search">
              <Search aria-hidden="true" />
              <label className="sr-only" htmlFor="home-search">제품명, 모델명 또는 고장 증상</label>
              <input id="home-search" name="q" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="예: 갤럭시 S23 충전이 안 돼요" aria-label="고장 사례 검색" />
              <button type="submit">검색</button>
            </form>
            <div className="quick-search"><span>자주 찾는 증상</span>{["다이슨 멈춤", "로보락 충전", "LG 그램 화면", "커피머신 누수"].map((term) => <Link key={term} href={`/search?q=${encodeURIComponent(term)}`}>{term}</Link>)}</div>
            <div className="hero-actions"><Link className="button button-primary" href="/ask"><Wrench />새 질문 올리기</Link><Link className="button button-secondary" href="/search">모든 질문 보기<ArrowRight /></Link></div>
          </div>
        </div>
      </section>

      <section className="home-section board-section" id="community">
        <div className="container board-layout">
          <aside className="board-sidebar" aria-label="수리온 게시판">
            <div className="board-sidebar-head"><strong>수리온 게시판</strong><span>제품별 수리 질문</span></div>
            <button className={`board-all-button ${selectedBoard === "all" ? "active" : ""}`} aria-pressed={selectedBoard === "all"} onClick={() => setSelectedBoard("all")}><span>전체글보기</span><strong>{cases.length}</strong></button>
            <div className="board-menu-title">게시판 글보기</div>
            <nav aria-label="제품별 게시판">
              {categories.map((category) => (
                <button key={category.id} className={selectedBoard === category.id ? "active" : ""} aria-pressed={selectedBoard === category.id} onClick={() => setSelectedBoard(category.id)}>
                  <CategoryIcon name={category.icon} size={17} /><span>{category.name}</span><small>{cases.filter((item) => item.category === category.name).length}</small>
                </button>
              ))}
            </nav>
            <div className="board-sidebar-help"><strong>처음 이용하시나요?</strong><p>같은 증상을 검색한 뒤 찾는 글이 없을 때 질문을 올려주세요.</p><Link href="/about">이용 방법 보기<ArrowRight /></Link></div>
          </aside>

          <div className="board-content">
            <div className="mobile-board-select"><label htmlFor="board-select">게시판 선택</label><select id="board-select" value={selectedBoard} onChange={(event) => setSelectedBoard(event.target.value)}><option value="all">전체글보기</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name} 게시판</option>)}</select></div>
            <div className="board-content-head">
              <div><span>{selectedCategory ? "게시판 글보기" : "전체글보기"}</span><h2>{selectedCategory ? `${selectedCategory.name} 게시판` : "전체 수리 질문"}</h2><p>{selectedCategory ? `${selectedCategory.description} 관련 질문입니다.` : "모든 제품 게시판에 올라온 최신 질문을 모았습니다."}</p></div>
              <Link className="button button-primary" href={askHref}><Wrench />질문 올리기</Link>
            </div>
            <div className="community-toolbar">
              <nav className="community-tabs" aria-label="질문 보기 방식">
                {([['all', '전체'], ['unresolved', '해결 전'], ['resolved', '해결 완료'], ['active', '답변 많은 글']] as const).map(([value, label]) => (
                  <button key={value} className={feedFilter === value ? "active" : ""} onClick={() => setFeedFilter(value)} aria-pressed={feedFilter === value}>{label}</button>
                ))}
              </nav>
              <span className="feed-count" aria-live="polite">총 {filteredFeed.length}개</span>
            </div>
            <div className="community-list community-list-single">{feedItems.map((item) => <CaseCard key={item.id} item={item} compact />)}</div>
            {!feedItems.length && <div className="board-empty"><strong>이 조건에 맞는 질문이 아직 없어요.</strong><p>첫 질문을 남기면 해당 게시판에 바로 표시됩니다.</p><Link className="button button-primary" href={askHref}>질문 올리기</Link></div>}
            <div className="community-next-action"><CheckCircle2 /><div><strong>찾는 증상이 없나요?</strong><span>제품 정보와 증상을 남기면 경험이 있는 사용자와 전문가가 답변할 수 있어요.</span></div><Link className="button button-secondary" href={askHref}>질문 올리기<ArrowRight /></Link></div>
          </div>
        </div>
      </section>

      <section className="home-section expert-section">
        <div className="container">
          <SectionHeading eyebrow="수리 전문가" title="답변 이력으로 전문가를 확인하세요" description="전문 분야와 공개 답변, 실제 해결 기록을 확인한 뒤 수리를 요청할 수 있어요." href="/experts" linkLabel="전문가 전체 보기" />
          <div className="expert-grid">{experts.slice(0, 3).map((expert, index) => <Link className="expert-card" href={`/experts/${expert.id}`} key={expert.id}><div className={`expert-photo photo-${index + 1}`}>{expert.name[0]}</div><div className="expert-card-main"><div className="expert-name"><strong>{expert.name}</strong>{expert.status === "BUSINESS_VERIFIED" ? <span><BadgeCheck />사업자 인증</span> : <span className="personal-badge"><BadgeCheck />개인 전문가</span>}</div><p>{expert.intro}</p><div className="expert-tags">{expert.categories.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="expert-stats"><span><strong>{expert.helpfulAnswers}</strong>도움된 답변</span><span><strong>{expert.confirmedSolutions}</strong>해결 확인</span><span><strong>{expert.responseTime.replace("평균 ", "")}</strong>응답</span></div></div></Link>)}</div>
        </div>
      </section>
    </div>
  );
}
