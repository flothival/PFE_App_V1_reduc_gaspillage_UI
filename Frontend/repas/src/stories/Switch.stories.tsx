import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

/**
 * Le composant `Switch` est un interrupteur on/off accessible.
 */
const meta: Meta<typeof Switch> = {
  title: "UI/Switch",
  component: Switch,
  argTypes: {
    disabled: { control: "boolean" },
    checked: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
};
