"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { BoardSelector } from "@/components/board-selector";
import { CaseCard, EmptyState, SectionHeading } from "@/components/ui";
import { CategoryIcon } from "@/components/icons";
import { ALL_BOARD_ID, boardHref, getBoardById, normalizeBoardId } from "@/lib/boards";
import { brands, categories } from "@/lib/demo-data";
import { useDemoStore } from "./demo-store";

export function SearchPage({ defaultStatus }: { defaultStatus?: "RESOLVED" | "UNRESOLVED" } = {}) {
  const params = useSearchParams();
  const router = useRouter();
  const paramsKey = params.toString();
  const initialQuery = params.get("q") ?? "";
  const requestedStatus = params.get("status") ?? defaultStatus ?? "ALL";
  const initialStatus = requestedStatus === "RESOLVED" ? "RESOLVED" : requestedStatus === "ALL" ? "ALL" : "UNRESOLVED";
  const [query, setQuery] = useState(initialQuery);
  const [draftQuery, setDraftQuery] = useState(initialQuery);
  const [board, setBoard] = useState(normalizeBoardId(params.get("board")));
  const [brand, setBrand] = useState(params.get("brand") ?? "ALL");
  const [status, setStatus] = useState(initialStatus);
  const [sort, setSort] = useState(params.get("sort") ?? "recent");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filterCloseRef = useRef<HTMLButtonElement>(null);
  const { cases, favoriteBoardIds, toggleFavoriteBoard } = useDemoStore();

  useEffect(() => {
    const nextParams = new URLSearchParams(paramsKey);
    const nextQuery = nextParams.get("q") ?? "";
    const nextRequestedStatus = nextParams.get("status") ?? defaultStatus ?? "ALL";
    setQuery(nextQuery);
    setDraftQuery(nextQuery);
    setStatus(nextRequestedStatus === "RESOLVED" ? "RESOLVED" : nextRequestedStatus === "ALL" ? "ALL" : "UNRESOLVED");
    setSort(nextParams.get("sort") ?? "recent");
    setBoard(normalizeBoardId(nextParams.get("board")));
    setBrand(nextParams.get("brand") ?? "ALL");
  }, [defaultStatus, paramsKey]);

  useEffect(() => {
    if (!filtersOpen) return;
    const previousOverflow = document.body.style.overflow;
    const filterButton = filterButtonRef.current;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setFiltersOpen(false); };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    filterCloseRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      filterButton?.focus();
    };
  }, [filtersOpen]);

  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return cases.filter((item) => {
      const haystack = `${item.title} ${item.symptom} ${item.brand} ${item.model} ${item.tags.join(" ")}`.toLowerCase();
      const matchesResolution = status === "ALL" || (status === "RESOLVED" ? item.status === "RESOLVED" : item.status !== "RESOLVED");
      const selectedCategory = getBoardById(board);
      return terms.every((term) => haystack.includes(term)) && (!selectedCategory || item.category === selectedCategory.name) && (brand === "ALL" || item.brand === brand) && matchesResolution;
    }).sort((a, b) => sort === "comments" ? b.comments - a.comments : sort === "helpful" ? b.helpful - a.helpful : 0);
  }, [cases, query, board, brand, status, sort]);

  const hasFilters = board !== ALL_BOARD_ID || brand !== "ALL" || status !== "ALL" || Boolean(query);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = String(new FormData(event.currentTarget).get("q") ?? draftQuery).trim();
    setQuery(nextQuery);
    const nextParams = new URLSearchParams(params.toString());
    if (nextQuery) nextParams.set("q", nextQuery);
    else nextParams.delete("q");
    if (status !== "ALL") nextParams.set("status", status);
    else nextParams.delete("status");
    if (brand !== "ALL") nextParams.set("brand", brand);
    else nextParams.delete("brand");
    if (sort !== "recent") nextParams.set("sort", sort);
    else nextParams.delete("sort");
    router.replace(`/search${nextParams.size ? `?${nextParams.toString()}` : ""}`, { scroll: false });
  }

  function changeBoard(nextBoard: string) { setBoard(nextBoard); router.replace(boardHref("/search", nextBoard, params), { scroll: false }); }
  function changeFilter(key: "brand" | "status" | "sort", value: string, emptyValue: string) {
    const next = new URLSearchParams(params.toString());
    if (value === emptyValue) next.delete(key);
    else next.set(key, value);
    if (key === "brand") setBrand(value);
    if (key === "status") setStatus(value);
    if (key === "sort") setSort(value);
    router.replace(`/search${next.size ? `?${next}` : ""}`, { scroll: false });
  }
  function reset() { setQuery(""); setDraftQuery(""); setBoard(ALL_BOARD_ID); setBrand("ALL"); setStatus("ALL"); router.replace("/search", { scroll: false }); }

  return (
    <div className="page-wrap search-page">
      <div className="page-hero compact-hero">
        <div className="container"><span className="eyebrow">게시글 검색</span><h1>수리 경험 찾기</h1><p>제품명, 모델명, 고장 증상으로 여러 사람의 게시글과 댓글을 찾아보세요.</p>
          <form className="large-search" action="/search" method="get" role="search" onSubmit={submitSearch}><Search /><label className="sr-only" htmlFor="question-search">제품명, 모델명 또는 고장 증상</label><input id="question-search" name="q" value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} placeholder="예: 다이슨 V12 작동 중 멈춤" aria-label="검색어" /><button type="submit">검색</button></form>
        </div>
      </div>
      <div className="container search-layout">
        <div className="community-board-column search-filter-column"><BoardSelector selectedId={board} hrefFor={(id) => boardHref("/search", id, params)} favoriteIds={favoriteBoardIds} onToggleFavorite={toggleFavoriteBoard} /><aside id="search-filter-panel" className={`filter-panel ${filtersOpen ? "open" : ""}`} role={filtersOpen ? "dialog" : undefined} aria-modal={filtersOpen ? true : undefined} aria-label={filtersOpen ? "검색 조건" : undefined}>
          <div className="filter-mobile-head"><strong>검색 필터</strong><button ref={filterCloseRef} type="button" onClick={() => setFiltersOpen(false)} aria-label="필터 닫기"><X /></button></div>
          <h2 className="filter-title">검색 조건</h2>
          <BoardSelector compact selectedId={board} onChange={changeBoard} favoriteIds={favoriteBoardIds} onToggleFavorite={toggleFavoriteBoard} />
          <label>브랜드<select value={brand} onChange={(event) => changeFilter("brand", event.target.value, "ALL")}><option value="ALL">전체 브랜드</option>{brands.map((item) => <option key={item}>{item}</option>)}</select></label>
          <fieldset><legend>해결 여부</legend>{[["ALL", "전체"], ["UNRESOLVED", "해결 전"], ["RESOLVED", "해결 완료"]].map(([value, label]) => <label className="radio-row" key={value}><input type="radio" name="status" value={value} checked={status === value} onChange={() => changeFilter("status", value, "ALL")} />{label}</label>)}</fieldset>
          {hasFilters && <button className="filter-reset" onClick={reset}>필터 초기화</button>}
        </aside></div>
        <section className="search-results">
          <div className="results-toolbar"><div><strong>{query ? `‘${query}’ 검색 결과` : "전체 게시글"}</strong><span aria-live="polite">{results.length ? "조건에 맞는 글을 확인해 보세요." : "조건에 맞는 글이 없어요."}</span></div><button ref={filterButtonRef} type="button" className="mobile-filter-button" onClick={() => setFiltersOpen(true)} aria-expanded={filtersOpen} aria-controls="search-filter-panel"><Filter />검색 조건</button><label className="sort-select"><SlidersHorizontal /><span className="sr-only">정렬 방식</span><select value={sort} onChange={(event) => changeFilter("sort", event.target.value, "recent")}><option value="recent">최신순</option><option value="comments">댓글 많은 순</option><option value="helpful">같은 증상 많은 순</option></select><ChevronDown /></label></div>
          {hasFilters && <div className="active-filters">{query && <button onClick={() => { setQuery(""); setDraftQuery(""); const next = new URLSearchParams(params.toString()); next.delete("q"); router.replace(`/search${next.size ? `?${next}` : ""}`, { scroll: false }); }}>{query}<X /></button>}{board !== ALL_BOARD_ID && <button onClick={() => changeBoard(ALL_BOARD_ID)}>{getBoardById(board)?.name}<X /></button>}{brand !== "ALL" && <button onClick={() => changeFilter("brand", "ALL", "ALL")}>{brand}<X /></button>}{status !== "ALL" && <button onClick={() => changeFilter("status", "ALL", "ALL")}>{status === "RESOLVED" ? "해결 완료" : "해결 전"}<X /></button>}<button className="clear-all" onClick={reset}>전체 초기화</button></div>}
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
  return <div className="page-wrap"><div className="category-hero"><div className="container"><span className="category-hero-icon"><CategoryIcon name={category.icon} size={36} /></span><div><span className="eyebrow">제품별 게시판</span><h1>{category.name} 게시판</h1><p>{category.description} 관련 질문과 해결 사례를 모았습니다.</p></div></div></div><div className="container content-section"><SectionHeading title={`${category.name} 게시판 글`} description="최근 질문과 해결 경험을 확인해 보세요." /><div className="case-grid case-grid-three">{items.map((item) => <CaseCard key={item.id} item={item} />)}</div><div className="category-all"><h2>다른 게시판</h2><div>{categories.filter((item) => item.id !== id).map((item) => <Link key={item.id} href={`/category/${item.id}`}><CategoryIcon name={item.icon} />{item.name}</Link>)}</div></div></div></div>;
}

export function ModelPage({ model }: { model: string }) {
  const { cases } = useDemoStore();
  const decoded = decodeURIComponent(model);
  const items = cases.filter((item) => item.model.toLowerCase().includes(decoded.toLowerCase()) || decoded.toLowerCase().includes(item.model.toLowerCase()));
  const exemplar = items[0] ?? cases[0];
  return <div className="page-wrap"><div className="model-hero"><div className="container"><span className="eyebrow">모델별 게시글</span><h1>{decoded}</h1><p>{exemplar.brand} · {exemplar.category}</p><div className="model-summary"><span><strong>{items.filter((item) => item.status === "RESOLVED").length}</strong>해결 완료</span><span><strong>{items.reduce((sum, item) => sum + item.comments, 0)}</strong>공개 댓글</span></div></div></div><div className="container content-section"><SectionHeading title="이 모델을 사용한 사람들의 글" href={`/ask?model=${encodeURIComponent(decoded)}`} linkLabel="이 모델로 글쓰기" /><div className="search-list">{items.map((item) => <CaseCard key={item.id} item={item} />)}</div>{!items.length && <EmptyState icon={<Search />} title="아직 등록된 글이 없어요" description="첫 번째 경험을 남겨 주세요." />}</div></div>;
}
