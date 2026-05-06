import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

/**
 * Le composant `Textarea` est une zone de texte multiligne.
 */
const meta: Meta<typeof Textarea> = {
  title: "UI/Textarea",
  component: Textarea,
  argTypes: {
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: "Type your message here." },
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="message">Your message</Label>
      <Textarea placeholder="Type your message here." id="message" />
    </div>
  ),
};

export const Disabled: Story = {
  args: { placeholder: "Disabled", disabled: true },
};
