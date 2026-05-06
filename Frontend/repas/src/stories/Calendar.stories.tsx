import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar } from "@/components/ui/calendar";
import * as React from "react";

/**
 * Le composant `Calendar` affiche un calendrier interactif basé sur react-day-picker.
 */
const meta: Meta<typeof Calendar> = {
  title: "UI/Calendar",
  component: Calendar,
};

export default meta;
type Story = StoryObj<typeof Calendar>;

export const Default: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border"
      />
    );
  },
};
