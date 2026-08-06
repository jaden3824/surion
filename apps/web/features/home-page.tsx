"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, BadgeCheck, MessageCircle, Search, Wrench } from "lucide-react";
import { CategoryIcon } from "@/components/icons";
import { CaseCard, SectionHeading } from "@/components/ui";
import { categories, experts } from "@/lib/demo-data";
import { useDemoStore } from "./demo-store";

export function HomePage() {
  const { cases } = useDemoStore();
  const [query, setQuery] = useState("");
  const router = useRouter();
  const resolved = cases.filter((item) => item.status === "RESOLVED").slice(0, 3);
  const unanswered = cases.filter((item) => item.status === "OPEN" || item.status === "NEEDS_INFORMATION").slice(0, 4);
  const active = [...cases].sort((a, b) => b.comments - a.comments).slice(0, 3);
  const recent = cases.slice(0, 6);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    router.push(`/search${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
  }

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="hero-kicker">전자제품 수리 커뮤니티</span>
            <h1>고장 났다면,<br /><em>먼저 찾아보세요.</em></h1>
            <p>같은 제품을 고친 경험과 전문가의 공개 답변을 한곳에서 확인하세요.</p>
            <form className="hero-search" onSubmit={submitSearch} role="search">
              <Search aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="모델명, 제품명, 증상을 검색해 보세요" aria-label="고장 사례 검색" />
              <button type="submit">검색</button>
            </form>
            <div className="quick-search"><span>많이 찾는 검색</span>{["다이슨 멈춤", "로보락 충전", "LG 그램 화면", "커피머신 누수"].map((term) => <Link key={term} href={`/search?q=${encodeURIComponent(term)}`}>{term}</Link>)}</div>
            <div className="hero-actions"><Link className="button button-primary" href="/ask"><Wrench />질문 작성하기</Link><Link className="button button-secondary" href="/search">커뮤니티 글 전체보기<ArrowRight /></Link></div>
          </div>
          <div className="hero-community" aria-label="지금 올라온 커뮤니티 글">
            <div className="hero-community-head"><div><span className="live-dot" /><strong>지금 올라온 질문</strong></div><Link href="/search">전체보기<ArrowRight /></Link></div>
            {recent.slice(0, 4).map((item) => <Link key={item.id} href={`/cases/${item.id}`}><span>{item.category}</span><strong>{item.title}</strong><small>{item.brand} · {item.model}<em><MessageCircle />{item.comments}</em></small></Link>)}
          </div>
        </div>
      </section>

      <section className="home-section category-section">
        <div className="container">
          <SectionHeading eyebrow="전체 카테고리" title="제품 종류부터 골라보세요" description="전자제품의 모든 주요 분류를 한눈에 확인할 수 있어요." />
          <div className="category-grid">
            {categories.map((category) => (
              <Link key={category.id} href={`/category/${category.id}`} className="category-item">
                <span className="category-icon"><CategoryIcon name={category.icon} /></span>
                <strong>{category.name}</strong><small>{category.description}</small><ArrowRight size={17} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section community-section" id="community">
        <div className="container">
          <SectionHeading eyebrow="커뮤니티 새 글" title="방금 올라온 고장 질문" description="일반 사용자와 전문가가 같은 댓글 공간에서 답합니다." href="/search" linkLabel="커뮤니티 전체보기" />
          <nav className="community-tabs" aria-label="커뮤니티 글 필터"><Link className="active" href="/search">최신 글</Link><Link href="/search?status=OPEN">답변 대기</Link><Link href="/search?sort=comments">댓글 많은 글</Link><Link href="/search?status=RESOLVED">해결된 글</Link></nav>
          <div className="community-list">{recent.map((item) => <CaseCard key={item.id} item={item} compact />)}</div>
        </div>
      </section>

      <section className="home-section resolved-section">
        <div className="container">
          <SectionHeading eyebrow="해결된 사례" title="실제로 해결된 고장 이야기" description="질문부터 원인과 해결 결과까지 한 번에 확인하세요." href="/search?status=RESOLVED" />
          <div className="case-grid case-grid-three">{resolved.map((item) => <CaseCard key={item.id} item={item} />)}</div>
        </div>
      </section>

      <section className="home-section split-section secondary-community">
        <div className="container split-grid">
          <div>
            <SectionHeading eyebrow="답변을 기다려요" title="경험이 있다면 알려주세요" href="/search?status=OPEN" />
            <div className="list-stack">{unanswered.map((item) => <CaseCard key={item.id} item={item} compact />)}</div>
          </div>
          <div>
            <SectionHeading eyebrow="의견이 활발해요" title="전문가들이 함께 원인을 좁혀요" href="/search?sort=comments" />
            <div className="active-list">{active.map((item, index) => <Link key={item.id} href={`/cases/${item.id}`}><span className="rank">{index + 1}</span><div><small>{item.category} · {item.model}</small><strong>{item.title}</strong><span><MessageCircle size={14} /> 의견 {item.comments}개</span></div><ArrowRight /></Link>)}</div>
          </div>
        </div>
      </section>

      <section className="home-section expert-section">
        <div className="container">
          <SectionHeading eyebrow="답변으로 증명하는 전문가" title="신뢰할 수 있는 전문가를 만나보세요" description="광고보다 공개 답변과 실제 해결 이력을 먼저 보여드립니다." href="/experts" />
          <div className="expert-grid">{experts.slice(0, 3).map((expert, index) => <Link className="expert-card" href={`/experts/${expert.id}`} key={expert.id}><div className={`expert-photo photo-${index + 1}`}>{expert.name[0]}</div><div className="expert-card-main"><div className="expert-name"><strong>{expert.name}</strong>{expert.status === "BUSINESS_VERIFIED" ? <span><BadgeCheck />사업자 인증</span> : <span className="personal-badge"><BadgeCheck />개인 전문가</span>}</div><p>{expert.intro}</p><div className="expert-tags">{expert.categories.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="expert-stats"><span><strong>{expert.helpfulAnswers}</strong>도움된 답변</span><span><strong>{expert.confirmedSolutions}</strong>해결 확인</span><span><strong>{expert.responseTime.replace("평균 ", "")}</strong>응답</span></div></div></Link>)}</div>
        </div>
      </section>

      <section className="flow-section">
        <div className="container">
          <SectionHeading eyebrow="수리온 이용 흐름" title="답변을 보고, 믿을 수 있을 때 수리를 맡기세요" description="견적부터 받는 구조가 아니라 공개 대화로 신뢰를 확인합니다." />
          <ol className="flow-list">
            {[
              ["01", "모델명과 증상으로 질문", "제품 정보와 이미 해본 조치를 함께 남겨요."],
              ["02", "사용자·전문가 공개 대화", "경험과 다른 가능성을 한 공간에서 나눠요."],
              ["03", "답변 이력을 보고 선택", "유효한 답변을 남긴 전문가만 요청할 수 있어요."],
              ["04", "해결 결과를 사례로 축적", "실제 원인과 비용, 후기가 다음 사람에게 남아요."],
            ].map(([number, title, copy]) => <li key={number}><span>{number}</span><div><strong>{title}</strong><p>{copy}</p></div></li>)}
          </ol>
          <div className="flow-cta"><div><strong>지금 겪고 있는 고장을 알려주세요.</strong><span>모델명을 몰라도 명판 사진으로 질문할 수 있어요.</span></div><Link className="button button-primary" href="/ask">첫 질문 작성하기<ArrowRight /></Link></div>
        </div>
      </section>
    </div>
  );
}
