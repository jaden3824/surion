"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { CaseCard, EmptyState, SectionHeading } from "@/components/ui";
import { CategoryIcon } from "@/components/icons";
import { brands, categories } from "@/lib/demo-data";
import { useDemoStore } from "./demo-store";

export function SearchPage() {
  const params = useSearchParams();
  const initialQuery = params.get("q") ?? "";
  const initialStatus = params.get("status") ?? "ALL";
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("ALL");
  const [brand, setBrand] = useState("ALL");
  const [status, setStatus] = useState(initialStatus);
  const [sort, setSort] = useState(params.get("sort") ?? "recent");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { cases } = useDemoStore();

  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return cases.filter((item) => {
      const haystack = `${item.title} ${item.symptom} ${item.brand} ${item.model} ${item.tags.join(" ")}`.toLowerCase();
      return terms.every((term) => haystack.includes(term)) && (category === "ALL" || item.category === category) && (brand === "ALL" || item.brand === brand) && (status === "ALL" || item.status === status);
    }).sort((a, b) => sort === "comments" ? b.comments - a.comments : sort === "helpful" ? b.helpful - a.helpful : b.id.localeCompare(a.id));
  }, [cases, query, category, brand, status, sort]);

  const hasFilters = category !== "ALL" || brand !== "ALL" || status !== "ALL" || Boolean(query);

  function reset() { setQuery(""); setCategory("ALL"); setBrand("ALL"); setStatus("ALL"); }

  return (
    <div className="page-wrap search-page">
      <div className="page-hero compact-hero">
        <div className="container"><span className="eyebrow">수리 지식 검색</span><h1>고장 사례를 찾아보세요</h1><p>모델명, 증상, 해결 방법이 쌓인 공개 대화를 검색할 수 있어요.</p>
          <div className="large-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="예: 다이슨 V12 작동 중 멈춤" aria-label="검색어" /><button>검색</button></div>
        </div>
      </div>
      <div className="container search-layout">
        <aside className={`filter-panel ${filtersOpen ? "open" : ""}`}>
          <div className="filter-mobile-head"><strong>검색 필터</strong><button onClick={() => setFiltersOpen(false)} aria-label="필터 닫기"><X /></button></div>
          <label>카테고리<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="ALL">전체 카테고리</option>{categories.map((item) => <option key={item.id}>{item.name}</option>)}</select></label>
          <label>브랜드<select value={brand} onChange={(event) => setBrand(event.target.value)}><option value="ALL">전체 브랜드</option>{brands.map((item) => <option key={item}>{item}</option>)}</select></label>
          <fieldset><legend>진행 상태</legend>{[["ALL", "전체"], ["OPEN", "답변 대기"], ["DIAGNOSING", "원인 확인 중"], ["RESOLVED", "해결 완료"]].map(([value, label]) => <label className="radio-row" key={value}><input type="radio" name="status" value={value} checked={status === value} onChange={() => setStatus(value)} />{label}</label>)}</fieldset>
          {hasFilters && <button className="filter-reset" onClick={reset}>필터 초기화</button>}
        </aside>
        <section className="search-results">
          <div className="results-toolbar"><div><strong>{query ? `‘${query}’ 검색 결과` : "전체 고장 사례"}</strong><span>{results.length}건</span></div><button className="mobile-filter-button" onClick={() => setFiltersOpen(true)}><Filter />필터</button><label className="sort-select"><SlidersHorizontal /><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recent">최신순</option><option value="comments">댓글 많은 순</option><option value="helpful">도움순</option></select><ChevronDown /></label></div>
          {hasFilters && <div className="active-filters">{query && <button onClick={() => setQuery("")}>{query}<X /></button>}{category !== "ALL" && <button onClick={() => setCategory("ALL")}>{category}<X /></button>}{brand !== "ALL" && <button onClick={() => setBrand("ALL")}>{brand}<X /></button>}</div>}
          <div className="search-list">{results.map((item) => <CaseCard key={item.id} item={item} />)}</div>
          {!results.length && <EmptyState icon={<Search />} title="조건에 맞는 사례가 아직 없어요" description="검색어를 줄이거나 직접 질문을 남겨 보세요." action={<Link className="button button-primary" href="/ask">질문 작성하기</Link>} />}
        </section>
      </div>
    </div>
  );
}

export function CategoryPage({ id }: { id: string }) {
  const { cases } = useDemoStore();
  const category = categories.find((item) => item.id === id) ?? categories[0];
  const items = cases.filter((item) => item.category === category.name);
  return <div className="page-wrap"><div className="category-hero"><div className="container"><span className="category-hero-icon"><CategoryIcon name={category.icon} size={36} /></span><div><span className="eyebrow">카테고리</span><h1>{category.name}</h1><p>{category.description} 관련 질문과 해결 사례를 모았습니다.</p></div></div></div><div className="container content-section"><SectionHeading title={`${category.name} 고장 사례`} description={`총 ${items.length}건의 사례가 있습니다.`} /><div className="case-grid case-grid-three">{items.map((item) => <CaseCard key={item.id} item={item} />)}</div><div className="category-all"><h2>다른 카테고리</h2><div>{categories.filter((item) => item.id !== id).map((item) => <Link key={item.id} href={`/category/${item.id}`}><CategoryIcon name={item.icon} />{item.name}</Link>)}</div></div></div></div>;
}

export function ModelPage({ model }: { model: string }) {
  const { cases } = useDemoStore();
  const decoded = decodeURIComponent(model);
  const items = cases.filter((item) => item.model.toLowerCase().includes(decoded.toLowerCase()) || decoded.toLowerCase().includes(item.model.toLowerCase()));
  const exemplar = items[0] ?? cases[0];
  return <div className="page-wrap"><div className="model-hero"><div className="container"><span className="eyebrow">모델별 해결 사례</span><h1>{decoded}</h1><p>{exemplar.brand} · {exemplar.category}</p><div className="model-summary"><span><strong>{items.length}</strong>등록된 질문</span><span><strong>{items.filter((item) => item.status === "RESOLVED").length}</strong>해결된 사례</span><span><strong>{items.reduce((sum, item) => sum + item.comments, 0)}</strong>공개 의견</span></div></div></div><div className="container content-section"><SectionHeading title="이 모델의 고장 사례" href={`/ask?model=${encodeURIComponent(decoded)}`} linkLabel="이 모델로 질문하기" /><div className="search-list">{items.map((item) => <CaseCard key={item.id} item={item} />)}</div>{!items.length && <EmptyState icon={<Search />} title="아직 등록된 사례가 없어요" description="첫 번째 질문을 남겨 주세요." />}</div></div>;
}
