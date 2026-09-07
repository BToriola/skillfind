import { Freelancer } from "@/types";

export type StrengthItemKey =
  | "basics"
  | "photo"
  | "bio"
  | "pricing"
  | "portfolio"
  | "portfolio_more";

export type StrengthItem = {
  key: StrengthItemKey;
  /** Checklist label — what the freelancer sees next to the tick. */
  label: string;
  /** Percentage points this row contributes. All rows sum to exactly 100. */
  weight: number;
  done: boolean;
  /** One-line prompt used when this row is the biggest thing still missing. */
  cta: string;
};

export type ProfileStrength = {
  percent: number;
  items: StrengthItem[];
  /** Highest-weight unfinished row, or null at 100%. */
  topMissing: StrengthItem | null;
  isComplete: boolean;
};

/**
 * Scores how complete a freelancer's listing is.
 *
 * Portfolio deliberately carries 45 of the 100 points, split across two rows —
 * together they outweigh every other field, so someone who skips the portfolio
 * entirely can never see a number above 55%. That visible gap is the whole
 * reason the meter exists: registration collects everything else for them, so
 * the portfolio is the only part they have to come back and choose to do.
 */
export function getProfileStrength(
  freelancer: Freelancer,
  portfolioCount: number
): ProfileStrength {
  const remainingToThree = Math.max(0, 3 - portfolioCount);

  // Declared in display order; `topMissing` re-sorts by weight, so the
  // portfolio rows surface first as prompts regardless of where they sit here.
  const items: StrengthItem[] = [
    {
      key: "basics",
      label: "Skill title and location",
      weight: 15,
      done: !!(
        freelancer.name?.trim() &&
        freelancer.skill?.trim() &&
        freelancer.state?.trim() &&
        freelancer.city?.trim()
      ),
      cta: "Add your skill title, state and city",
    },
    {
      key: "photo",
      label: "Profile photo",
      weight: 15,
      done: !!freelancer.avatar_url,
      cta: "Add a profile photo",
    },
    {
      // Anything shorter than this is a placeholder, not a bio — a couple of
      // words would otherwise score the same as three real sentences.
      key: "bio",
      label: "Professional bio",
      weight: 15,
      done: (freelancer.bio?.trim().length ?? 0) >= 40,
      cta: "Write a short bio — the AI writer fills it in for you",
    },
    {
      key: "pricing",
      label: "Pricing set",
      weight: 10,
      done: !!freelancer.rate_type,
      cta: "Set your pricing so clients know what to expect",
    },
    {
      key: "portfolio",
      label: "First project in your portfolio",
      weight: 30,
      done: portfolioCount >= 1,
      cta: "Add one project to your portfolio",
    },
    {
      key: "portfolio_more",
      label: "3 projects in your portfolio",
      weight: 15,
      done: portfolioCount >= 3,
      cta:
        remainingToThree === 1
          ? "Add 1 more project to reach 3"
          : `Add ${remainingToThree} more projects to reach 3`,
    },
  ];

  const percent = items.reduce((sum, i) => (i.done ? sum + i.weight : sum), 0);

  const topMissing =
    [...items]
      .filter(i => !i.done)
      // Stable sort, so equal-weight rows keep the display order above.
      .sort((a, b) => b.weight - a.weight)[0] ?? null;

  return { percent, items, topMissing, isComplete: percent >= 100 };
}
