import type { CaseSummary } from "@surion/domain";
import { categories } from "@/lib/demo-data";

export const ALL_BOARD_ID = "all";
export type BoardId = string;

export function getBoardById(id?: string | null) {
  return categories.find((board) => board.id === id);
}

export function getBoardIdByName(name?: string | null) {
  return categories.find((board) => board.name === name)?.id;
}

export function normalizeBoardId(id?: string | null, includeAll = true): BoardId {
  if (includeAll && (!id || id === ALL_BOARD_ID)) return ALL_BOARD_ID;
  return getBoardById(id) ? String(id) : includeAll ? ALL_BOARD_ID : "";
}

export function filterCasesByBoard(items: CaseSummary[], boardId: BoardId) {
  const board = getBoardById(boardId);
  return board ? items.filter((item) => item.category === board.name) : items;
}

export function boardHref(base: "/community" | "/search" | "/ask", boardId: BoardId, current?: URLSearchParams) {
  const params = new URLSearchParams(current?.toString());
  if (boardId === ALL_BOARD_ID) params.delete("board");
  else params.set("board", boardId);
  if (base === "/ask") params.delete("q");
  const query = params.toString();
  return `${base}${query ? `?${query}` : ""}`;
}
