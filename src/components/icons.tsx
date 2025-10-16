
import {
  Laptop,
  Gamepad2,
  Gamepad,
  Square,
  Archive,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  Star,
  type LucideProps
} from 'lucide-react';
import type { Platform, SteamDeckCompat } from '@/lib/types';
import React from 'react';

export const platformIcons: Record<Platform, React.ComponentType<LucideProps>> = {
  "PC": Laptop,
  "PlayStation": Gamepad2,
  "Xbox": Gamepad,
  "Nintendo Switch": Square,
  "Others/ROMs": Archive,
};


export const SteamIcon = (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M12.003 2c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm4.288 15.312c-1.31 1.01-2.885 1.69-4.63 1.69-4.32 0-7.85-3.52-7.85-7.84s3.53-7.85 7.85-7.85c2.51 0 4.712 1.18 6.11 3.01l-2.953 1.84c-.81-.97-1.99-1.57-3.3-1.57-2.73 0-4.96 2.23-4.96 4.96s2.23 4.96 4.96 4.96c1.5 0 2.83-.67 3.73-1.72l3.033 1.52zm-1.89-6.39c.63 0 1.15.52 1.15 1.15s-.52 1.15-1.15-1.15-1.15-.52-1.15-1.15.52-1.15 1.15-1.15zm-2.81 3.99c-.58 0-1.04-.47-1.04-1.04s.46-1.04 1.04-1.04 1.04.47 1.04 1.04-.47 1.04-1.04-1.04zm-.51-1.46c-.53 0-.96-.43-.96-.96s.43-.96.96-.96.96.43.96.96-.43.96-.96-.96zM9.9 14.8c-.37 0-.67-.3-.67-.67s.3-.67.67-.67.67.3.67.67-.3.67-.67-.67z" />
    </svg>
  );

export const steamDeckCompatIcons: Record<SteamDeckCompat, React.ComponentType<LucideProps>> = {
  native: CheckCircle2,
  platinum: Star,
  gold: CheckCircle2,
  silver: AlertCircle,
  bronze: AlertCircle,
  borked: XCircle,
  unknown: HelpCircle,
};

export const steamDeckCompatTooltips: Record<SteamDeckCompat, string> = {
  native: 'Native: Runs natively on Linux.',
  platinum: 'Platinum: Works perfectly out of the box.',
  gold: 'Gold: Runs perfectly after tweaks.',
  silver: 'Silver: Runs with minor issues, but generally playable.',
  bronze: 'Bronze: Runs, but with major issues. Crashes or has performance problems.',
  borked: 'Borked: The game is unplayable.',
  unknown: "This game's Steam Deck compatibility is unknown.",
};

export const ratingTooltips: Record<number, string> = {
  1: '1 - Low Interest',
  2: '2 - Mild Interest',
  3: '3 - Moderate Interest',
  4: '4 - High Interest',
  5: '5 - Very High Interest',
};
