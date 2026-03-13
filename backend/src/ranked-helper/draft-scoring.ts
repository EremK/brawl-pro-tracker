import {
  BRAWLER_CLASSIFICATIONS,
  type BrawlerClassificationEntry,
} from '../data/brawler-classification';
import {
  RANKED_MAP_CLASSIFICATIONS,
  type RankedMapClassificationEntry,
} from '../data/ranked-map-classification';

function normalizeToken(value: string) {
  return String(value)
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
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
const mapByName = new Map<string, RankedMapClassificationEntry>();
for (const entry of RANKED_MAP_CLASSIFICATIONS) {
  mapByName.set(normalizeToken(entry.name), entry);
  mapByName.set(entry.key, entry);
}

// Keep known old/internal aliases working after classification renames.
const aliasMap = new Map<string, string>([
  ['glowy', 'glowbert'],
]);
const warnedMissingMaps = new Set<string>();

export function classificationForName(name: string): BrawlerClassificationEntry | null {
  const normalized = normalizeToken(name);
  return byName.get(normalized) ?? byName.get(aliasMap.get(normalized) ?? '') ?? null;
}

export function classificationForMap(name: string, mode?: string): RankedMapClassificationEntry | null {
  const normalized = normalizeToken(name);
  const entry = mapByName.get(normalized) ?? null;
  if (entry) {
    return entry;
  }

  const warningKey = `${normalized}|${normalizeToken(mode ?? '')}`;
  if (!warnedMissingMaps.has(warningKey)) {
    warnedMissingMaps.add(warningKey);
    console.warn(`[ranked-helper] Missing map classification for "${name}"${mode ? ` (${mode})` : ''}`);
  }

  return null;
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
  mapFit: number;
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
  mapName?: string,
  mode?: string,
): { score: DraftScoreBreakdown; reasons: DraftReason[] } {
  const reasons: DraftReason[] = [];

  if (!candidate) {
    return {
      score: { roleNeed: 0, flexibility: 0, traitMatchup: 0, mapFit: 0, risk: 0 },
      reasons,
    };
  }

  const ally = buildTeamSnapshot(allyNames);
  const enemy = buildTeamSnapshot(enemyNames);
  const map = mapName ? classificationForMap(mapName, mode) : null;
  const stage = stageBucket(allyNames.length, enemyNames.length);
  const roleNeedMultiplier = allyNames.length === 0 ? 0 : allyNames.length === 1 ? 0.45 : 1;

  let roleNeed = 0;
  let flexibility = 0;
  let traitMatchup = 0;
  let mapFit = 0;
  let risk = 0;

  const primary = candidate.roles.primary;
  const secondary = candidate.roles.secondary;
  const traits = new Set(candidate.traits);
  const profile = new Set(candidate.draftProfile);
  const risks = new Set(candidate.riskFlags);
  const mapTags = new Set(map?.tags ?? []);
  const midImportanceWeight = map?.midImportance === 'high' ? 1 : map?.midImportance === 'medium' ? 0.7 : 0.45;
  const scaleMapImpact = (impact: number) => impact * 0.55;

  if (!has(ally.roleCounts, 'mid') && (primary === 'mid' || secondary === 'mid')) {
    const impact = 0.42 * roleNeedMultiplier;
    roleNeed += impact;
    weightReason(reasons, 'Missing mid', 'Your draft has no stable mid yet.', impact);
  }

  if (!has(ally.roleCounts, 'lane') && (primary === 'lane' || secondary === 'lane')) {
    const impact = 0.18 * roleNeedMultiplier;
    roleNeed += impact;
    weightReason(reasons, 'Needs lane', 'Your draft still needs a natural lane brawler.', impact);
  }

  if (!has(ally.roleCounts, 'support') && (primary === 'support' || secondary === 'support')) {
    const impact = 0.14 * roleNeedMultiplier;
    roleNeed += impact;
    weightReason(reasons, 'Needs support', 'Your current picks are light on utility and peel.', impact);
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
    enemy.entries.some((entry) => entry.riskFlags.includes('aim_reliant')) &&
    traits.has('anti_aim_reliant')
  ) {
    traitMatchup += 0.12;
    weightReason(
      reasons,
      'Anti-aim value',
      'Enemy draft has aim-reliant brawlers this pick can make less consistent.',
      0.12,
    );
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

  if (
    (mapTags.has('open_map') || mapTags.has('very_open_map') || mapTags.has('semi_open_map') || mapTags.has('open_mid') || mapTags.has('sniper_friendly')) &&
    (candidate.officialClass === 'marksman' || traits.has('poke') || traits.has('range') || traits.has('snipe') || traits.has('safe_damage') || traits.has('long_range'))
  ) {
    const impact = scaleMapImpact(0.14);
    mapFit += impact;
    weightReason(reasons, 'Open-map value', 'This map favors range, poke, and safer long-lane pressure.', impact);
  }

  if (
    (mapTags.has('open_map') || mapTags.has('very_open_map') || mapTags.has('sniper_friendly') || mapTags.has('open_mid')) &&
    (risks.has('short_range') || risks.has('kiteable') || risks.has('weak_into_range'))
  ) {
    const impact = scaleMapImpact(-0.14);
    mapFit += impact;
    weightReason(reasons, 'Open-map risk', 'This map gives enemy range more room to punish short-range picks.', impact);
  }

  if (mapTags.has('mid_control_heavy') && (primary === 'mid' || secondary === 'mid')) {
    const impact = scaleMapImpact((allyNames.length === 0 ? 0.06 : 0.1) * midImportanceWeight);
    mapFit += impact;
    weightReason(reasons, 'Mid-control map', 'This map rewards stable mid control and center presence.', impact);
  }

  if ((mapTags.has('lane_pressure_map') || mapTags.has('lane_isolated') || map?.laneShape === 'open_isolated') && (primary === 'lane' || secondary === 'lane')) {
    const impact = scaleMapImpact(0.08);
    mapFit += impact;
    weightReason(reasons, 'Lane-pressure map', 'This map rewards reliable side-lane pressure.', impact);
  }

  if ((mapTags.has('wall_heavy') || mapTags.has('thrower_friendly')) && (primary === 'thrower' || secondary === 'thrower' || traits.has('choke_control') || traits.has('wall_control') || traits.has('zone'))) {
    const impact = scaleMapImpact(0.12);
    mapFit += impact;
    weightReason(reasons, 'Thrower map', 'Walls and choke points make thrower pressure more valuable here.', impact);
  }

  if ((mapTags.has('wallbreak_high_value') || mapTags.has('wallbreak_medium_value') || mapTags.has('wallbreak_value')) && traits.has('wallbreak')) {
    const impact = scaleMapImpact(0.11);
    mapFit += impact;
    weightReason(reasons, 'Wallbreak value', 'Breaking key walls opens strong angles on this map.', impact);
  }

  if (mapTags.has('anti_thrower_value') && (traits.has('anti_thrower') || traits.has('mobility') || primary === 'assassin')) {
    const impact = scaleMapImpact(0.09);
    mapFit += impact;
    weightReason(reasons, 'Anti-thrower map', 'This map often rewards picks that can pressure throwers.', impact);
  }

  if ((mapTags.has('bushy_map') || mapTags.has('vision_value')) && (traits.has('vision') || traits.has('bush_control'))) {
    const impact = scaleMapImpact(0.1);
    mapFit += impact;
    weightReason(reasons, 'Bush/vision value', 'Bush control and reveal tools are especially useful here.', impact);
  }

  if ((mapTags.has('tank_friendly') || mapTags.has('tank_playable')) && (primary === 'tank' || secondary === 'tank')) {
    const impact = scaleMapImpact(0.08);
    mapFit += impact;
    weightReason(reasons, 'Tank map', 'This map gives tanks more workable space and cover.', impact);
  }

  if (mapTags.has('assassin_angles') && (primary === 'assassin' || secondary === 'assassin' || secondary === 'flank')) {
    const impact = scaleMapImpact(0.08);
    mapFit += impact;
    weightReason(reasons, 'Assassin angles', 'The map offers flanks and approach paths for dive threats.', impact);
  }

  if ((mapTags.has('zone_control_map') || mapTags.has('single_zone_map') || mapTags.has('two_zone_map') || mapTags.has('split_control_map')) && (traits.has('zone') || traits.has('control') || traits.has('sustain') || traits.has('anti_tank'))) {
    const impact = scaleMapImpact(0.1);
    mapFit += impact;
    weightReason(reasons, 'Zone-control map', 'This map rewards sustained control over key areas.', impact);
  }

  if (mapTags.has('gem_carry_map') && (primary === 'mid' || secondary === 'support' || traits.has('heal') || traits.has('control') || traits.has('comp_enable'))) {
    const impact = scaleMapImpact(0.09);
    mapFit += impact;
    weightReason(reasons, 'Gem-carry map', 'This map values control, stability, and carry support.', impact);
  }

  if ((mapTags.has('heist_base_race') || mapTags.has('safe_damage_map') || mapTags.has('objective_burst') || mapTags.has('objective_pressure')) && (traits.has('objective') || traits.has('safe_damage') || traits.has('burst') || traits.has('dps') || traits.has('wallbreak'))) {
    const impact = scaleMapImpact(0.1);
    mapFit += impact;
    weightReason(reasons, 'Objective value', 'This map rewards damage patterns that pressure the objective well.', impact);
  }

  if (mapTags.has('pick_potential') && (traits.has('pick') || traits.has('mark') || traits.has('stun') || traits.has('vision'))) {
    const impact = scaleMapImpact(0.08);
    mapFit += impact;
    weightReason(reasons, 'Pick potential', 'This map creates strong punish windows for pick-based brawlers.', impact);
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
    score: { roleNeed, flexibility, traitMatchup, mapFit, risk },
    reasons: reasons
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .slice(0, 4),
  };
}
