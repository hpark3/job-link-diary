import { useState, useEffect, useCallback } from "react";

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
  const [profile, setProfileState] = useState<CandidateProfile>(loadProfile);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  const setProfile = useCallback((update: Partial<CandidateProfile>) => {
    setProfileState((prev) => ({ ...prev, ...update }));
  }, []);

  const isConfigured =
    profile.targetRoles.length > 0 || profile.skills.length > 0;

  return { profile, setProfile, isConfigured };
}
