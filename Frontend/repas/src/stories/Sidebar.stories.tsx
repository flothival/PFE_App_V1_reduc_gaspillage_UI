import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  SidebarProvider, Sidebar, SidebarContent, SidebarGroup,
  SidebarGroupLabel, SidebarGroupContent, SidebarMenu,
  SidebarMenuItem, SidebarMenuButton, SidebarHeader, SidebarFooter,
  SidebarTrigger, SidebarInset,
} from "@/components/ui/sidebar";
import { Home, Inbox, Calendar, Search, Settings } from "lucide-react";

/**
 * Le composant `Sidebar` est une barre latérale de navigation complète.
 */
const meta: Meta<typeof Sidebar> = {
  title: "UI/Sidebar",
  component: Sidebar,
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

const items = [
  { title: "Home", icon: Home },
  { title: "Inbox", icon: Inbox },
  { title: "Calendar", icon: Calendar },
  { title: "Search", icon: Search },
  { title: "Settings", icon: Settings },
];

export const Default: Story = {
  render: () => (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1">
            <span className="font-semibold">My App</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="px-2 py-1 text-xs text-muted-foreground">v1.0.0</div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="font-semibold">Dashboard</span>
        </header>
        <div className="p-4">
          <p>Main content area</p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  ),
};
