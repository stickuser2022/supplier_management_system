"use client";

import { Users, Map } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { href: "/suppliers", labelKey: "suppliers", icon: Users },
  { href: "/map",       labelKey: "map",       icon: Map },
];

export function AppSidebar() {
  const { data: session, isPending } = useSession();
  const t = useTranslations("navbar");
  const pathname = usePathname();

  if (pathname === "/login") return null;
  if (isPending || !session) return null;

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 py-2 text-sm font-medium text-foreground">
          青格力供应商
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{t(item.labelKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}