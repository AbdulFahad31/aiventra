"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CaseSelector } from "@/components/case-selector";
import { PageSection } from "@/components/page-section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getApiError, getTimeline } from "@/lib/api";
import { mockTimeline } from "@/lib/mock-data";
import type { TimelineEvent } from "@/lib/types";
import { formatDate, getCurrentCaseId, setCurrentCaseId } from "@/lib/utils";

export default function TimelinePage() {
  const [caseId, setCaseId] = React.useState("");
  const [events, setEvents] = React.useState<TimelineEvent[]>([]);
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    const stored = getCurrentCaseId();
    if (stored) setCaseId(stored);
  }, []);

  React.useEffect(() => {
    if (!caseId) return;
    setCurrentCaseId(caseId);
    getTimeline(caseId)
      .then((data) => {
        setEvents(data.events.length ? data.events : mockTimeline.events);
        setMessage(data.events.length ? "" : "No backend events yet. Showing mock timeline.");
      })
      .catch((error) => {
        setMessage(`${getApiError(error)}. Showing mock timeline.`);
        setEvents(mockTimeline.events);
      });
  }, [caseId]);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageSection title="Timeline View" description="Chronological reconstruction from uploaded evidence.">
          <Card>
            <CardContent className="p-5">
              <div className="space-y-2">
                <Label>Case</Label>
                <CaseSelector value={caseId} onChange={setCaseId} />
              </div>
              {message ? <Badge className="mt-4" variant="yellow">{message}</Badge> : null}
            </CardContent>
          </Card>
        </PageSection>

        <Card>
          <CardContent className="p-5">
            <div className="relative space-y-6 border-l border-border pl-6">
              {events.map((event, index) => (
                <div key={`${event.timestamp}-${index}`} className="relative">
                  <div className="absolute -left-[31px] flex h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                  <div className="rounded-md border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">{formatDate(event.timestamp)}</p>
                      <Badge variant="secondary">{event.source}</Badge>
                      <Badge variant={event.severity === "high" ? "red" : event.severity === "medium" ? "yellow" : "green"}>
                        {event.severity}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{event.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
