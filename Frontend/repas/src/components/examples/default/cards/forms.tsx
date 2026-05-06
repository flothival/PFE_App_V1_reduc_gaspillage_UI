import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CheckCircle2, Copy, Plus } from "lucide-react";

export function EnvironmentVariablesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Environment Variables</CardTitle>
        <CardDescription>Production · 8 variables</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {[
          { key: "DATABASE_URL", masked: true },
          { key: "VITE_PUBLIC_API", masked: false },
          { key: "STRIPE_SECRET", masked: true },
        ].map((env) => (
          <div
            key={env.key}
            className="flex items-center gap-2 rounded-md px-2.5 py-2 font-mono text-xs ring ring-border"
          >
            <span className="font-medium">{env.key}</span>
            <span className="ml-auto text-muted-foreground">
              {env.masked ? "••••••••" : "https://api.example.com"}
            </span>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button variant="outline">Edit</Button>
        <Button className="ml-auto">Deploy</Button>
      </CardFooter>
    </Card>
  );
}

export function ShippingAddressCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping Address</CardTitle>
        <CardDescription>Where should we deliver?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ship-street">Street address</Label>
          <Input id="ship-street" placeholder="123 Main Street" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ship-apt">Apt / Suite</Label>
          <Input id="ship-apt" placeholder="Apt 4B" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="ship-city">City</Label>
            <Input id="ship-city" placeholder="San Francisco" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ship-state">State</Label>
            <Select defaultValue="CA">
              <SelectTrigger id="ship-state" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="CA">California</SelectItem>
                  <SelectItem value="NY">New York</SelectItem>
                  <SelectItem value="TX">Texas</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="ship-zip">ZIP Code</Label>
            <Input id="ship-zip" placeholder="94102" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ship-country">Country</Label>
            <Select defaultValue="US">
              <SelectTrigger id="ship-country" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="ship-save" defaultChecked />
          <Label htmlFor="ship-save" className="font-normal">
            Save as default address
          </Label>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm">
          Cancel
        </Button>
        <Button size="sm" className="ml-auto">
          Save Address
        </Button>
      </CardFooter>
    </Card>
  );
}

export function InviteTeamCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Team</CardTitle>
        <CardDescription>Add members to your workspace</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          {[
            { email: "alex@example.com", role: "editor" },
            { email: "sam@example.com", role: "viewer" },
          ].map((invite) => (
            <div key={invite.email} className="flex items-center gap-2">
              <Input defaultValue={invite.email} className="flex-1" />
              <Select defaultValue={invite.role}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectGroup>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <Button variant="outline" type="button">
          <Plus className="mr-2 size-4" />
          Add another
        </Button>
        <Separator />
        <div className="space-y-2">
          <Label htmlFor="invite-link">Or share invite link</Label>
          <div className="flex gap-2">
            <Input id="invite-link" readOnly defaultValue="https://app.co/invite/x8f2k" className="flex-1" />
            <Button type="button" size="icon" variant="outline" aria-label="Copy link">
              <Copy className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Send Invites</Button>
      </CardFooter>
    </Card>
  );
}

export function ActivateAgentCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ship faster with automation</CardTitle>
        <CardDescription>
          Preview des capacités — texte d&apos;exemple pour le thème.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
            <span>
              <strong className="text-foreground">Reviews</strong> avec contexte sur le codebase.
            </span>
          </li>
          <li className="flex gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
            <span>
              <strong className="text-foreground">Suggestions</strong> validées avant merge.
            </span>
          </li>
          <li className="flex gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
            <span>
              <strong className="text-foreground">Analyse</strong> des causes racines{" "}
              <Badge variant="secondary" className="ml-1">
                Plus
              </Badge>
            </span>
          </li>
        </ul>
        <Alert>
          <AlertDescription>Les équipes Pro bénéficient d&apos;un essai étendu.</AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Activer</Button>
      </CardFooter>
    </Card>
  );
}

export function NoTeamMembersCard() {
  return (
    <Card>
      <CardHeader className="text-center sm:text-left">
        <CardTitle>No team members</CardTitle>
        <CardDescription>Invite your team to collaborate on this project.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex min-h-44 flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-6 text-center">
          <AvatarGroup className="grayscale">
            <Avatar className="size-10">
              <AvatarImage src="https://github.com/shadcn.png" alt="" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar className="size-10">
              <AvatarImage src="https://github.com/vercel.png" alt="" />
              <AvatarFallback>VC</AvatarFallback>
            </Avatar>
            <Avatar className="size-10">
              <AvatarFallback>+</AvatarFallback>
            </Avatar>
          </AvatarGroup>
          <Button size="sm">Invite Members</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReportBugCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Bug</CardTitle>
        <CardDescription>Help us fix issues faster.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bug-title">Title</Label>
          <Input id="bug-title" placeholder="Brief description of the issue" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="bug-sev">Severity</Label>
            <Select defaultValue="medium">
              <SelectTrigger id="bug-sev" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bug-comp">Component</Label>
            <Select defaultValue="dashboard">
              <SelectTrigger id="bug-comp" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                  <SelectItem value="auth">Auth</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bug-steps">Steps to reproduce</Label>
          <Textarea
            id="bug-steps"
            placeholder={"1. Go to\n2. Click on\n3. Observe..."}
            className="min-h-24 resize-none"
          />
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline">Attach File</Button>
        <Button>Submit Bug</Button>
      </CardFooter>
    </Card>
  );
}

const usernames = ["shadcn", "vercel", "nextjs", "tailwindlabs", "typescript-lang", "eslint"] as const;

export function ContributorsCard() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Contributors <Badge variant="secondary">312</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {usernames.map((username) => (
            <Avatar key={username} className="grayscale">
              <AvatarImage src={`https://github.com/${username}.png`} alt="" />
              <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <a href="#preview" className="text-sm underline underline-offset-4">
          + 810 contributors
        </a>
      </CardFooter>
    </Card>
  );
}

export function FeedbackFormCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback</CardTitle>
        <CardDescription>Help us improve the product.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="feedback-form" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Select defaultValue="billing">
              <SelectTrigger id="topic" className="w-full">
                <SelectValue placeholder="Select a topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback</Label>
            <Textarea id="feedback" placeholder="Your feedback helps us improve..." />
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button type="submit" form="feedback-form">
          Submit
        </Button>
      </CardFooter>
    </Card>
  );
}

export function BookAppointmentCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Book Appointment</CardTitle>
        <CardDescription>Dr. Sarah Chen · Cardiology</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label>Available on March 18, 2026</Label>
          <ToggleGroup type="single" defaultValue="slot-0" spacing={2} variant="outline" className="flex flex-wrap justify-start">
            {["9:00 AM", "10:30 AM", "11:00 AM", "1:30 PM"].map((time, index) => (
              <ToggleGroupItem key={time} value={`slot-${index}`}>
                {time}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <Alert>
          <AlertTitle>New patient?</AlertTitle>
          <AlertDescription>Please arrive 15 minutes early.</AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Book Appointment</Button>
      </CardFooter>
    </Card>
  );
}

export function GithubProfileCard() {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Manage your profile information.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="profile" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="shadcn" />
            <p className="text-muted-foreground text-xs">
              Your name may appear where you contribute.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Public Email</Label>
            <Select defaultValue="m@shadcn.com">
              <SelectTrigger id="email" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="m@shadcn.com">m@shadcn.com</SelectItem>
                  <SelectItem value="m@gmail.com">m@gmail.com</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" placeholder="Tell us about yourself" className="min-h-20 resize-none" />
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button type="submit" form="profile" className="w-full">
          Save profile
        </Button>
      </CardFooter>
    </Card>
  );
}

export function ContributionsActivityCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contributions & Activity</CardTitle>
        <CardDescription>Manage your contributions and activity visibility.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="contributions-activity">
          <div className="flex gap-3">
            <Checkbox id="activity-private" />
            <div className="space-y-1">
              <Label htmlFor="activity-private" className="font-medium">
                Make profile private and hide activity
              </Label>
              <p className="text-muted-foreground text-sm">
                Hides contributions from your public profile and social features.
              </p>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button form="contributions-activity">Save Changes</Button>
      </CardFooter>
    </Card>
  );
}
