export interface RankedMapClassificationEntry {
  name: string;
  key: string;
  mode: string;
  tags: string[];
  laneShape: string;
  midImportance: string;
}

export const RANKED_MAP_CLASSIFICATION_META = {
  schemaVersion: 1,
  source: 'manual_classification',
  updatedAt: '2026-03-13',
  mapCount: 26,
  notes: [
    'Values are normalized to lowercase snake_case for stable scoring and lookups.',
    'tags describe what the map asks from a draft rather than raw balance strength.',
    'laneShape and midImportance are intentionally coarse v1 signals for Ranked Helper scoring.',
  ],
} as const;

export const RANKED_MAP_CLASSIFICATIONS: RankedMapClassificationEntry[] = [
  { name: 'Dry Season', key: 'dry_season', mode: 'bounty', tags: ['open_map', 'sniper_friendly', 'low_wall_density', 'lane_isolated', 'mid_control_heavy', 'anti_tank_low', 'wallbreak_low_value'], laneShape: 'open_isolated', midImportance: 'high' },
  { name: 'Hideout', key: 'hideout', mode: 'bounty', tags: ['very_open_map', 'sniper_friendly', 'low_bush_density', 'lane_isolated', 'mid_control_heavy', 'assassin_risky', 'wallbreak_low_value'], laneShape: 'open_isolated', midImportance: 'high' },
  { name: 'Layer Cake', key: 'layer_cake', mode: 'bounty', tags: ['semi_open_map', 'mid_control_heavy', 'lane_pressure_map', 'poke_friendly', 'wallbreak_value', 'anti_thrower_value', 'balanced_ranges'], laneShape: 'standard', midImportance: 'high' },
  { name: 'Shooting Star', key: 'shooting_star', mode: 'bounty', tags: ['very_open_map', 'sniper_friendly', 'low_wall_density', 'low_bush_density', 'mid_control_heavy', 'anti_tank_low', 'wallbreak_low_value'], laneShape: 'open_isolated', midImportance: 'high' },
  { name: 'Center Stage', key: 'center_stage', mode: 'brawl_ball', tags: ['mid_control_heavy', 'lane_pressure_map', 'balanced_ranges', 'engage_value', 'anti_dive_value', 'wallbreak_medium_value', 'objective_pressure'], laneShape: 'standard', midImportance: 'high' },
  { name: 'Pinball Dreams', key: 'pinball_dreams', mode: 'brawl_ball', tags: ['wall_heavy', 'thrower_friendly', 'wallbreak_high_value', 'anti_thrower_value', 'tank_playable', 'choke_points', 'objective_pressure'], laneShape: 'tight', midImportance: 'medium' },
  { name: 'Sneaky Fields', key: 'sneaky_fields', mode: 'brawl_ball', tags: ['bushy_map', 'tank_friendly', 'assassin_angles', 'wallbreak_high_value', 'vision_value', 'anti_tank_value', 'objective_pressure'], laneShape: 'tight', midImportance: 'medium' },
  { name: 'Triple Dribble', key: 'triple_dribble', mode: 'brawl_ball', tags: ['mixed_cover', 'lane_pressure_map', 'mid_control_heavy', 'wallbreak_value', 'engage_value', 'anti_dive_value', 'objective_pressure'], laneShape: 'standard', midImportance: 'high' },
  { name: 'Crystal Arcade', key: 'crystal_arcade', mode: 'gem_grab', tags: ['mid_control_heavy', 'controller_friendly', 'mixed_cover', 'gem_carry_map', 'lane_pressure_map', 'anti_dive_value', 'objective_pressure'], laneShape: 'standard', midImportance: 'high' },
  { name: 'Double Swoosh', key: 'double_swoosh', mode: 'gem_grab', tags: ['bushy_map', 'vision_value', 'mid_control_heavy', 'tank_playable', 'assassin_angles', 'gem_carry_map', 'anti_tank_value'], laneShape: 'mixed_bushy', midImportance: 'high' },
  { name: 'Gem Fort', key: 'gem_fort', mode: 'gem_grab', tags: ['wall_heavy', 'mid_control_heavy', 'thrower_friendly', 'wallbreak_high_value', 'gem_carry_map', 'anti_thrower_value', 'objective_pressure'], laneShape: 'tight', midImportance: 'high' },
  { name: 'Hard Rock Mine', key: 'hard_rock_mine', mode: 'gem_grab', tags: ['mixed_cover', 'mid_control_heavy', 'gem_carry_map', 'controller_friendly', 'wallbreak_medium_value', 'anti_dive_value', 'balanced_ranges'], laneShape: 'standard', midImportance: 'high' },
  { name: 'Rustic Arcade', key: 'rustic_arcade', mode: 'gem_grab', tags: ['mixed_cover', 'lane_pressure_map', 'mid_control_heavy', 'gem_carry_map', 'wallbreak_value', 'anti_thrower_value', 'balanced_ranges'], laneShape: 'standard', midImportance: 'high' },
  { name: 'Undermine', key: 'undermine', mode: 'gem_grab', tags: ['mid_control_heavy', 'open_mid', 'gem_carry_map', 'lane_isolated', 'sniper_playable', 'anti_dive_value', 'objective_pressure'], laneShape: 'open_mid', midImportance: 'high' },
  { name: 'Bridge Too Far', key: 'bridge_too_far', mode: 'heist', tags: ['very_open_map', 'sniper_friendly', 'heist_base_race', 'safe_damage_map', 'lane_isolated', 'mid_control_heavy', 'wallbreak_low_value'], laneShape: 'open_isolated', midImportance: 'high' },
  { name: 'Hot Potato', key: 'hot_potato', mode: 'heist', tags: ['mixed_cover', 'heist_base_race', 'objective_burst', 'wallbreak_medium_value', 'lane_pressure_map', 'anti_tank_value', 'safe_damage_map'], laneShape: 'standard', midImportance: 'medium' },
  { name: 'Kaboom Canyon', key: 'kaboom_canyon', mode: 'heist', tags: ['open_lanes', 'heist_base_race', 'safe_damage_map', 'sniper_playable', 'wallbreak_medium_value', 'lane_isolated', 'objective_burst'], laneShape: 'open_isolated', midImportance: 'medium' },
  { name: 'Safe Zone', key: 'safe_zone', mode: 'heist', tags: ['semi_open_map', 'heist_base_race', 'safe_damage_map', 'sniper_friendly', 'lane_pressure_map', 'anti_tank_value', 'wallbreak_low_value'], laneShape: 'open_standard', midImportance: 'medium' },
  { name: 'Dueling Beetles', key: 'dueling_beetles', mode: 'hot_zone', tags: ['bushy_map', 'single_zone_map', 'zone_control_map', 'tank_playable', 'vision_value', 'anti_tank_value', 'sustain_value'], laneShape: 'mixed_bushy', midImportance: 'high' },
  { name: 'Open Business', key: 'open_business', mode: 'hot_zone', tags: ['open_map', 'zone_control_map', 'single_zone_map', 'sniper_friendly', 'mid_control_heavy', 'anti_tank_low', 'safe_damage_map'], laneShape: 'open_standard', midImportance: 'high' },
  { name: 'Parallel Plays', key: 'parallel_plays', mode: 'hot_zone', tags: ['two_zone_map', 'lane_isolated', 'split_control_map', 'lane_pressure_map', 'balanced_ranges', 'wallbreak_value', 'anti_dive_value'], laneShape: 'split_lanes', midImportance: 'medium' },
  { name: 'Ring of Fire', key: 'ring_of_fire', mode: 'hot_zone', tags: ['single_zone_map', 'mid_control_heavy', 'zone_control_map', 'open_mid', 'sniper_playable', 'controller_friendly', 'anti_dive_value'], laneShape: 'open_mid', midImportance: 'high' },
  { name: "Belle's Rock", key: 'belles_rock', mode: 'knockout', tags: ['semi_open_map', 'sniper_friendly', 'mid_control_heavy', 'lane_isolated', 'wallbreak_value', 'anti_thrower_value', 'pick_potential'], laneShape: 'open_isolated', midImportance: 'high' },
  { name: 'Flaring Phoenix', key: 'flaring_phoenix', mode: 'knockout', tags: ['mixed_cover', 'lane_pressure_map', 'mid_control_heavy', 'wallbreak_value', 'anti_dive_value', 'balanced_ranges', 'pick_potential'], laneShape: 'standard', midImportance: 'high' },
  { name: 'New Horizons', key: 'new_horizons', mode: 'knockout', tags: ['open_map', 'sniper_friendly', 'lane_isolated', 'low_wall_density', 'mid_control_heavy', 'assassin_risky', 'pick_potential'], laneShape: 'open_isolated', midImportance: 'high' },
  { name: 'Out in the Open', key: 'out_in_the_open', mode: 'knockout', tags: ['very_open_map', 'sniper_friendly', 'lane_isolated', 'low_bush_density', 'mid_control_heavy', 'anti_tank_low', 'pick_potential'], laneShape: 'open_isolated', midImportance: 'high' },
];
