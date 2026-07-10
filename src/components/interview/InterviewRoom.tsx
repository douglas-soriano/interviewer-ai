"use client";

import { useState } from "react";
import { mockPanel, mockTurns } from "@/mock/interviewData";
import { InterviewChat } from "./InterviewChat";
import { InterviewHeader } from "./InterviewHeader";
import { InterviewSidebar } from "./InterviewSidebar";
import { RecordControl } from "./RecordControl";

const jobTitle = "Senior Backend Engineer";
const jobDescription =
  "Own APIs, data modeling, reliability work, and the trade-offs behind production systems.";

export function InterviewRoom() {
  const [analyticsVisible, setAnalyticsVisible] = useState(false);

  return (
    <div className="app-shell">
      <InterviewHeader
        jobTitle={jobTitle}
        analyticsVisible={analyticsVisible}
        onAnalyticsChange={setAnalyticsVisible}
      />
      <main className="grid h-[calc(100dvh-var(--interview-header-height))] min-h-[620px] overflow-hidden min-[1180px]:grid-cols-[minmax(0,1fr)_var(--interview-sidebar-width)]">
        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          <InterviewChat
            turns={mockTurns}
            interviewerName="Dana"
            jobTitle={jobTitle}
            jobDescription={jobDescription}
            analyticsVisible={analyticsVisible}
          />
          <RecordControl />
        </section>

        <div className="hidden min-[1180px]:block">
          <InterviewSidebar
            analyticsVisible={analyticsVisible}
            panel={mockPanel}
            jobDescription={jobDescription}
          />
        </div>
      </main>
    </div>
  );
}
