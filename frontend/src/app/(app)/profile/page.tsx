'use client';

import React, { useState } from 'react';
import { ProfileModalProvider } from '@/components/profile/ProfileModalContext';
import { ProfilePassportHeader } from '@/components/profile/ProfilePassportHeader';
import { InstrumentPanel } from '@/components/ui/InstrumentPanel';
import { SkillCompass } from '@/components/profile/SkillCompass';
import { WaypointsCard } from '@/components/profile/WaypointsCard';
import { AboutCard } from '@/components/profile/AboutCard';
import { AccountSecurityCard } from '@/components/profile/AccountSecurityCard';
import { PlanUsageCard } from '@/components/profile/PlanUsageCard';
import { EditDetailsModal } from '@/components/profile/EditDetailsModal';
import { ResumeReviewModal } from '@/components/profile/ResumeReviewModal';
import { PageHeader } from '@/components/shell/PageHeader';
import { useProfile, useParseResume, useUpdateProfile, useReplaceTopics, profileKeys } from '@/hooks/use-profile';
import { useTopics } from '@/hooks/use-topics';
import { ParsedResumeResult } from '@/types/profile';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { data: profile, isLoading, isError, refetch } = useProfile();
  const queryClient = useQueryClient();
  const { data: allTopics = [] } = useTopics();
  
  const [parseResult, setParseResult] = useState<ParsedResumeResult | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [parsingResumeId, setParsingResumeId] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const { mutate: parseResume } = useParseResume();
  const { mutateAsync: updateProfile } = useUpdateProfile();
  const { mutateAsync: replaceTopics } = useReplaceTopics();

  const handleParseResume = async (resumeId: string) => {
    setParsingResumeId(resumeId);
    parseResume(resumeId, {
      onSuccess: async (result) => {
        setIsApplying(true);
        try {
          const ops: Promise<any>[] = [];

          const profilePayload: Record<string, any> = {};
          if (result.suggestions.role)            profilePayload.role = result.suggestions.role;
          if (result.suggestions.bio)             profilePayload.bio = result.suggestions.bio;
          if (result.suggestions.homePort)        profilePayload.homePort = result.suggestions.homePort;
          if (result.suggestions.experienceLevel) profilePayload.experienceLevel = result.suggestions.experienceLevel;
          if (Object.keys(profilePayload).length > 0) ops.push(updateProfile(profilePayload));

          const topicIds = result.suggestions.matchedTopics
            .map(name =>
              allTopics
                .find(t => t.name.toLowerCase() === name.toLowerCase())?.id
            )
            .filter((id): id is string => Boolean(id));
          if (topicIds.length > 0) ops.push(replaceTopics({ topicIds }));

          await Promise.all(ops);
          queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
          toast.success('Profile updated from resume');
        } catch (err: any) {
          toast.error(err.message ?? 'Failed to apply resume data');
        } finally {
          setIsApplying(false);
          setParsingResumeId(null);
        }
      },
      onError: () => setParsingResumeId(null)
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse flex flex-col gap-6">
        <div className="h-24 bg-card rounded-[16px] w-full" />
        <div className="h-32 bg-card rounded-[16px] w-full" />
        <div className="grid grid-cols-[1.65fr_1fr] gap-[22px]">
          <div className="h-[400px] bg-card rounded-[16px] w-full" />
          <div className="h-[400px] bg-card rounded-[16px] w-full" />
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-[16px] border border-line">
        <p className="text-coral mb-4">Failed to load profile data.</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <ProfileModalProvider>
      <PageHeader
        eyebrow="Profile · Crew Record"
        title="Your Voyage Profile"
        subtitle="Everything that's logged about you, and how far you've charted."
      />

      <ProfilePassportHeader profile={profile} />
          
      <InstrumentPanel 
        stats={{
          totalSessions: profile.stats.totalSessions,
          completed: profile.stats.completedSessions,
          avgScore: profile.stats.avgScore,
          aiUses: profile.stats.aiUsesThisMonth
        }} 
      />

      <div className="grid grid-cols-[1.65fr_1fr] gap-[22px] mt-6 items-start max-md:grid-cols-1">
        {/* LEFT COLUMN */}
        <div>
          <SkillCompass 
            topicsOfInterest={profile.topicsOfInterest} 
            stats={profile.stats} 
          />
          <WaypointsCard waypoints={profile.waypoints} />
        </div>

        {/* RIGHT COLUMN */}
        <div>
          <AboutCard 
            profile={profile} 
            onParseResume={handleParseResume}
            isParsing={parsingResumeId}
            isApplying={isApplying}
          />
          <AccountSecurityCard profile={profile} />
          <PlanUsageCard 
            planTier={profile.profile.planTier}
            aiUsesLimit={profile.profile.aiUsesLimit}
            aiUsesThisMonth={profile.stats.aiUsesThisMonth}
            currentPeriodStart={profile.profile.currentPeriodStart}
          />
        </div>
      </div>

      <EditDetailsModal profile={profile} />
      
      <ResumeReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => { setIsReviewModalOpen(false); setParseResult(null); }}
        result={parseResult}
        availableTopics={profile.topicsOfInterest.map(t => t.topic) ?? []}
      />
    </ProfileModalProvider>
  );
}
