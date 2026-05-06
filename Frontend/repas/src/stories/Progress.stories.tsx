import type { Meta, StoryObj } from "@storybook/react-vite";
import { Progress } from "@/components/ui/progress";

/**
 * Le composant `Progress` affiche une barre de progression.
 */
const meta: Meta<typeof Progress> = {
  title: "UI/Progress",
  component: Progress,
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100 } },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: 60 },
};

export const Empty: Story = {
  args: { value: 0 },
};

export const Full: Story = {
  args: { value: 100 },
};
