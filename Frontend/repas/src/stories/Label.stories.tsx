import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "@/components/ui/label";

/**
 * Le composant `Label` est un label accessible pour les champs de formulaire.
 */
const meta: Meta<typeof Label> = {
  title: "UI/Label",
  component: Label,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "Email address" },
};
