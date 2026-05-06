import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Copy,
  Loader2,
  Minus,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Settings2,
  Share2,
  ShoppingBag,
  Trash2,
  type LucideIcon,
} from "lucide-react";

/** Même jeu que shadcn create (`icon-preview-grid`), entièrement en Lucide. */
const PREVIEW_LUCIDE_ICONS: { label: string; Icon: LucideIcon }[] = [
  { label: "Copy", Icon: Copy },
  { label: "CircleAlert", Icon: CircleAlert },
  { label: "Trash2", Icon: Trash2 },
  { label: "Share2", Icon: Share2 },
  { label: "ShoppingBag", Icon: ShoppingBag },
  { label: "MoreHorizontal", Icon: MoreHorizontal },
  { label: "Loader2", Icon: Loader2 },
  { label: "Plus", Icon: Plus },
  { label: "Minus", Icon: Minus },
  { label: "ArrowLeft", Icon: ArrowLeft },
  { label: "ArrowRight", Icon: ArrowRight },
  { label: "Check", Icon: Check },
  { label: "ChevronDown", Icon: ChevronDown },
  { label: "ChevronRight", Icon: ChevronRight },
  { label: "Search", Icon: Search },
  { label: "Settings", Icon: Settings },
];

const SWATCH_VARS = [
  "--background",
  "--foreground",
  "--primary",
  "--secondary",
  "--muted",
  "--accent",
  "--border",
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
] as const;

export function StyleOverviewCard() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-medium tracking-tight">
            Theme preview
          </div>
          <p className="line-clamp-2 text-base text-muted-foreground">
            Aperçu des couleurs et de la typographie du thème actif — comme sur
            shadcn/ui create.
          </p>
        </div>
        <div className="grid grid-cols-6 gap-3">
          {SWATCH_VARS.map((variant) => (
            <div
              key={variant}
              className="flex flex-col flex-wrap items-center gap-2"
            >
              <div
                className="relative aspect-square w-full rounded-lg after:absolute after:inset-0 after:rounded-lg after:border after:border-border after:mix-blend-darken dark:after:mix-blend-lighten"
                style={{ backgroundColor: `var(${variant})` }}
              />
              <div className="hidden max-w-14 truncate font-mono text-[0.6rem] md:block">
                {variant}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TypographySpecimenCard() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Sans · Serif · Mono
        </div>
        <p className="text-2xl font-medium tracking-tight">
          Designing with rhythm and hierarchy.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A strong body style keeps long-form content readable and balances the
          visual weight of headings.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Thoughtful spacing and cadence help paragraphs scan quickly without
          feeling dense.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          Sample Button
        </Button>
      </CardFooter>
    </Card>
  );
}

export function UIElementsCard() {
  const [sliderValue, setSliderValue] = React.useState([52]);

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Button>Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className="flex flex-wrap items-center gap-4 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Switch id="demo-switch" defaultChecked />
              <Label htmlFor="demo-switch">Notifications</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="demo-cb" defaultChecked />
              <Label htmlFor="demo-cb">Remember me</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Volume</Label>
            <Slider
              value={sliderValue}
              onValueChange={setSliderValue}
              max={100}
              step={1}
              className="w-full max-w-xs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="demo-input">Email</Label>
            <Input id="demo-input" type="email" placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="demo-ta">Message</Label>
            <Textarea id="demo-ta" placeholder="Type something…" rows={3} />
          </div>
          <RadioGroup defaultValue="a" className="flex gap-4">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="a" id="r1" />
              <Label htmlFor="r1">Option A</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="b" id="r2" />
              <Label htmlFor="r2">Option B</Label>
            </div>
          </RadioGroup>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="mr-2 size-4" />
                Options
                <MoreHorizontal className="ml-2 size-4 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                Open dialog
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm action</AlertDialogTitle>
                <AlertDialogDescription>
                  This is a sample alert dialog for the theme preview.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

const INVOICE_ITEMS = [
  { item: "Design System License", qty: 1, unitPrice: 499 },
  { item: "Priority Support", qty: 12, unitPrice: 99 },
  { item: "Custom Components", qty: 3, unitPrice: 250 },
] as const;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function InvoiceCard() {
  const subtotal = INVOICE_ITEMS.reduce((s, r) => s + r.qty * r.unitPrice, 0);
  const totalDue = subtotal;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice #INV-2847</CardTitle>
        <CardDescription>Due March 30, 2026</CardDescription>
        <CardAction>
          <Badge variant="secondary">Pending</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 font-medium">Item</th>
              <th className="pb-2 text-right font-medium">Qty</th>
              <th className="pb-2 text-right font-medium">Rate</th>
              <th className="pb-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {INVOICE_ITEMS.map((row) => (
              <tr key={row.item} className="border-b border-border/50">
                <td className="py-2">{row.item}</td>
                <td className="py-2 text-right tabular-nums">{row.qty}</td>
                <td className="py-2 text-right tabular-nums">
                  {formatCurrency(row.unitPrice)}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {formatCurrency(row.qty * row.unitPrice)}
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={3} className="pt-2 text-right font-medium">
                Total Due
              </td>
              <td className="pt-2 text-right tabular-nums font-medium">
                {formatCurrency(totalDue)}
              </td>
            </tr>
          </tbody>
        </table>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" size="sm">
          Download PDF
        </Button>
        <Button size="sm" className="ml-auto">
          Pay Now
        </Button>
      </CardFooter>
    </Card>
  );
}

export function SkeletonLoadingCard() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 animate-pulse rounded-full bg-muted" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

export function IconPreviewGridCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Icons</CardTitle>
        <CardDescription>Lucide React</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-8 place-items-center gap-4">
          {PREVIEW_LUCIDE_ICONS.map(({ label, Icon }) => (
            <Card
              key={label}
              title={label}
              className="ring-border flex size-8 shrink-0 items-center justify-center gap-0 rounded-md border-0 bg-card p-0 py-0 shadow-none ring *:[svg]:size-4"
            >
              <Icon className="text-muted-foreground" aria-hidden />
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function CodespacesPlaceholderCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Codespace</CardTitle>
        <CardDescription>Branche main · 2 vCPU</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
          Environment prêt — ouvre l&apos;éditeur pour continuer.
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Open in browser</Button>
      </CardFooter>
    </Card>
  );
}
