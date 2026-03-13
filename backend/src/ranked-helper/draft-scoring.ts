import {
  BRAWLER_CLASSIFICATIONS,
  type BrawlerClassificationEntry,
} from '../data/brawler-classification';

function normalizeToken(value: string) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

const byName = new Map<string, BrawlerClassificationEntry>();
for (const entry of BRAWLER_CLASSIFICATIONS) {
  byName.set(normalizeToken(entry.name), entry);
  byName.set(entry.key, entry);
}

export function classificationForName(name: string): BrawlerClassificationEntry | null {
  return byName.get(normalizeToken(name)) ?? null;
}

type TeamSnapshot = {
  roleCounts: Map<string, number>;
  classCounts: Map<string, number>;
  traitCounts: Map<string, number>;
  draftProfileCounts: Map<string, number>;
  riskCounts: Map<string, number>;
  entries: BrawlerClassificationEntry[];
};

function inc(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

export function buildTeamSnapshot(names: string[]): TeamSnapshot {
  const roleCounts = new Map<string, number>();
  const classCounts = new Map<string, number>();
  const traitCounts = new Map<string, number>();
  const draftProfileCounts = new Map<string, number>();
  const riskCounts = new Map<string, number>();
  const entries: BrawlerClassificationEntry[] = [];

  for (const name of names) {
    const entry = classificationForName(name);
    if (!entry) continue;
    entries.push(entry);
    inc(classCounts, entry.officialClass);
    inc(roleCounts, entry.roles.primary);
    if (entry.roles.secondary) inc(roleCounts, entry.roles.secondary);
    for (const trait of entry.traits) inc(traitCounts, trait);
    for (const tag of entry.draftProfile) inc(draftProfileCounts, tag);
    for (const risk of entry.riskFlags) inc(riskCounts, risk);
  }

  return { roleCounts, classCounts, traitCounts, draftProfileCounts, riskCounts, entries };
}

export type DraftScoreBreakdown = {
  roleNeed: number;
  flexibility: number;
  traitMatchup: number;
  risk: number;
};

export type DraftReason = {
  label: string;
  detail: string;
  impact: number;
};

function has(map: Map<string, number>, key: string) {
  return (map.get(key) ?? 0) > 0;
}

function weightReason(reasons: DraftReason[], label: string, detail: string, impact: number) {
  if (impact === 0) return;
  reasons.push({ label, detail, impact });
}

function stageBucket(allyCount: number, enemyCount: number) {
  const total = allyCount + enemyCount;
  if (total <= 1) return 'opening';
  if (total <= 3) return 'mid';
  return 'late';
}

export function scoreDraftFit(
  candidate: BrawlerClassificationEntry | null,
  allyNames: string[],
  enemyNames: string[],
): { score: DraftScoreBreakdown; reasons: DraftReason[] } {
  const reasons: DraftReason[] = [];

  if (!candidate) {
    return {
      score: { roleNeed: 0, flexibility: 0, traitMatchup: 0, risk: 0 },
      reasons,
    };
  }

  const ally = buildTeamSnapshot(allyNames);
  const enemy = buildTeamSnapshot(enemyNames);
  const stage = stageBucket(allyNames.length, enemyNames.length);

  let roleNeed = 0;
  let flexibility = 0;
  let traitMatchup = 0;
  let risk = 0;

  const primary = candidate.roles.primary;
  const secondary = candidate.roles.secondary;
  const traits = new Set(candidate.traits);
  const profile = new Set(candidate.draftProfile);
  const risks = new Set(candidate.riskFlags);

  if (!has(ally.roleCounts, 'mid') && (primary === 'mid' || secondary === 'mid')) {
    roleNeed += 0.42;
    weightReason(reasons, 'Missing mid', 'Your draft has no stable mid yet.', 0.42);
  }

  if (!has(ally.roleCounts, 'lane') && (primary === 'lane' || secondary === 'lane')) {
    roleNeed += 0.18;
    weightReason(reasons, 'Needs lane', 'Your draft still needs a natural lane brawler.', 0.18);
  }

  if (!has(ally.roleCounts, 'support') && (primary === 'support' || secondary === 'support')) {
    roleNeed += 0.14;
    weightReason(reasons, 'Needs support', 'Your current picks are light on utility and peel.', 0.14);
  }

  if (
    enemy.entries.some((entry) => entry.roles.primary === 'tank' || entry.roles.secondary === 'tank') &&
    traits.has('anti_tank')
  ) {
    traitMatchup += 0.24;
    weightReason(reasons, 'Anti-tank value', 'Enemy draft already shows frontline or tank pressure.', 0.24);
  }

  if (
    enemy.entries.some(
      (entry) =>
        entry.roles.primary === 'assassin' ||
        entry.roles.secondary === 'assassin' ||
        entry.roles.secondary === 'flank',
    ) &&
    (traits.has('anti_dive') || traits.has('peel') || traits.has('control'))
  ) {
    traitMatchup += 0.2;
    weightReason(reasons, 'Anti-dive value', 'This pick helps punish or peel against enemy aggro.', 0.2);
  }

  if (
    enemy.entries.some((entry) => entry.roles.primary === 'thrower' || entry.roles.secondary === 'thrower') &&
    (traits.has('mobility') || traits.has('anti_thrower') || primary === 'assassin')
  ) {
    traitMatchup += 0.14;
    weightReason(reasons, 'Thrower pressure', 'Enemy draft is vulnerable to dive or thrower pressure.', 0.14);
  }

  if (has(enemy.traitCounts, 'spawnable') && traits.has('anti_spawnable')) {
    traitMatchup += 0.12;
    weightReason(reasons, 'Anti-spawnable', 'Enemy comp has summon pressure this pick can answer.', 0.12);
  }

  if (has(enemy.traitCounts, 'heal') && traits.has('anti_heal')) {
    traitMatchup += 0.12;
    weightReason(reasons, 'Anti-heal', 'Enemy draft has healing that this brawler can reduce.', 0.12);
  }

  if (
    ally.entries.some(
      (entry) =>
        entry.roles.primary === 'tank' ||
        entry.roles.primary === 'assassin' ||
        entry.roles.secondary === 'tank' ||
        entry.roles.secondary === 'assassin',
    ) &&
    (traits.has('heal') || traits.has('buff') || traits.has('speed') || traits.has('comp_enable'))
  ) {
    traitMatchup += 0.16;
    weightReason(reasons, 'Enables allies', 'This pick boosts the tempo or survivability of your current core.', 0.16);
  }

  if (stage === 'opening') {
    if (profile.has('blind')) {
      flexibility += 0.24;
      weightReason(reasons, 'Blind pick', 'Safer early in the draft before more enemy information appears.', 0.24);
    }
    if (profile.has('comp_glue')) {
      flexibility += 0.14;
      weightReason(reasons, 'Draft glue', 'Fits many different team shapes as the draft develops.', 0.14);
    }
    if (profile.has('last_pick')) {
      flexibility -= 0.18;
      weightReason(reasons, 'Late-pick profile', 'Usually stronger as a punish pick than as an opener.', -0.18);
    }
  } else if (stage === 'mid') {
    if (profile.has('flex')) {
      flexibility += 0.12;
      weightReason(reasons, 'Flexible slot', 'Still keeps your draft open while adding useful pressure.', 0.12);
    }
    if (profile.has('counter')) {
      flexibility += 0.08;
      weightReason(reasons, 'Counter window', 'There is enough enemy info for this pick to gain counter value.', 0.08);
    }
  } else {
    if (profile.has('last_pick')) {
      flexibility += 0.2;
      weightReason(reasons, 'Strong punish pick', 'This profile is strongest when the draft is almost complete.', 0.2);
    }
    if (profile.has('counter')) {
      flexibility += 0.14;
      weightReason(reasons, 'Counter-finisher', 'Late draft state gives this brawler more direct punish value.', 0.14);
    }
  }

  if (has(enemy.classCounts, 'marksman') || has(enemy.traitCounts, 'poke') || has(enemy.traitCounts, 'long_range')) {
    if (risks.has('short_range') || risks.has('kiteable') || risks.has('weak_into_range')) {
      risk -= 0.18;
      weightReason(reasons, 'Range risk', 'Enemy draft has enough range to punish this pick.', -0.18);
    }
  }

  if (
    enemy.entries.some(
      (entry) =>
        entry.roles.primary === 'assassin' ||
        entry.roles.secondary === 'assassin' ||
        entry.roles.secondary === 'flank',
    ) &&
    (risks.has('fragile') || risks.has('dive_prone') || risks.has('assassin_prone'))
  ) {
    risk -= 0.14;
    weightReason(reasons, 'Dive risk', 'Enemy draft can pressure fragile backline picks.', -0.14);
  }

  if (stage === 'opening' && (risks.has('hard_counterable') || risks.has('map_dependent'))) {
    risk -= 0.08;
    weightReason(reasons, 'Reveal risk', 'This pick is easier to answer early in the draft.', -0.08);
  }

  if (stage !== 'opening' && profile.has('map_dependent')) {
    flexibility += 0.05;
  }

  return {
    score: { roleNeed, flexibility, traitMatchup, risk },
    reasons: reasons
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .slice(0, 4),
  };
}
