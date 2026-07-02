'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ParsedResumeResult, UpdateProfileDto } from '../../types/profile';
import { profileService } from '../../services/profile.service';
import { profileKeys } from '../../hooks/use-profile';
import { DocumentCard } from '../ui/DocumentCard';
import { Button } from '../ui/button';
import { LedgerField, LedgerInput, LedgerTextarea, LedgerSelect } from '../ui/LedgerField';
import { Chip } from '../ui/Chip';
import { CloseIcon } from '../ui/icons';

interface ResumeReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ParsedResumeResult | null;
  availableTopics: Array<{ id: string; name: string }>;
}

export function ResumeReviewModal({ isOpen, onClose, result, availableTopics }: ResumeReviewModalProps) {
  const queryClient = useQueryClient();
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const [isApplying, setIsApplying] = useState(false);

  // Field states
  const [fields, setFields] = useState({
    role: { checked: true, value: '' },
    bio: { checked: true, value: '' },
    homePort: { checked: true, value: '' },
    experienceLevel: { checked: true, value: 'INTERMEDIATE' as any },
    topics: { checked: true, values: [] as string[] }
  });

  // Collapsible section states
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    if (result) {
      const { suggestions } = result;
      setFields({
        role: { checked: !!suggestions.role, value: suggestions.role || '' },
        bio: { checked: !!suggestions.bio, value: suggestions.bio || '' },
        homePort: { checked: !!suggestions.homePort, value: suggestions.homePort || '' },
        experienceLevel: { checked: true, value: suggestions.experienceLevel || 'INTERMEDIATE' },
        topics: { checked: suggestions.matchedTopics?.length > 0, values: suggestions.matchedTopics || [] }
      });
    }
  }, [result]);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isApplying) {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        if (triggerRef.current) {
          triggerRef.current.focus();
        }
      };
    }
  }, [isOpen, isApplying, onClose]);

  if (!isOpen || !result) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isApplying) {
      onClose();
    }
  };

  const handleApply = async () => {
    try {
      setIsApplying(true);
      const updateProfilePayload: UpdateProfileDto = {};
      if (fields.role.checked && fields.role.value) updateProfilePayload.role = fields.role.value;
      if (fields.bio.checked && fields.bio.value) updateProfilePayload.bio = fields.bio.value;
      if (fields.homePort.checked && fields.homePort.value) updateProfilePayload.homePort = fields.homePort.value;
      if (fields.experienceLevel.checked) updateProfilePayload.experienceLevel = fields.experienceLevel.value;

      const ops = [];
      if (Object.keys(updateProfilePayload).length > 0) {
        ops.push(profileService.updateProfile(updateProfilePayload));
      }

      if (fields.topics.checked && fields.topics.values.length > 0) {
        const topicIds = fields.topics.values
          .map(name => availableTopics.find(t => t.name === name)?.id)
          .filter(Boolean) as string[];
        
        if (topicIds.length > 0) {
          ops.push(profileService.replaceTopics({ topicIds }));
        }
      }

      await Promise.all(ops);
      
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
      toast.success('Profile updated from resume');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to apply changes');
    } finally {
      setIsApplying(false);
    }
  };

  const toggleTopic = (name: string) => {
    setFields(prev => ({
      ...prev,
      topics: {
        ...prev.topics,
        values: prev.topics.values.includes(name)
          ? prev.topics.values.filter(n => n !== name)
          : [...prev.topics.values, name]
      }
    }));
  };

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div
      className="fixed inset-0 z-60 bg-[rgba(22,27,51,0.55)] flex items-center justify-center p-6 opacity-100 pointer-events-auto transition-opacity duration-150 ease-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-[600px] max-h-[86vh] overflow-y-auto transform translate-y-0 transition-transform duration-200 ease-in outline-none"
        tabIndex={-1}
      >
        <DocumentCard className="overflow-visible">
          <div className="sticky top-0 bg-passport z-10 flex items-center justify-between px-[26px] py-[14px] border-b border-dashed border-line-strong rounded-t-[14px]">
            <span className="font-mono text-[11px] tracking-[0.1em] text-brass-deep uppercase">
              Amend Voyage Log · Parsed from CV
            </span>
            <button
              onClick={onClose}
              disabled={isApplying}
              className="w-[26px] h-[26px] rounded-full border border-dashed border-brass bg-transparent text-brass-deep font-mono text-[12px] cursor-pointer flex items-center justify-center -rotate-[2deg] hover:bg-brass-tint focus:outline-none focus:ring-2 focus:ring-brass focus:ring-offset-1 disabled:opacity-50"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="px-[30px] pt-[22px] pb-4 max-sm:px-5">
            <h2 className="font-serif text-[21px] font-semibold text-ink m-0">
              Review Extracted Details
            </h2>
            <p className="text-[13px] text-text-muted mt-[5px] mb-0">
              We found these in your resume. Select what you'd like to apply to your profile — you can edit before saving.
            </p>
          </div>

          <div className="px-[30px] flex flex-col gap-[18px] max-sm:px-5">
            <p className="font-mono text-[11px] tracking-wider uppercase text-text-faint m-0">
              Profile Suggestions
            </p>

            <div className="flex flex-col gap-4">
              {/* Role */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="chk-role"
                  checked={fields.role.checked}
                  onChange={(e) => setFields({ ...fields, role: { ...fields.role, checked: e.target.checked } })}
                  disabled={!result.suggestions.role}
                  className="mt-[14px]"
                />
                <div className="flex-1">
                  <LedgerField label="Role">
                    <LedgerInput
                      value={fields.role.value}
                      onChange={(e) => setFields({ ...fields, role: { ...fields.role, value: e.target.value } })}
                      disabled={!fields.role.checked}
                    />
                  </LedgerField>
                </div>
              </div>

              {/* Bio */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="chk-bio"
                  checked={fields.bio.checked}
                  onChange={(e) => setFields({ ...fields, bio: { ...fields.bio, checked: e.target.checked } })}
                  disabled={!result.suggestions.bio}
                  className="mt-[14px]"
                />
                <div className="flex-1">
                  <LedgerField label="Bio">
                    <LedgerTextarea
                      value={fields.bio.value}
                      onChange={(e) => setFields({ ...fields, bio: { ...fields.bio, value: e.target.value } })}
                      disabled={!fields.bio.checked}
                    />
                  </LedgerField>
                </div>
              </div>

              {/* Home Port */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="chk-homePort"
                  checked={fields.homePort.checked}
                  onChange={(e) => setFields({ ...fields, homePort: { ...fields.homePort, checked: e.target.checked } })}
                  disabled={!result.suggestions.homePort}
                  className="mt-[14px]"
                />
                <div className="flex-1">
                  <LedgerField label="Home Port">
                    <LedgerInput
                      value={fields.homePort.value}
                      onChange={(e) => setFields({ ...fields, homePort: { ...fields.homePort, value: e.target.value } })}
                      disabled={!fields.homePort.checked}
                    />
                  </LedgerField>
                </div>
              </div>

              {/* Experience Level */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="chk-level"
                  checked={fields.experienceLevel.checked}
                  onChange={(e) => setFields({ ...fields, experienceLevel: { ...fields.experienceLevel, checked: e.target.checked } })}
                  className="mt-[14px]"
                />
                <div className="flex-1">
                  <LedgerField label="Experience Level">
                    <LedgerSelect
                      value={fields.experienceLevel.value}
                      onChange={(e) => setFields({ ...fields, experienceLevel: { ...fields.experienceLevel, value: e.target.value as any } })}
                      disabled={!fields.experienceLevel.checked}
                    >
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                      <option value="EXPERT">Expert</option>
                    </LedgerSelect>
                  </LedgerField>
                </div>
              </div>

              {/* Topics */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="chk-topics"
                  checked={fields.topics.checked}
                  onChange={(e) => setFields({ ...fields, topics: { ...fields.topics, checked: e.target.checked } })}
                  disabled={result.suggestions.matchedTopics.length === 0}
                  className="mt-2"
                />
                <div className="flex-1">
                  <p className="font-mono text-[12px] uppercase text-text-faint mb-2">Topics ({result.suggestions.matchedTopics.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {result.suggestions.matchedTopics.length > 0 ? (
                      result.suggestions.matchedTopics.map(topicName => (
                        <Chip
                          key={topicName}
                          selected={fields.topics.values.includes(topicName)}
                          onClick={() => fields.topics.checked && toggleTopic(topicName)}
                        >
                          {topicName}
                        </Chip>
                      ))
                    ) : (
                      <span className="text-[13px] text-text-faint italic">No topics matched</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-t border-dashed border-line my-2" />

            <div className="flex flex-col gap-2 mb-2">
              <p className="text-[12px] text-text-faint mb-1">
                These sections are stored on your resume record for reference but are not applied to your profile fields.
              </p>

              {/* Education */}
              <div>
                <button
                  aria-expanded={openSection === 'education'}
                  onClick={() => toggleSection('education')}
                  className="flex items-center text-[14px] font-medium text-ink w-full text-left"
                >
                  <span className="w-4 mr-1">{openSection === 'education' ? '▾' : '▸'}</span>
                  Education ({result.parsed.education?.length || 0})
                </button>
                {openSection === 'education' && (
                  <div className="mt-2 bg-parchment border border-dashed border-line-strong rounded-lg p-3 flex flex-col gap-3">
                    {!result.parsed.education || result.parsed.education.length === 0 ? (
                      <span className="text-[13px] text-text-faint italic">No education entries found</span>
                    ) : (
                      result.parsed.education.map((edu, idx) => (
                        <div key={idx}>
                          <p className="text-[13.5px] font-semibold text-ink m-0">{edu.institution}</p>
                          <p className="text-[12px] font-mono text-text-faint mt-0.5 mb-1">{edu.startYear} - {edu.endYear}</p>
                          <p className="text-[13px] text-text m-0">{edu.degree} {edu.field ? `in ${edu.field}` : ''}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Experience */}
              <div>
                <button
                  aria-expanded={openSection === 'experience'}
                  onClick={() => toggleSection('experience')}
                  className="flex items-center text-[14px] font-medium text-ink w-full text-left"
                >
                  <span className="w-4 mr-1">{openSection === 'experience' ? '▾' : '▸'}</span>
                  Experience ({result.parsed.experience?.length || 0})
                </button>
                {openSection === 'experience' && (
                  <div className="mt-2 bg-parchment border border-dashed border-line-strong rounded-lg p-3 flex flex-col gap-3">
                    {!result.parsed.experience || result.parsed.experience.length === 0 ? (
                      <span className="text-[13px] text-text-faint italic">No experience entries found</span>
                    ) : (
                      result.parsed.experience.map((exp, idx) => (
                        <div key={idx}>
                          <p className="text-[13.5px] font-semibold text-ink m-0">{exp.company}</p>
                          <p className="text-[12px] font-mono text-text-faint mt-0.5 mb-1">{exp.startDate} - {exp.endDate}</p>
                          <p className="text-[13.5px] font-medium text-ink m-0">{exp.title}</p>
                          {exp.summary && <p className="text-[13px] text-text mt-1 mb-0">{exp.summary}</p>}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Projects */}
              <div>
                <button
                  aria-expanded={openSection === 'projects'}
                  onClick={() => toggleSection('projects')}
                  className="flex items-center text-[14px] font-medium text-ink w-full text-left"
                >
                  <span className="w-4 mr-1">{openSection === 'projects' ? '▾' : '▸'}</span>
                  Projects ({result.parsed.projects?.length || 0})
                </button>
                {openSection === 'projects' && (
                  <div className="mt-2 bg-parchment border border-dashed border-line-strong rounded-lg p-3 flex flex-col gap-3">
                    {!result.parsed.projects || result.parsed.projects.length === 0 ? (
                      <span className="text-[13px] text-text-faint italic">No projects found</span>
                    ) : (
                      result.parsed.projects.map((proj, idx) => (
                        <div key={idx}>
                          <p className="text-[13.5px] font-semibold text-ink m-0">{proj.name}</p>
                          {proj.techStack?.length > 0 && (
                            <p className="text-[12px] font-mono text-text-faint mt-0.5 mb-1">{proj.techStack.join(', ')}</p>
                          )}
                          {proj.description && <p className="text-[13px] text-text mt-1 mb-0">{proj.description}</p>}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>

          <div className="sticky bottom-0 bg-passport flex items-center justify-between px-[30px] pt-[18px] pb-[22px] border-t border-dashed border-line-strong mt-2 rounded-b-[14px] max-sm:px-5">
            <span />
            <div className="flex gap-[10px]">
              <Button variant="outline" onClick={onClose} disabled={isApplying}>
                Discard
              </Button>
              <Button variant="brass" onClick={handleApply} disabled={isApplying}>
                {isApplying ? (
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-passport border-t-transparent rounded-full animate-spin" />
                    Applying...
                  </span>
                ) : (
                  'Apply Selected'
                )}
              </Button>
            </div>
          </div>
        </DocumentCard>
      </div>
    </div>
  );
}
