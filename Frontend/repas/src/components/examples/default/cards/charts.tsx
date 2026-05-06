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
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Label, Pie, PieChart, XAxis } from "recharts";

const barChartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const barChartConfig = {
  desktop: { label: "Desktop", color: "var(--chart-1)" },
  mobile: { label: "Mobile", color: "var(--chart-2)" },
} satisfies ChartConfig;

const desktopTotal = barChartData.reduce((s, i) => s + i.desktop, 0);
const mobileTotal = barChartData.reduce((s, i) => s + i.mobile, 0);
const desktopDelta = Math.round(((desktopTotal - mobileTotal) / mobileTotal) * 100);
const desktopDeltaPrefix = desktopDelta > 0 ? "+" : "";

export function BarChartPreviewCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Traffic channels</CardTitle>
        <CardDescription className="line-clamp-2 text-sm leading-snug">
          Monthly desktop and mobile traffic for the last six months.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        <ChartContainer config={barChartConfig} className="max-h-[180px] w-full">
          <BarChart
            accessibilityLayer
            data={barChartData}
            margin={{ left: 0, right: 0, top: 8, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={8}
              axisLine={false}
              tickFormatter={(v) => String(v).slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="mobile" fill="var(--color-mobile)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
        <div className="grid w-full grid-cols-3 divide-x divide-border/60">
          <div className="px-2 text-center">
            <div className="text-[0.65rem] text-muted-foreground uppercase">Desktop</div>
            <div className="text-sm font-medium tabular-nums">{desktopTotal.toLocaleString()}</div>
          </div>
          <div className="px-2 text-center">
            <div className="text-[0.65rem] text-muted-foreground uppercase">Mobile</div>
            <div className="text-sm font-medium tabular-nums">{mobileTotal.toLocaleString()}</div>
          </div>
          <div className="px-2 text-center">
            <div className="text-[0.65rem] text-muted-foreground uppercase">Mix Delta</div>
            <div className="text-sm font-medium tabular-nums">
              {desktopDeltaPrefix}
              {desktopDelta}%
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">View report</Button>
      </CardFooter>
    </Card>
  );
}

const pieChartData = [
  { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  { browser: "firefox", visitors: 287, fill: "var(--color-firefox)" },
  { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
];

const pieChartConfig = {
  visitors: { label: "Visitors" },
  chrome: { label: "Chrome", color: "var(--chart-1)" },
  safari: { label: "Safari", color: "var(--chart-2)" },
  firefox: { label: "Firefox", color: "var(--chart-3)" },
  edge: { label: "Edge", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function PieChartPreviewCard() {
  const totalVisitors = pieChartData.reduce((s, i) => s + i.visitors, 0);
  const topBrowser = pieChartData.reduce((m, i) => (i.visitors > m.visitors ? i : m));
  const topShare = Math.round((topBrowser.visitors / totalVisitors) * 100);
  const topLabel =
    pieChartConfig[topBrowser.browser as keyof typeof pieChartConfig]?.label ?? "Top";

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle>Browser Share</CardTitle>
        <CardDescription>January - June 2026</CardDescription>
        <CardAction>
          <Badge variant="outline">{String(topLabel)}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={pieChartConfig} className="mx-auto aspect-square max-h-[190px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={pieChartData}
              dataKey="visitors"
              nameKey="browser"
              innerRadius={50}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy! - 8}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {totalVisitors.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 12}
                          className="fill-muted-foreground text-xs"
                        >
                          Visitors
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="browser" />} className="translate-y-2" />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-2">
        <div className="flex items-center text-xs">
          <span className="font-medium">{String(topLabel)}</span>
          <span className="ml-auto text-muted-foreground tabular-nums">{topShare}%</span>
        </div>
        <Progress value={topShare} className="**:data-[slot=progress-indicator]:bg-chart-3" />
      </CardFooter>
    </Card>
  );
}

const areaData = [
  { month: "January", visitors: 186 },
  { month: "February", visitors: 305 },
  { month: "March", visitors: 237 },
  { month: "April", visitors: 73 },
  { month: "May", visitors: 209 },
  { month: "June", visitors: 214 },
];

const areaConfig = {
  visitors: { label: "Visitors", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function AnalyticsPreviewCard() {
  return (
    <Card className="mx-auto w-full max-w-sm pb-0">
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>418.2K Visitors</span>
          <Badge>+10%</Badge>
        </div>
        <CardAction>
          <Button variant="outline" size="sm">
            View Analytics
          </Button>
        </CardAction>
      </CardHeader>
      <ChartContainer config={areaConfig} className="aspect-[1/0.35] w-full">
        <AreaChart accessibilityLayer data={areaData} margin={{ left: 0, right: 0 }}>
          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" hideLabel />} />
          <Area
            dataKey="visitors"
            type="linear"
            fill="var(--color-visitors)"
            fillOpacity={0.4}
            stroke="var(--color-visitors)"
          />
        </AreaChart>
      </ChartContainer>
    </Card>
  );
}

const visitorsData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 73 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 },
];

const visitorsConfig = {
  desktop: { label: "Desktop", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function VisitorsPreviewCard() {
  const latest = visitorsData[visitorsData.length - 1]?.desktop ?? 0;
  const prev = visitorsData[visitorsData.length - 2]?.desktop ?? latest;
  const trend = prev === 0 ? 0 : Math.round(((latest - prev) / prev) * 100);
  const prefix = trend > 0 ? "+" : "";

  return (
    <Card className="pb-0">
      <CardHeader>
        <CardTitle>Visitors</CardTitle>
        <CardDescription>Last 6 months</CardDescription>
        <CardAction>
          <Badge variant={trend >= 0 ? "secondary" : "destructive"}>
            {prefix}
            {trend}% vs last month
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        <ChartContainer config={visitorsConfig} className="h-48 w-full">
          <AreaChart accessibilityLayer data={visitorsData} margin={{ left: 0, right: 0, top: 6, bottom: 0 }}>
            <XAxis dataKey="month" tickLine={false} hide axisLine={false} tickMargin={6} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <Area
              dataKey="desktop"
              type="natural"
              fill="var(--color-desktop)"
              fillOpacity={0.15}
              stroke="var(--color-desktop)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
