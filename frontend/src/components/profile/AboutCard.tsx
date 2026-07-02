'use client';

import React, { useRef } from 'react';
import { ApiProfile } from '../../types/profile';
import { useProfileModal } from './ProfileModalContext';
import { 
  useResumes, 
  useUploadResume, 
  useSetPrimaryResume, 
  useDeleteResume,
  useParseResume
} from '../../hooks/use-profile';
import { profileService } from '../../services/profile.service';
import { ParsedResumeResult } from '../../types/profile';

interface AboutCardProps {
  profile: ApiProfile;
  onParseResume: (resumeId: string) => void;
  isParsing: string | null;
  isApplying: boolean;
}

export function AboutCard({ profile, onParseResume, isParsing, isApplying }: AboutCardProps) {
  const { openModal } = useProfileModal();
  
  const { data: resumeData, isLoading: isResumesLoading } = useResumes();
  const { mutate: uploadResume, isPending: isUploading } = useUploadResume();
  const { mutate: setPrimary, isPending: isSettingPrimary } = useSetPrimaryResume();
  const { mutate: deleteResume, isPending: isDeleting } = useDeleteResume();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadResume(e.target.files[0]);
    }
  };

  const handleDownload = (resumeId: string) => {
    window.open(profileService.getResumeDownloadUrl(resumeId), '_blank');
  };

  return (
    <div className="bg-card border border-line rounded-[16px] p-[26px_28px]">
      <div className="flex items-center justify-between mb-1.5">
        <p className="font-serif text-[19px] font-semibold text-ink m-0 flex items-center gap-[9px]">
          About
        </p>
      </div>

      <div className="flex items-center justify-between py-[13px] border-b border-line border-t-0 pt-0">
        <p className="text-[14px] leading-[1.6] text-text m-0">{profile.profile.bio || 'No bio set.'}</p>
      </div>

      <div className="flex items-center justify-between py-[13px] border-b border-line">
        <div>
          <p className="font-mono text-[12px] tracking-[0.03em] uppercase text-text-faint mb-[3px]">
            Target Role
          </p>
          <p className="text-[14.5px] font-medium text-text m-0">
            {profile.profile.role || 'Not set'}
          </p>
        </div>
        <button
          onClick={openModal}
          className="text-text-faint hover:text-harbor focus:outline-none focus:ring-2 focus:ring-harbor rounded px-1 -mx-1"
          aria-label="Edit Target Role"
        >
          ✎
        </button>
      </div>

      <div className="flex items-center justify-between py-[13px] border-b border-line">
        <div>
          <p className="font-mono text-[12px] tracking-[0.03em] uppercase text-text-faint mb-[3px]">
            Experience Level
          </p>
          <p className="text-[14.5px] font-medium text-text m-0 capitalize">
            {profile.profile.experienceLevel.toLowerCase()}
          </p>
        </div>
        <button
          onClick={openModal}
          className="text-text-faint hover:text-harbor focus:outline-none focus:ring-2 focus:ring-harbor rounded px-1 -mx-1"
          aria-label="Edit Experience Level"
        >
          ✎
        </button>
      </div>

      <div className="block py-[13px] border-b border-line">
        <p className="font-mono text-[12px] tracking-[0.03em] uppercase text-text-faint mb-[3px]">
          Topics Of Interest
        </p>
        <div className="flex flex-wrap gap-2 mt-1">
          {profile.topicsOfInterest.map((topic, index) => (
            <span
              key={index}
              className={`text-[12.5px] px-3 py-1.5 rounded-[20px] inline-flex items-center gap-1.5 font-medium bg-topic text-text-muted`}
            >
              <span className={`w-1.5 h-1.5 rounded-full bg-text-faint`} />
              {topic.topic.name}
            </span>
          ))}
          {profile.topicsOfInterest.length === 0 && (
            <p className="text-[13px] text-text-faint italic m-0">No topics added.</p>
          )}
        </div>
      </div>

      {/* Resumes Section */}
      <div className="block py-[13px] pb-0">
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-[12px] tracking-[0.03em] uppercase text-text-faint m-0">
            Resumes
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-[12px] font-semibold text-brass-deep hover:underline disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : '+ Upload Resume'}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileSelect}
          />
        </div>

        {isResumesLoading ? (
          <p className="text-[13px] text-text-faint italic m-0">Loading resumes...</p>
        ) : resumeData?.resumes?.length === 0 ? (
          <p className="text-[13px] text-text-faint italic m-0">No resumes uploaded.</p>
        ) : (
          <div className="flex flex-col gap-2 mt-2">
            {resumeData?.resumes?.map(resume => {
              const isPrimary = profile.resumePrimary?.id === resume.id;
              const isThisParsing = isParsing === resume.id && !isApplying;
              const isThisApplying = isParsing === resume.id && isApplying;
              const isAnyBusy = isSettingPrimary || isDeleting || isParsing !== null;

              return (
                <div key={resume.id} className="flex items-center justify-between p-3 rounded-[10px] border border-line bg-passport-light">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleDownload(resume.id)}
                        className="text-[13.5px] font-medium text-ink truncate hover:underline text-left cursor-pointer"
                      >
                        {resume.fileName}
                      </button>
                      {isPrimary && (
                        <span className="shrink-0 text-[10px] uppercase tracking-wider font-semibold bg-brass-tint text-brass-deep px-1.5 py-0.5 rounded-sm">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-[11.5px] text-text-faint m-0 mt-0.5">
                      {resume.fileType} • {(resume.fileSizeBytes / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <button
                      onClick={() => onParseResume(resume.id)}
                      disabled={isAnyBusy}
                      className="text-[11.5px] font-medium px-2 py-1 border border-line rounded hover:bg-card-hover disabled:opacity-50"
                    >
                      {isThisParsing ? (
                        <span className="flex items-center gap-1">
                          <div className="w-2.5 h-2.5 border-2 border-ink border-t-transparent rounded-full animate-spin" /> Parsing...
                        </span>
                      ) : isThisApplying ? (
                        <span className="flex items-center gap-1">
                          <div className="w-2.5 h-2.5 border-2 border-ink border-t-transparent rounded-full animate-spin" /> Applying...
                        </span>
                      ) : (
                        '✦ Parse Resume'
                      )}
                    </button>
                    {!isPrimary && (
                      <button
                        onClick={() => setPrimary(resume.id)}
                        disabled={isAnyBusy}
                        className="text-[11.5px] font-medium text-sea hover:underline disabled:opacity-50 ml-1"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      onClick={() => deleteResume(resume.id)}
                      disabled={isAnyBusy}
                      className="text-[11.5px] font-medium text-coral hover:underline disabled:opacity-50 ml-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
