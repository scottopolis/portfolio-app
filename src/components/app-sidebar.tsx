import * as React from 'react'
import { Link } from '@tanstack/react-router'
import {
  Database,
  Home,
  Network,
  SquareFunction,
  StickyNote,
} from 'lucide-react'

import { NavMain } from '@/components/nav-main'
import { NavSSRDemo } from '@/components/nav-ssr-demo'
import { UserSelector } from '@/components/user/user-selector'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/',
      icon: Home,
    },
    {
      title: 'Start - Server Functions',
      url: '/demo/start/server-funcs',
      icon: SquareFunction,
    },
    {
      title: 'Start - API Request',
      url: '/demo/start/api-request',
      icon: Network,
    },
  ],
  navDemo: [
    {
      title: 'Neon',
      url: '/demo/neon',
      icon: Database,
    },
    {
      title: 'TanStack Query',
      url: '/demo/tanstack-query',
      icon: Network,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/">
                <strong>Finance</strong>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSSRDemo />
        <NavMain items={data.navDemo} />
      </SidebarContent>
      <SidebarFooter>
        <UserSelector compact />
      </SidebarFooter>
    </Sidebar>
  )
}
