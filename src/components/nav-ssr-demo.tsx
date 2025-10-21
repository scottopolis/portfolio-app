'use client'

import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronDown, ChevronRight, StickyNote } from 'lucide-react'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarMenuAction,
} from '@/components/ui/sidebar'

const ssrDemoItems = [
  {
    title: 'SPA Mode',
    url: '/demo/start/ssr/spa-mode',
  },
  {
    title: 'Full SSR',
    url: '/demo/start/ssr/full-ssr',
  },
  {
    title: 'Data Only',
    url: '/demo/start/ssr/data-only',
  },
]

export function NavSSRDemo() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/demo/start/ssr">
                <StickyNote size={20} />
                <span>Start - SSR Demos</span>
              </Link>
            </SidebarMenuButton>
            <SidebarMenuAction onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </SidebarMenuAction>
          </SidebarMenuItem>
          {isExpanded && (
            <SidebarMenuSub>
              {ssrDemoItems.map((item) => (
                <SidebarMenuSubItem key={item.title}>
                  <SidebarMenuSubButton asChild>
                    <Link to={item.url}>
                      <StickyNote size={16} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
