"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useSession, signOut } from "@/lib/auth-client";
import { setLocale } from "@/app/actions/set-locale";
import { LogOut, ChevronDown, User, KeyRound } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("navbar");
  const currentLocale = useLocale();

  if (pathname === "/login") return null;
  if (isPending || !session) return null;

  async function handleLogout() {
    await signOut();
    router.push("/login");
  }

  async function handleSwitchLocale(locale: "zh" | "ru") {
    if (locale === currentLocale) return;
    await setLocale(locale);
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {/* 中间留空给面包屑/页面标题,Phase 6b 再做 */}
      <div className="flex-1" />

      {/* Locale 切换 */}
      <div className="flex items-center gap-1 text-sm">
        <button
          onClick={() => handleSwitchLocale("zh")}
          className={cn(
            "px-2 py-0.5 rounded-sm transition-colors",
            currentLocale === "zh"
              ? "bg-muted text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          中
        </button>
        <span className="text-foreground-subtle">|</span>
        <button
          onClick={() => handleSwitchLocale("ru")}
          className={cn(
            "px-2 py-0.5 rounded-sm transition-colors",
            currentLocale === "ru"
              ? "bg-muted text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Ру
        </button>
      </div>

      <Separator orientation="vertical" className="mx-1 h-4" />

      {/* 用户菜单 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5">
            <User className="size-4" />
            <span className="text-sm">{session.user.name ?? t("userFallback")}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            {session.user.email ?? session.user.name}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/account/password">
              <KeyRound className="size-4" />
              {t("changePassword")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-danger-fg focus:text-danger-fg"
          >
            <LogOut className="size-4" />
            {t("logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}