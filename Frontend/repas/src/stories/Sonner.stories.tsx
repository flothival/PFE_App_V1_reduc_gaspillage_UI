import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Toasts Sonner : utiliser `<Toaster />` de `sonner` ici (le wrapper `@/components/ui/sonner` dépend du ThemeProvider éditeur).
 */
const meta = {
  title: "UI/Sonner",
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => toast("Event has been created")}>
        Default Toast
      </Button>
      <Button variant="outline" onClick={() => toast.success("Successfully saved!")}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.error("Something went wrong")}>
        Error
      </Button>
      <Button variant="outline" onClick={() => toast.warning("Please be careful")}>
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast("Event created", {
            description: "Monday, January 3rd at 6:00pm",
            action: { label: "Undo", onClick: () => console.log("Undo") },
          })
        }
      >
        With Action
      </Button>
    </div>
  ),
};
