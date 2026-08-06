"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Home, Menu, Search, UserRound, Users, Wrench, X } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "./brand-logo";

const nav = [
  { href: "/search", label: "커뮤니티" },
  { href: "/search?status=RESOLVED", label: "해결 사례" },
  { href: "/experts", label: "전문가" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [headerQuery, setHeaderQuery] = useState("");

  return (
    <>
      <a href="#main" className="skip-link">본문 바로가기</a>
      <header className="site-header">
        <div className="header-inner">
          <BrandLogo />
          <nav className="desktop-nav" aria-label="주요 메뉴">
            {nav.map((item) => <Link key={item.href} className={pathname.startsWith(item.href) ? "active" : ""} href={item.href}>{item.label}</Link>)}
          </nav>
          <form className="header-search" role="search" onSubmit={(event) => { event.preventDefault(); if (headerQuery.trim()) router.push(`/search?q=${encodeURIComponent(headerQuery.trim())}`); }}>
            <Search />
            <input value={headerQuery} onChange={(event) => setHeaderQuery(event.target.value)} placeholder="모델·증상 검색" aria-label="커뮤니티 검색" />
          </form>
          <div className="header-actions">
            <Link className="icon-button" href="/notifications" aria-label="알림"><Bell size={20} /><span className="notification-dot">3</span></Link>
            <Link className="button button-secondary header-login" href="/login">로그인</Link>
            <Link className="button button-primary" href="/ask"><Wrench size={18} />질문하기</Link>
            <button className="icon-button menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="메뉴 열기">{open ? <X /> : <Menu />}</button>
          </div>
        </div>
        {open && <nav className="mobile-menu" aria-label="모바일 메뉴">{nav.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>)}<Link href="/my/questions">마이페이지</Link><Link href="/admin/users">관리자 데모</Link></nav>}
      </header>
      <main id="main">{children}</main>
      <nav className="bottom-nav" aria-label="모바일 하단 메뉴">
        <Link className={pathname === "/" ? "active" : ""} href="/"><Home /><span>홈</span></Link>
        <Link className={pathname.startsWith("/search") ? "active" : ""} href="/search"><Search /><span>검색</span></Link>
        <Link className="bottom-ask" href="/ask"><Wrench /><span>질문</span></Link>
        <Link className={pathname.startsWith("/experts") ? "active" : ""} href="/experts"><Users /><span>전문가</span></Link>
        <Link className={pathname.startsWith("/my") ? "active" : ""} href="/my/questions"><UserRound /><span>MY</span></Link>
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
