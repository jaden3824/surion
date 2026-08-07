"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Menu, Search, UserRound, Users, Wrench, X } from "lucide-react";
import { useState } from "react";
import type { AuthViewer } from "@/lib/auth/types";
import { BrandLogo } from "./brand-logo";

const nav = [
  { href: "/community", label: "전체글보기" },
  { href: "/community?status=resolved", label: "해결 완료" },
  { href: "/experts", label: "전문가 찾기" },
];

export function AppShell({ children, viewer }: { children: React.ReactNode; viewer: AuthViewer | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [headerQuery, setHeaderQuery] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const showAdminLink = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || viewer?.isAdmin === true;

  async function logout() {
    setLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("logout failed");
      window.location.assign("/");
    } catch {
      setLoggingOut(false);
      window.alert("로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  if (isAuthPage) {
    return (
      <>
        <a href="#main" className="skip-link">본문 바로가기</a>
        <main id="main" className="auth-shell">{children}</main>
      </>
    );
  }

  return (
    <>
      <a href="#main" className="skip-link">본문 바로가기</a>
      <header className="site-header">
        <div className="header-inner">
          <BrandLogo />
          <nav className="desktop-nav" aria-label="주요 메뉴">
            {nav.map((item, index) => { const active = index === 0 ? pathname.startsWith("/community") || pathname.startsWith("/category") : index > 1 && pathname.startsWith(item.href); return <Link key={item.href} className={active ? "active" : ""} href={item.href}>{item.label}</Link>; })}
          </nav>
          <form className="header-search" action="/search" method="get" role="search" onSubmit={(event) => { event.preventDefault(); const submittedQuery = String(new FormData(event.currentTarget).get("q") ?? headerQuery).trim(); if (submittedQuery) router.push(`/search?q=${encodeURIComponent(submittedQuery)}`); }}>
            <Search />
            <input name="q" value={headerQuery} onChange={(event) => setHeaderQuery(event.target.value)} placeholder="모델·증상 검색" aria-label="커뮤니티 검색" />
          </form>
          <div className="header-actions">
            {viewer ? (
              <>
                <Link className="button button-secondary header-login" href="/my/questions" aria-label={`${viewer.nickname}님의 마이페이지`}>
                  {viewer.avatarUrl ? <span className="header-user-avatar" style={{ backgroundImage: `url(${viewer.avatarUrl})` }} aria-hidden="true" /> : <UserRound size={17} />}{viewer.nickname}
                </Link>
                <button className="button button-quiet header-logout" type="button" onClick={logout} disabled={loggingOut}>
                  {loggingOut ? "로그아웃 중" : "로그아웃"}
                </button>
              </>
            ) : (
              <Link className="button button-secondary header-login" href="/login">로그인</Link>
            )}
            <Link className="button button-primary" href="/ask"><Wrench size={18} />글 올리기</Link>
            <button className="icon-button menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "메뉴 닫기" : "메뉴 열기"}>{open ? <X /> : <Menu />}</button>
          </div>
        </div>
        {open && <nav className="mobile-menu" aria-label="모바일 메뉴">{nav.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>)}{viewer ? <><Link href="/my/questions" onClick={() => setOpen(false)}>{viewer.nickname}님의 마이페이지</Link><button type="button" onClick={logout} disabled={loggingOut}>로그아웃</button></> : <Link href="/login" onClick={() => setOpen(false)}>로그인·회원가입</Link>}{showAdminLink && <Link href="/admin/users">관리자 데모</Link>}</nav>}
      </header>
      <main id="main">{children}</main>
      <nav className="bottom-nav" aria-label="모바일 하단 메뉴">
        <Link className={pathname === "/" ? "active" : ""} href="/"><Home /><span>홈</span></Link>
        <Link className={pathname.startsWith("/community") || pathname.startsWith("/category") || pathname.startsWith("/search") ? "active" : ""} href="/community"><Search /><span>전체글</span></Link>
        <Link className="bottom-ask" href="/ask"><Wrench /><span>글쓰기</span></Link>
        <Link className={pathname.startsWith("/experts") ? "active" : ""} href="/experts"><Users /><span>전문가</span></Link>
        <Link className={pathname.startsWith("/my") ? "active" : ""} href="/my/questions"><UserRound /><span>내 활동</span></Link>
      </nav>
      <footer className="site-footer">
        <div className="footer-inner">
          <div><BrandLogo compact /><p>고장 경험이 다음 사람의 해결책이 되는 곳.</p></div>
          <div className="footer-links"><Link href="/about">서비스 소개</Link><Link href="/safety">안전 가이드</Link><Link href="/terms">이용약관</Link><Link href="/privacy">개인정보처리방침</Link></div>
          <p className="footer-note">데모 MVP · 실제 결제와 정산은 제공하지 않습니다. 안전결제 준비 중</p>
        </div>
      </footer>
    </>
  );
}
