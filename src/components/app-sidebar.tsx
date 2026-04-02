import * as React from 'react'
import { Link, useLocation } from 'wouter'
import { ChevronRightIcon, FolderIcon, SearchIcon } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import type { DayGroup, DirSection } from '@/hooks/use-plans'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar'

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  groups: DayGroup[]
  dirSections: DirSection[]
  hasMultipleDirs: boolean
  projectName: string
  loading: boolean
  error: string | null
  onOpenSearch: () => void
}

function DateGroupList({ groups, location }: { groups: DayGroup[]; location: string }) {
  return (
    <>
      {groups.map((group) => (
        <Collapsible
          key={group.date ?? 'undated'}
          defaultOpen
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton className="font-medium">
                {group.label}
                <ChevronRightIcon className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            {group.files.length > 0 && (
              <CollapsibleContent>
                <SidebarMenuSub>
                  {group.files.map((file) => (
                    <SidebarMenuSubItem key={file.slug}>
                      <SidebarMenuSubButton
                        className="h-auto min-h-7 py-1"
                        isActive={location === `/${file.slug}`}
                        render={<Link href={`/${file.slug}`} />}
                      >
                        {file.title}
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            )}
          </SidebarMenuItem>
        </Collapsible>
      ))}
    </>
  )
}

export function AppSidebar({
  groups,
  dirSections,
  hasMultipleDirs,
  projectName,
  loading,
  error,
  onOpenSearch,
  ...props
}: AppSidebarProps) {
  const [location] = useLocation()

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="p-2">
          <img src="/logo.svg" alt="Logo" className="size-8" />
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onOpenSearch}
              className="text-muted-foreground"
            >
              <SearchIcon className="size-4" />
              <span>Search</span>
              <kbd className="ml-auto pointer-events-none text-[10px] font-mono text-muted-foreground/60">
                <span className="text-[11px]">&#8984;</span>K
              </kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {loading ? (
          <SidebarGroup>
            <SidebarMenu>
              {Array.from({ length: 6 }).map((_, i) => (
                <SidebarMenuItem key={i}>
                  <SidebarMenuSkeleton />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ) : error ? (
          <SidebarGroup>
            <p className="px-2 pt-4 text-xs text-destructive">{error}</p>
          </SidebarGroup>
        ) : groups.length === 0 ? (
          <SidebarGroup>
            <p className="px-2 pt-4 text-xs text-muted-foreground">
              No plan files found
            </p>
          </SidebarGroup>
        ) : hasMultipleDirs ? (
          // Multi-directory mode: show each dir as a collapsible section
          dirSections.map((section) => (
            <SidebarGroup key={section.dirLabel}>
              <Collapsible defaultOpen className="group/dir">
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center gap-1.5">
                    <FolderIcon className="size-3.5" />
                    {section.dirLabel}
                    <ChevronRightIcon className="ml-auto size-3.5 transition-transform group-data-[state=open]/dir:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarMenu>
                    <DateGroupList groups={section.groups} location={location} />
                  </SidebarMenu>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          ))
        ) : (
          // Single directory mode: flat date groups
          <SidebarGroup>
            <SidebarMenu>
              <DateGroupList groups={groups} location={location} />
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <ThemeToggle />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
