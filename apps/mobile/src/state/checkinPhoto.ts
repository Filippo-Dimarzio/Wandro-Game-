import { create } from 'zustand';

/** A photo picked for a check-in: it's posted as a moment as soon as the check-in succeeds. */
export interface AttachedPhoto {
  placeId: string;
  photo: string;
  /** Live photo selfie. */
  selfie?: string;
  caption?: string;
}

/** UI state only (not persisted): the photo waiting on the Check in tab. */
export const useCheckinPhoto = create<{
  attached: AttachedPhoto | null;
  attach: (photo: AttachedPhoto) => void;
  clear: () => void;
}>((set) => ({
  attached: null,
  attach: (attached) => set({ attached }),
  clear: () => set({ attached: null }),
}));
