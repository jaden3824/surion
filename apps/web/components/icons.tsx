import {
  Camera,
  CookingPot,
  Drill,
  Gamepad2,
  Monitor,
  MoreHorizontal,
  Smartphone,
  Sparkles,
  Tv,
  Wind,
} from "lucide-react";

const icons = { Camera, CookingPot, Drill, Gamepad2, Monitor, MoreHorizontal, Smartphone, Sparkles, Tv, Wind };

export function CategoryIcon({ name, size = 22 }: { name: keyof typeof icons | string; size?: number }) {
  const Icon = icons[name as keyof typeof icons] ?? MoreHorizontal;
  return <Icon size={size} aria-hidden="true" />;
}
