'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ApiProfile, UpdateProfileDto } from '../../types/profile';
import { useProfileModal } from './ProfileModalContext';
import { DocumentCard } from '../ui/DocumentCard';
import { Button } from '../ui/button';
import { LedgerField, LedgerInput, LedgerTextarea, LedgerSelect } from '../ui/LedgerField';
import { Chip } from '../ui/Chip';
import { CameraIcon, CloseIcon } from '../ui/icons';
import { 
  useUpdateProfile, 
  useReplaceTopics, 
  useUploadAvatar, 
  useRemoveAvatar 
} from '../../hooks/use-profile';
import { useTopics } from '../../hooks/use-topics';

interface EditDetailsModalProps {
  profile: ApiProfile;
}

export function EditDetailsModal({ profile }: EditDetailsModalProps) {
  const { isModalOpen, closeModal } = useProfileModal();
  
  const { mutateAsync: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();
  const { mutateAsync: replaceTopics, isPending: isReplacingTopics } = useReplaceTopics();
  const { mutate: uploadAvatar, isPending: isUploadingAvatar } = useUploadAvatar();
  const { mutate: removeAvatar, isPending: isRemovingAvatar } = useRemoveAvatar();
  
  const { data: allTopics = [] } = useTopics();

  const [formData, setFormData] = useState({
    name: profile.user.name,
    role: profile.profile.role || '',
    homePort: profile.profile.homePort || '',
    bio: profile.profile.bio || '',
    experienceLevel: profile.profile.experienceLevel,
    timeZone: profile.profile.timezone || '',
    topicsOfInterest: [...profile.topicsOfInterest.map(t => t.topic.id)],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Focus trap and escape key handler
  useEffect(() => {
    if (isModalOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;

      if (focusableElements && focusableElements.length > 0) {
        focusableElements[0].focus();
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeModal();
        }

        if (e.key === 'Tab' && focusableElements) {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
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
  }, [isModalOpen, closeModal]);

  if (!isModalOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const toggleTopic = (topicId: string) => {
    setFormData(prev => {
      const exists = prev.topicsOfInterest.includes(topicId);
      if (exists) {
        return { ...prev, topicsOfInterest: prev.topicsOfInterest.filter(id => id !== topicId) };
      } else {
        return { ...prev, topicsOfInterest: [...prev.topicsOfInterest, topicId] };
      }
    });
  };

  const handleSave = async () => {
    try {
      const updatePayload: UpdateProfileDto = {
        role: formData.role,
        homePort: formData.homePort,
        bio: formData.bio,
        experienceLevel: formData.experienceLevel,
        timezone: formData.timeZone,
      };

      // Fire both mutations and wait
      const promises = [updateProfile(updatePayload)];
      
      // Check if topics changed
      const originalTopics = profile.topicsOfInterest.map(t => t.topic.id).sort().join(',');
      const newTopics = [...formData.topicsOfInterest].sort().join(',');
      
      if (originalTopics !== newTopics) {
        promises.push(replaceTopics({ topicIds: formData.topicsOfInterest }));
      }

      await Promise.all(promises);
      closeModal();
    } catch (error) {
      // Errors are handled by toasts in the hooks
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadAvatar(e.target.files[0]);
    }
  };

  const isSaving = isUpdatingProfile || isReplacingTopics;
  const initials = formData.name.charAt(0).toUpperCase();
  const avatarUrl = profile.user.avatarUrl;

  return (
    <div
      className="fixed inset-0 z-60 bg-[rgba(22,27,51,0.55)] flex items-center justify-center p-6 opacity-100 pointer-events-auto transition-opacity duration-150 ease-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-[600px] max-h-[86vh] overflow-y-auto transform translate-y-0 transition-transform duration-200 ease-in outline-none"
        tabIndex={-1}
      >
        <DocumentCard className="overflow-visible">
          <div className="sticky top-0 bg-passport z-10 flex items-center justify-between px-[26px] py-[14px] border-b border-dashed border-line-strong rounded-t-[14px]">
            <span className="font-mono text-[11px] tracking-[0.1em] text-brass-deep uppercase">
              Amend Voyage Log · No. 04471
            </span>
            <button
              onClick={closeModal}
              disabled={isSaving}
              className="w-[26px] h-[26px] rounded-full border border-dashed border-brass bg-transparent text-brass-deep font-mono text-[12px] cursor-pointer flex items-center justify-center -rotate-[2deg] hover:bg-brass-tint focus:outline-none focus:ring-2 focus:ring-brass focus:ring-offset-1 disabled:opacity-50"
              aria-label="Close modal"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="px-[30px] pt-[22px] pb-1 max-sm:px-5">
            <h2 id="modal-title" className="font-serif text-[21px] font-semibold text-ink m-0">
              Edit Details
            </h2>
            <p className="text-[13px] text-text-muted mt-[5px] mb-0">
              Update what shows on your passport and crew profile.
            </p>
          </div>

          <div className="px-[30px] pt-[20px] pb-[6px] flex flex-col gap-[22px] max-sm:px-5">
            {/* Avatar Edit */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <img 
                    src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'}${avatarUrl}`} 
                    className="w-[64px] h-[64px] rounded-full object-cover border-[3px] border-ink" 
                    alt="Avatar" 
                  />
                ) : (
                  <div className="w-[64px] h-[64px] rounded-full bg-harbor border-[3px] border-ink flex items-center justify-center text-white font-serif text-[24px] font-semibold">
                    {initials}
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/png, image/jpeg" 
                  onChange={handleFileSelect} 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute -bottom-[2px] -right-[2px] w-[22px] h-[22px] rounded-full bg-brass border-[2px] border-passport flex items-center justify-center cursor-pointer text-ink hover:bg-[#c79644] focus:outline-none focus:ring-2 focus:ring-brass disabled:opacity-50"
                  aria-label="Upload new photo"
                >
                  {isUploadingAvatar ? <div className="w-3 h-3 border-2 border-ink border-t-transparent rounded-full animate-spin" /> : <CameraIcon />}
                </button>
              </div>
              <div className="flex flex-col gap-1">
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="text-[13px] font-semibold text-brass-deep text-left hover:underline focus:outline-none focus:ring-1 focus:ring-brass rounded disabled:opacity-50"
                >
                  Change Photo
                </button>
                {avatarUrl && (
                  <button 
                    type="button" 
                    onClick={() => removeAvatar()}
                    disabled={isRemovingAvatar}
                    className="text-[12px] text-text-faint text-left hover:text-text-muted focus:outline-none focus:ring-1 focus:ring-text-faint rounded disabled:opacity-50"
                  >
                    {isRemovingAvatar ? 'Removing...' : 'Remove current photo'}
                  </button>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <LedgerField label="Name">
              <LedgerInput
                value={formData.name}
                disabled
                className="opacity-60 cursor-not-allowed"
                onChange={(e) => {}} // Name updates via separate flow if supported, backend doesn't support here
              />
            </LedgerField>

            <div className="grid grid-cols-2 gap-[22px] max-sm:grid-cols-1">
              <LedgerField label="Role">
                <LedgerInput
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
              </LedgerField>
              <LedgerField label="Home Port">
                <LedgerInput
                  value={formData.homePort}
                  onChange={(e) => setFormData({ ...formData, homePort: e.target.value })}
                />
              </LedgerField>
            </div>

            <LedgerField label="Bio">
              <LedgerTextarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </LedgerField>

            <div className="grid grid-cols-2 gap-[22px] max-sm:grid-cols-1">
              <LedgerField label="Experience Level">
                <LedgerSelect
                  value={formData.experienceLevel}
                  onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value as ApiProfile['profile']['experienceLevel'] })}
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                  <option value="EXPERT">Expert</option>
                </LedgerSelect>
              </LedgerField>
              <LedgerField label="Home Time Zone">
                <LedgerSelect
                  value={formData.timeZone}
                  onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
                >
                  <option value="IST (UTC +5:30)">IST (UTC +5:30)</option>
                  <option value="PST (UTC -8:00)">PST (UTC -8:00)</option>
                  <option value="EST (UTC -5:00)">EST (UTC -5:00)</option>
                  <option value="CET (UTC +1:00)">CET (UTC +1:00)</option>
                </LedgerSelect>
              </LedgerField>
            </div>

            <LedgerField label="Topics Of Interest">
              <div className="flex flex-wrap gap-[9px]">
                {allTopics.length === 0 ? (
                  <span className="text-[13px] text-text-faint">Loading topics...</span>
                ) : (
                  allTopics.map((topic) => {
                    const isSelected = formData.topicsOfInterest.includes(topic.id);
                    return (
                      <Chip
                        key={topic.id}
                        selected={isSelected}
                        onClick={() => toggleTopic(topic.id)}
                      >
                        {topic.name}
                      </Chip>
                    );
                  })
                )}
              </div>
            </LedgerField>
          </div>

          <div className="sticky bottom-0 bg-passport flex items-center justify-between px-[30px] pt-[18px] pb-[22px] border-t border-dashed border-line-strong mt-[18px] rounded-b-[14px] max-sm:px-5">
            <span className="font-mono text-[11px] text-text-faint">
              Changes apply to your profile immediately.
            </span>
            <div className="flex gap-[10px]">
              <Button variant="outline" onClick={closeModal} disabled={isSaving}>
                Cancel
              </Button>
              <Button variant="brass" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DocumentCard>
      </div>
    </div>
  );
}
