import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ChevronRight, CircleDashed, Eye, MessageCircle, UserRound } from "lucide-react";
import type { CaseSummary } from "@surion/domain";

export function StatusBadge({ status }: { status: CaseSummary["status"] }) {
  return <ResolutionBadge status={status} />;
}

export function ResolutionBadge({ status }: { status: CaseSummary["status"] }) {
  const resolved = status === "RESOLVED";
  return <span className={`status resolution-status ${resolved ? "status-resolved" : "status-before"}`}>{resolved ? <CheckCircle2 aria-hidden="true" /> : <CircleDashed aria-hidden="true" />}{resolved ? "해결 완료" : "해결 전"}</span>;
}

export function RoleBadge({ children, tone = "user" }: { children: ReactNode; tone?: "user" | "expert" | "business" | "questioner" | "admin" }) {
  return <span className={`role role-${tone}`}>{children}</span>;
}

export function Avatar({ name, src, size = "md", className = "" }: { name: string; src?: string; size?: "xs" | "sm" | "md" | "lg" | "xl"; className?: string }) {
  return (
    <span className={`user-avatar user-avatar-${size} ${className}`} role="img" aria-label={src ? `${name} 프로필 사진` : `${name} 기본 프로필 이미지`}>
      {src ? (
        <Image src={src} alt="" width={160} height={160} unoptimized={src.startsWith("data:")} />
      ) : (
        <svg viewBox="0 0 64 64" focusable="false" aria-hidden="true">
          <circle cx="32" cy="32" r="32" fill="#e2e6eb" />
          <circle cx="32" cy="24" r="11" fill="#9aa2ad" />
          <path d="M10 61c1.8-14.4 10.5-23 22-23s20.2 8.6 22 23" fill="#9aa2ad" />
        </svg>
      )}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, description, href, linkLabel = "전체 보기" }: { eyebrow?: string; title: string; description?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="section-heading">
      <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2>{description && <p>{description}</p>}</div>
      {href && <Link className="text-link" href={href}>{linkLabel}<ChevronRight size={17} /></Link>}
    </div>
  );
}

export function CaseCard({ item, compact = false }: { item: CaseSummary; compact?: boolean }) {
  return (
    <article className={`case-card ${compact ? "case-card-compact" : ""}`}>
      <header className="case-card-author-row">
        <Avatar name={item.author} src={item.authorAvatarUrl} size="sm" />
        <div><strong>{item.author}</strong><span>{item.createdAt}</span></div>
        <ResolutionBadge status={item.status} />
      </header>
      <div className="case-card-context"><span>{item.category}</span><strong>{item.brand} · {item.model}</strong></div>
      <h3><Link href={`/cases/${item.id}`}>{item.title}</Link></h3>
      <p>{item.symptom}</p>
      <footer className="case-card-footer">
        <span><MessageCircle aria-hidden="true" />댓글 {item.comments}</span>
        <span><Eye aria-hidden="true" />조회 {item.views.toLocaleString()}</span>
        <span><UserRound aria-hidden="true" />같은 증상 {item.helpful}</span>
        <Link href={`/cases/${item.id}`} aria-label={`${item.title} 게시글 보기`}>게시글 보기<ChevronRight aria-hidden="true" /></Link>
      </footer>
    </article>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon">{icon}</span><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function Button({ className = "", variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return <button className={`button button-${variant} ${className}`} {...props} />;
}
