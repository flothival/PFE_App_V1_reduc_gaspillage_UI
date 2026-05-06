import {
  CodespacesPlaceholderCard,
  IconPreviewGridCard,
  InvoiceCard,
  SkeletonLoadingCard,
  StyleOverviewCard,
  TypographySpecimenCard,
  UIElementsCard,
} from "./cards/basics";
import {
  AnalyticsPreviewCard,
  BarChartPreviewCard,
  PieChartPreviewCard,
  VisitorsPreviewCard,
} from "./cards/charts";
import {
  ActivateAgentCard,
  BookAppointmentCard,
  ContributionsActivityCard,
  ContributorsCard,
  EnvironmentVariablesCard,
  FeedbackFormCard,
  GithubProfileCard,
  InviteTeamCard,
  NoTeamMembersCard,
  ReportBugCard,
  ShippingAddressCard,
} from "./cards/forms";
import {
  AnomalyAlertCard,
  FileUploadCard,
  LiveWaveformPlaceholderCard,
  NotFoundPreviewCard,
  ObservabilityPreviewCard,
  ShortcutsPreviewCard,
  SleepReportCard,
  UsagePreviewCard,
  WeeklyFitnessSummaryCard,
} from "./cards/misc";


export default function DefaultCreatePreview() {
  return (
    <div className="flex min-w-max justify-center bg-muted">
      <div
        className="grid w-[2400px] grid-cols-7 items-start gap-4 p-2 md:w-[3000px] md:gap-8 md:p-4 *:flex *:flex-col *:gap-4"
        data-slot="capture-target"
      >
          <div className="p-px [contain-intrinsic-size:380px_1200px] [content-visibility:auto]">
            <StyleOverviewCard />
            <TypographySpecimenCard />
            <div className="md:hidden">
              <UIElementsCard />
            </div>
            <CodespacesPlaceholderCard />
            <InvoiceCard />
          </div>
          <div className="p-px [contain-intrinsic-size:380px_1200px] [content-visibility:auto]">
            <IconPreviewGridCard />
            <div className="hidden w-full md:flex">
              <UIElementsCard />
            </div>
            <ObservabilityPreviewCard />
            <ShippingAddressCard />
          </div>
          <div className="p-px [contain-intrinsic-size:380px_1200px] [content-visibility:auto]">
            <EnvironmentVariablesCard />
            <BarChartPreviewCard />
            <InviteTeamCard />
            <ActivateAgentCard />
          </div>
          <div className="p-px [contain-intrinsic-size:380px_1200px] [content-visibility:auto]">
            <SkeletonLoadingCard />
            <PieChartPreviewCard />
            <NoTeamMembersCard />
            <ReportBugCard />
            <ContributorsCard />
          </div>
          <div className="p-px [contain-intrinsic-size:380px_1200px] [content-visibility:auto]">
            <FeedbackFormCard />
            <BookAppointmentCard />
            <SleepReportCard />
            <GithubProfileCard />
          </div>
          <div className="p-px [contain-intrinsic-size:380px_1200px] [content-visibility:auto]">
            <WeeklyFitnessSummaryCard />
            <FileUploadCard />
            <AnalyticsPreviewCard />
            <UsagePreviewCard />
            <ShortcutsPreviewCard />
          </div>
          <div className="p-px [contain-intrinsic-size:380px_1200px] [content-visibility:auto]">
            <AnomalyAlertCard />
            <LiveWaveformPlaceholderCard />
            <VisitorsPreviewCard />
            <ContributionsActivityCard />
            <NotFoundPreviewCard />
          </div>
        </div>
    </div>
  );
}
