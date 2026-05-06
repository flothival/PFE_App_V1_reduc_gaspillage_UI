import type { Meta, StoryObj } from "@storybook/react-vite";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";

/**
 * Le composant `Toast` affiche des notifications temporaires (Radix UI).
 */
const meta = {
  title: "UI/Toast",
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

function ToastDemo() {
  const { toast } = useToast();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() =>
          toast({
            title: "Scheduled: Catch up",
            description: "Friday, February 10, 2023 at 5:57 PM",
          })
        }
      >
        Show Toast
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem with your request.",
          })
        }
      >
        Destructive Toast
      </Button>
    </div>
  );
}

export const Default: Story = {
  render: () => <ToastDemo />,
};
