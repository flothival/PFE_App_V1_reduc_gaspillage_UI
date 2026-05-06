import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, ChevronRight } from "lucide-react";

/**
 * Le composant `Button` est le bouton principal du design system.
 * Il supporte plusieurs variantes visuelles et tailles.
 */
const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
      description: "Variante visuelle du bouton",
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
      description: "Taille du bouton",
    },
    asChild: {
      control: "boolean",
      description: "Utiliser un composant enfant comme élément racine (via Radix Slot)",
    },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "Button" },
};

export const Destructive: Story = {
  args: { children: "Delete", variant: "destructive" },
};

export const Outline: Story = {
  args: { children: "Outline", variant: "outline" },
};

export const Secondary: Story = {
  args: { children: "Secondary", variant: "secondary" },
};

export const Ghost: Story = {
  args: { children: "Ghost", variant: "ghost" },
};

export const Link: Story = {
  args: { children: "Link", variant: "link" },
};

export const Small: Story = {
  args: { children: "Small", size: "sm" },
};

export const Large: Story = {
  args: { children: "Large", size: "lg" },
};

export const WithIcon: Story = {
  render: () => (
    <Button>
      <Mail /> Login with Email
    </Button>
  ),
};

export const Loading: Story = {
  render: () => (
    <Button disabled>
      <Loader2 className="animate-spin" /> Please wait
    </Button>
  ),
};

export const IconOnly: Story = {
  args: { size: "icon", children: <ChevronRight /> },
};

export const Disabled: Story = {
  args: { children: "Disabled", disabled: true },
};

export const AllVariants: Story = {
  name: "All Variants",
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};
