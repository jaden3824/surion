"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDown, List, Star } from "lucide-react";
import { CategoryIcon } from "@/components/icons";
import { ALL_BOARD_ID } from "@/lib/boards";
import { categories } from "@/lib/demo-data";

type BoardSelectorProps = {
  selectedId: string;
  includeAll?: boolean;
  onChange?: (boardId: string) => void;
  hrefFor?: (boardId: string) => string;
  compact?: boolean;
  label?: string;
  favoriteIds?: string[];
  onToggleFavorite?: (boardId: string) => void;
};

export function BoardSelector({ selectedId, includeAll = true, onChange, hrefFor, compact = false, label = "게시판 선택", favoriteIds = [], onToggleFavorite }: BoardSelectorProps) {
  const selected = categories.find((board) => board.id === selectedId);
  const selectedLabel = selected?.name ?? "전체글보기";
  const favoriteBoards = categories.filter((board) => favoriteIds.includes(board.id));
  const otherBoards = categories.filter((board) => !favoriteIds.includes(board.id));

  function option(boardId: string, children: ReactNode) {
    const active = selectedId === boardId || (boardId === ALL_BOARD_ID && !selected);
    const className = `board-selector-item board-favorite-link ${active ? "active" : ""}`;
    if (hrefFor) return <Link className={className} href={hrefFor(boardId)} aria-current={active ? "page" : undefined}>{children}</Link>;
    return <button type="button" className={className} onClick={() => onChange?.(boardId)} aria-pressed={active}>{children}</button>;
  }

  function favoriteToggle(boardId: string, boardName: string) {
    if (!onToggleFavorite) return null;
    const favorite = favoriteIds.includes(boardId);
    return <button type="button" className={`board-favorite-toggle ${favorite ? "active" : ""}`} onClick={() => onToggleFavorite(boardId)} aria-pressed={favorite} aria-label={`${boardName} 게시판 즐겨찾기 ${favorite ? "해제" : "추가"}`} title={`즐겨찾기 ${favorite ? "해제" : "추가"}`}><Star aria-hidden="true" fill={favorite ? "currentColor" : "none"} /></button>;
  }

  function boardRow(board: (typeof categories)[number], prefix: string) {
    return <div className="board-favorite-row" key={`${prefix}-${board.id}`}>{option(board.id, <><CategoryIcon name={board.icon} size={17} /><span>{board.name}</span></>)}{favoriteToggle(board.id, board.name)}</div>;
  }

  if (compact) {
    return <div className="mobile-board-select board-selector-compact"><div className="board-selector-compact-row"><span>{label}</span>{selected && <button type="button" className={`board-compact-favorite ${favoriteIds.includes(selected.id) ? "active" : ""}`} onClick={() => onToggleFavorite?.(selected.id)} aria-pressed={favoriteIds.includes(selected.id)} aria-label={`${selected.name} 게시판 즐겨찾기 ${favoriteIds.includes(selected.id) ? "해제" : "추가"}`}><Star aria-hidden="true" fill={favoriteIds.includes(selected.id) ? "currentColor" : "none"} />{favoriteIds.includes(selected.id) ? "즐겨찾는 게시판" : "즐겨찾기"}</button>}</div><select value={selected?.id ?? ALL_BOARD_ID} onChange={(event) => onChange?.(event.target.value)} aria-label={label}>{includeAll && <option value={ALL_BOARD_ID}>전체글보기</option>}{favoriteBoards.length > 0 && <optgroup label="즐겨찾는 게시판">{favoriteBoards.map((board) => <option key={`favorite-${board.id}`} value={board.id}>★ {board.name} 게시판</option>)}</optgroup>}<optgroup label="모든 게시판">{(favoriteBoards.length ? otherBoards : categories).map((board) => <option key={board.id} value={board.id}>{board.name} 게시판</option>)}</optgroup></select></div>;
  }

  return <aside className="board-selector" aria-label={label}><div className="board-selector-trigger"><List size={17} aria-hidden="true" /><strong>{selectedLabel}</strong><span>{label}</span><ChevronDown size={15} aria-hidden="true" /></div><nav className="board-selector-menu">{includeAll && <div className="board-favorite-row board-all-row">{option(ALL_BOARD_ID, <><List size={17} aria-hidden="true" /><span>전체글보기</span></>)}</div>}{favoriteBoards.length > 0 && <section className="board-favorites" aria-label="즐겨찾는 게시판"><div className="board-favorites-head"><Star aria-hidden="true" fill="currentColor" /><strong>즐겨찾는 게시판</strong></div>{favoriteBoards.map((board) => boardRow(board, "favorite"))}</section>}<div className="board-favorites-head board-all-head"><strong>{favoriteBoards.length ? "다른 게시판" : "모든 게시판"}</strong></div>{(favoriteBoards.length ? otherBoards : categories).map((board) => boardRow(board, "all"))}</nav></aside>;
}
