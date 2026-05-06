import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slider } from "@/components/ui/slider";

/**
 * Le composant `Slider` permet la sélection d'une valeur sur une plage.
 */
const meta: Meta<typeof Slider> = {
  title: "UI/Slider",
  component: Slider,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultValue: [50],
    max: 100,
    step: 1,
    className: "w-[60%]",
  },
};
