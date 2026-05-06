import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Bar, BarChart } from "recharts";
import { Plus, Search, UploadCloud } from "lucide-react";

const sleepChartData = [
  { hour: "10pm", deep: 0, light: 30, rem: 0 },
  { hour: "11pm", deep: 20, light: 10, rem: 0 },
  { hour: "12am", deep: 40, light: 0, rem: 10 },
  { hour: "1am", deep: 30, light: 5, rem: 15 },
  { hour: "2am", deep: 10, light: 20, rem: 30 },
  { hour: "3am", deep: 25, light: 10, rem: 20 },
  { hour: "4am", deep: 15, light: 25, rem: 10 },
  { hour: "5am", deep: 5, light: 35, rem: 15 },
  { hour: "6am", deep: 0, light: 20, rem: 25 },
];

const sleepChartConfig = {
  deep: { label: "Deep", color: "var(--chart-1)" },
  light: { label: "Light", color: "var(--chart-2)" },
  rem: { label: "REM", color: "var(--chart-3)" },
} satisfies ChartConfig;

const FITNESS_WEEKLY_LOAD = [
  { day: "M", load: 84 },
  { day: "T", load: 52 },
  { day: "W", load: 73 },
  { day: "T", load: 66 },
  { day: "F", load: 91 },
  { day: "S", load: 48 },
  { day: "S", load: 61 },
];

const usageRows = [
  { name: "Edge Requests", value: "$1.83K", percentage: 67.34 },
  { name: "Fast Data Transfer", value: "$952.51", percentage: 52.18 },
  { name: "Monitoring data points", value: "$901.20", percentage: 89.42 },
  { name: "Web Analytics Events", value: "$603.71", percentage: 45.67 },
] as const;

const shortcuts = [
  { label: "Search", keys: ["⌘", "K"] },
  { label: "Quick Actions", keys: ["⌘", "J"] },
  { label: "New File", keys: ["⌘", "N"] },
  { label: "Save", keys: ["⌘", "S"] },
  { label: "Toggle Sidebar", keys: ["⌘", "B"] },
] as const;

function KbdLike({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded border px-1 font-mono text-[0.65rem] font-medium select-none">
      {children}
    </kbd>
  );
}

export function ObservabilityPreviewCard() {
  return (
    <Card className="relative w-full max-w-md overflow-hidden pt-0">
      <div className="absolute inset-0 z-30 aspect-video bg-primary opacity-50 mix-blend-color" />
      <img
        src="https://images.unsplash.com/photo-1604076850742-4c7221f3101b?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt=""
        className="relative z-20 aspect-video w-full object-cover brightness-60 grayscale"
      />
      <CardHeader>
        <CardTitle>Observability Plus is replacing Monitoring</CardTitle>
        <CardDescription>
          Switch to the improved way to explore your data, with natural language.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex-wrap gap-2">
        <Button>
          Create Query
          <Plus className="ml-2 size-4" />
        </Button>
        <Badge variant="secondary" className="ml-auto">
          Warning
        </Badge>
      </CardFooter>
    </Card>
  );
}

export function SleepReportCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sleep Report</CardTitle>
        <CardDescription>Last night · 7h 24m</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ChartContainer config={sleepChartConfig} className="h-32 w-full">
          <BarChart
            accessibilityLayer
            data={sleepChartData}
            margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
            barSize={16}
          >
            <Bar dataKey="deep" stackId="a" fill="var(--color-deep)" radius={0} />
            <Bar dataKey="light" stackId="a" fill="var(--color-light)" radius={0} />
            <Bar dataKey="rem" stackId="a" fill="var(--color-rem)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ChartContainer>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Deep", value: "2h 10m" },
            { label: "Light", value: "3h 48m" },
            { label: "REM", value: "1h 26m" },
            { label: "Score", value: "84" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-sm font-medium tabular-nums">{s.value}</div>
              <div className="text-muted-foreground text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Badge variant="outline">Good</Badge>
        <Button variant="outline" size="sm" className="ml-auto">
          Details
        </Button>
      </CardFooter>
    </Card>
  );
}

export function WeeklyFitnessSummaryCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Fitness Summary</CardTitle>
        <CardDescription>Calories and workout load by day</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-7 gap-1.5">
          {FITNESS_WEEKLY_LOAD.map((day, index) => (
            <div
              key={`${day.day}-${index}`}
              className="ring-border rounded-md p-1.5 text-center ring"
            >
              <div className="text-muted-foreground text-sm">{day.day}</div>
              <div className="relative mt-1 h-16 overflow-hidden rounded-sm bg-muted">
                <div
                  className="absolute inset-x-0 bottom-0 rounded-sm bg-chart-3"
                  style={{ height: `${day.load}%` } as React.CSSProperties}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">View details</Button>
      </CardFooter>
    </Card>
  );
}

export function FileUploadCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>File Upload</CardTitle>
        <CardDescription>Drag and drop or browse</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center">
          <div className="bg-background flex size-12 items-center justify-center rounded-lg border shadow-sm">
            <UploadCloud className="text-muted-foreground size-6" aria-hidden />
          </div>
          <div>
            <p className="font-medium">Upload files</p>
            <p className="text-muted-foreground mt-1 text-sm">PNG, JPG, PDF up to 10MB</p>
          </div>
          <Button type="button">Browse Files</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function UsagePreviewCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage</CardTitle>
        <CardDescription>Billing period · sample breakdown</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {usageRows.map((row) => (
          <div key={row.name} className="space-y-2">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate font-medium">{row.name}</span>
              <span className="text-muted-foreground shrink-0 tabular-nums">{row.value}</span>
            </div>
            <Progress value={row.percentage} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ShortcutsPreviewCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Shortcuts</CardTitle>
        <CardDescription>Keyboard shortcuts reference</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground flex flex-col gap-0">
          {shortcuts.map(({ label, keys }, i) => (
            <React.Fragment key={label}>
              {i > 0 && <Separator className="my-2" />}
              <div className="flex items-center justify-between gap-3 py-0.5 text-sm">
                <span className="font-normal">{label}</span>
                <div className="flex gap-1">
                  {keys.map((key) => (
                    <KbdLike key={key}>{key}</KbdLike>
                  ))}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AnomalyAlertCard() {
  return (
    <Card>
      <CardHeader className="text-center sm:text-left">
        <CardTitle>Get alerted for anomalies</CardTitle>
        <CardDescription>
          Automatically monitor your projects for anomalies and get notified.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center sm:justify-start">
        <Button>Upgrade to Observability Plus</Button>
      </CardContent>
    </Card>
  );
}

export function LiveWaveformPlaceholderCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Live waveform</CardTitle>
        <CardDescription>Audio levels — aperçu statique pour le thème</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="flex h-16 items-end justify-center gap-0.5 rounded-md border bg-muted/40 px-2 py-2"
          aria-hidden
        >
          {[
            12, 28, 18, 40, 22, 48, 20, 36, 14, 42, 24, 38, 16, 44, 26, 32, 18, 46, 20, 34, 22, 30,
          ].map((h, i) => (
            <div
              key={i}
              className="bg-primary/80 w-[3px] rounded-sm"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full">
          Start listening
        </Button>
      </CardFooter>
    </Card>
  );
}

export function NotFoundPreviewCard() {
  return (
    <Card>
      <CardHeader className="text-center sm:text-left">
        <CardTitle>404 — Not Found</CardTitle>
        <CardDescription className="max-w-md">
          The page you&apos;re looking for doesn&apos;t exist. Try searching for what you need below.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 sm:items-stretch">
        <div className="relative w-full max-w-md">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input placeholder="Try searching for pages..." className="pr-14 pl-9" />
          <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
            <KbdLike>/</KbdLike>
          </div>
        </div>
        <Button variant="link" className="self-center sm:self-start">
          Go to homepage
        </Button>
      </CardContent>
    </Card>
  );
}
