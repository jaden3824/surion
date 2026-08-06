import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, MessageCircle, Bookmark, Eye, ThumbsUp } from "lucide-react";
import type { CaseSummary } from "@surion/domain";
import { statusLabel } from "@/lib/demo-data";

export function StatusBadge({ status }: { status: CaseSummary["status"] }) {
  return <span className={`status status-${status.toLowerCase()}`}>{statusLabel[status]}</span>;
}

export function RoleBadge({ children, tone = "user" }: { children: ReactNode; tone?: "user" | "expert" | "business" | "questioner" | "admin" }) {
  return <span className={`role role-${tone}`}>{children}</span>;
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
      <Link href={`/cases/${item.id}`} aria-label={`${item.title} 상세 보기`} className="case-card-link">
        <div className="case-card-top">
          <span className="category-label">{item.category}</span>
          {item.status === "RESOLVED" && <StatusBadge status={item.status} />}
        </div>
        <h3>{item.title}</h3>
        {!compact && <p>{item.symptom}</p>}
        <div className="model-line"><strong>{item.brand}</strong><span>{item.model}</span></div>
        <div className="case-card-meta">
          <span>{item.author}</span><span>{item.createdAt}</span>
          <span><Eye size={14} />{item.views.toLocaleString()}</span>
          <span><MessageCircle size={14} />{item.comments}</span>
          <span><Bookmark size={14} />{item.saves}</span>
          <span><ThumbsUp size={14} />{item.helpful}</span>
        </div>
      </Link>
    </article>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon">{icon}</span><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function Button({ className = "", variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return <button className={`button button-${variant} ${className}`} {...props} />;
}
