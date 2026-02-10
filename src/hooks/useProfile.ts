import { useState, useCallback } from "react";

export interface CandidateProfile {
  targetRoles: string[];
  skills: string[];
  domains: string[];
  preferredRegions: string[];
  experienceLevel: "junior" | "mid" | "senior" | "lead";
}

const STORAGE_KEY = "candidate-profile";

const DEFAULT_PROFILE: CandidateProfile = {
  targetRoles: [],
  skills: [],
  domains: [],
  preferredRegions: [],
  experienceLevel: "mid",
};

function loadProfile(): CandidateProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function useProfile() {
  const [savedProfile, setSavedProfile] = useState<CandidateProfile>(loadProfile);
  const [draft, setDraftState] = useState<CandidateProfile>(loadProfile);

  const setDraft = useCallback((update: Partial<CandidateProfile>) => {
    setDraftState((prev) => ({ ...prev, ...update }));
  }, []);

  const save = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setSavedProfile(draft);
  }, [draft]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(savedProfile);

  const isConfigured =
    savedProfile.targetRoles.length > 0 || savedProfile.skills.length > 0;

  return { profile: savedProfile, draft, setDraft, save, isDirty, isConfigured };
}
