export interface BrawlerClassificationRoles {
  primary: string;
  secondary: string;
}

export interface BrawlerClassificationEntry {
  name: string;
  key: string;
  officialClass: string;
  roles: BrawlerClassificationRoles;
  traits: string[];
  draftProfile: string[];
  riskFlags: string[];
}

export const BRAWLER_CLASSIFICATION_META = {
  schemaVersion: 1,
  source: 'manual_classification',
  updatedAt: '2026-03-13',
  brawlerCount: 100,
  notes: [
    'Values are normalized to lowercase snake_case for stable scoring and lookups.',
    'roles.primary and roles.secondary preserve the user-defined role ordering.',
    'officialClass preserves Supercell-style class intent in normalized form.',
  ],
} as const;

export const BRAWLER_CLASSIFICATIONS: BrawlerClassificationEntry[] = [
  {
    "name": "8-Bit",
    "key": "8_bit",
    "officialClass": "damage_dealer",
    "roles": {
      "primary": "mid",
      "secondary": "lane"
    },
    "traits": [
      "turret",
      "anti_tank",
      "objective",
      "control"
    ],
    "draftProfile": [
      "comp_glue",
      "map_dependent"
    ],
    "riskFlags": [
      "immobile",
      "dive_prone"
    ]
  },
  {
    "name": "Alli",
    "key": "alli",
    "officialClass": "assassin",
    "roles": {
      "primary": "assassin",
      "secondary": "flank"
    },
    "traits": [
      "dive",
      "mobility",
      "cleanup",
      "burst"
    ],
    "draftProfile": [
      "counter",
      "last_pick"
    ],
    "riskFlags": [
      "fragile",
      "punishable",
      "weak_into_control"
    ]
  },
  {
    "name": "Amber",
    "key": "amber",
    "officialClass": "controller",
    "roles": {
      "primary": "lane",
      "secondary": "mid"
    },
    "traits": [
      "zone",
      "bush_control",
      "sustained_dps",
      "anti_tank"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "aim_reliant",
      "fragile"
    ]
  },
  {
    "name": "Angelo",
    "key": "angelo",
    "officialClass": "marksman",
    "roles": {
      "primary": "lane",
      "secondary": "mid"
    },
    "traits": [
      "poke",
      "burst",
      "mobility",
      "anti_tank"
    ],
    "draftProfile": [
      "blind",
      "counter"
    ],
    "riskFlags": [
      "aim_reliant",
      "punishable"
    ]
  },
  {
    "name": "Ash",
    "key": "ash",
    "officialClass": "tank",
    "roles": {
      "primary": "lane",
      "secondary": "tank"
    },
    "traits": [
      "pressure",
      "anti_squishy",
      "summon",
      "snowball"
    ],
    "draftProfile": [
      "counter",
      "last_pick"
    ],
    "riskFlags": [
      "kiteable",
      "weak_into_range"
    ]
  },
  {
    "name": "Barley",
    "key": "barley",
    "officialClass": "thrower",
    "roles": {
      "primary": "thrower",
      "secondary": "lane"
    },
    "traits": [
      "zone",
      "choke_control",
      "objective",
      "anti_tank"
    ],
    "draftProfile": [
      "counter",
      "map_dependent"
    ],
    "riskFlags": [
      "assassin_prone",
      "weak_into_dive"
    ]
  },
  {
    "name": "Bea",
    "key": "bea",
    "officialClass": "marksman",
    "roles": {
      "primary": "lane",
      "secondary": "mid"
    },
    "traits": [
      "poke",
      "anti_tank",
      "slow",
      "vision"
    ],
    "draftProfile": [
      "counter",
      "comp_glue"
    ],
    "riskFlags": [
      "fragile",
      "low_burst_without_mark"
    ]
  },
  {
    "name": "Belle",
    "key": "belle",
    "officialClass": "marksman",
    "roles": {
      "primary": "mid",
      "secondary": "lane"
    },
    "traits": [
      "poke",
      "mark",
      "anti_tank",
      "control"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "fragile",
      "low_finishing_power"
    ]
  },
  {
    "name": "Berry",
    "key": "berry",
    "officialClass": "support",
    "roles": {
      "primary": "support",
      "secondary": "lane"
    },
    "traits": [
      "heal",
      "area_control",
      "sustain",
      "comp_enable"
    ],
    "draftProfile": [
      "comp_glue",
      "blind"
    ],
    "riskFlags": [
      "low_burst",
      "support_needy"
    ]
  },
  {
    "name": "Bibi",
    "key": "bibi",
    "officialClass": "tank",
    "roles": {
      "primary": "lane",
      "secondary": "tank"
    },
    "traits": [
      "engage",
      "knockback",
      "speed",
      "anti_dive"
    ],
    "draftProfile": [
      "counter",
      "map_dependent"
    ],
    "riskFlags": [
      "short_range",
      "kiteable"
    ]
  },
  {
    "name": "Bo",
    "key": "bo",
    "officialClass": "controller",
    "roles": {
      "primary": "mid",
      "secondary": "lane"
    },
    "traits": [
      "vision",
      "trap_control",
      "anti_dive",
      "setup"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "moderate_dps",
      "map_dependent"
    ]
  },
  {
    "name": "Bonnie",
    "key": "bonnie",
    "officialClass": "assassin",
    "roles": {
      "primary": "lane",
      "secondary": "assassin"
    },
    "traits": [
      "poke",
      "engage",
      "burst",
      "finisher"
    ],
    "draftProfile": [
      "flex",
      "counter"
    ],
    "riskFlags": [
      "commit_heavy",
      "immobile",
      "punishable"
    ]
  },
  {
    "name": "Brock",
    "key": "brock",
    "officialClass": "marksman",
    "roles": {
      "primary": "lane",
      "secondary": "mid"
    },
    "traits": [
      "poke",
      "wallbreak",
      "objective",
      "range"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "fragile",
      "aim_reliant"
    ]
  },
  {
    "name": "Bull",
    "key": "bull",
    "officialClass": "tank",
    "roles": {
      "primary": "tank",
      "secondary": "lane"
    },
    "traits": [
      "burst",
      "bush_control",
      "objective",
      "engage"
    ],
    "draftProfile": [
      "counter",
      "last_pick"
    ],
    "riskFlags": [
      "short_range",
      "kiteable"
    ]
  },
  {
    "name": "Buster",
    "key": "buster",
    "officialClass": "tank",
    "roles": {
      "primary": "tank",
      "secondary": "support"
    },
    "traits": [
      "frontline",
      "peel",
      "anti_projectile",
      "engage"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "short_range",
      "support_needy"
    ]
  },
  {
    "name": "Buzz",
    "key": "buzz",
    "officialClass": "assassin",
    "roles": {
      "primary": "assassin",
      "secondary": "tank"
    },
    "traits": [
      "engage",
      "stun",
      "dive",
      "pick"
    ],
    "draftProfile": [
      "counter",
      "last_pick"
    ],
    "riskFlags": [
      "gadget_super_reliant",
      "weak_into_peel"
    ]
  },
  {
    "name": "Byron",
    "key": "byron",
    "officialClass": "support",
    "roles": {
      "primary": "support",
      "secondary": "mid"
    },
    "traits": [
      "heal",
      "poke",
      "anti_heal",
      "comp_enable"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "fragile",
      "low_burst"
    ]
  },
  {
    "name": "Carl",
    "key": "carl",
    "officialClass": "damage_dealer",
    "roles": {
      "primary": "lane",
      "secondary": "mid"
    },
    "traits": [
      "wall_play",
      "engage",
      "sustained_dps",
      "mobility"
    ],
    "draftProfile": [
      "blind",
      "flex"
    ],
    "riskFlags": [
      "cc_prone",
      "map_dependent"
    ]
  },
  {
    "name": "Charlie",
    "key": "charlie",
    "officialClass": "controller",
    "roles": {
      "primary": "lane",
      "secondary": "support"
    },
    "traits": [
      "pick",
      "anti_dive",
      "summon",
      "control"
    ],
    "draftProfile": [
      "counter",
      "comp_glue"
    ],
    "riskFlags": [
      "low_dps",
      "super_reliant"
    ]
  },
  {
    "name": "Chester",
    "key": "chester",
    "officialClass": "damage_dealer",
    "roles": {
      "primary": "lane",
      "secondary": "flex"
    },
    "traits": [
      "burst",
      "unpredictability",
      "poke",
      "finisher"
    ],
    "draftProfile": [
      "counter",
      "volatile"
    ],
    "riskFlags": [
      "inconsistent",
      "punishable"
    ]
  },
  {
    "name": "Chuck",
    "key": "chuck",
    "officialClass": "damage_dealer",
    "roles": {
      "primary": "objective",
      "secondary": "lane"
    },
    "traits": [
      "mobility",
      "heist",
      "split_pressure",
      "burst"
    ],
    "draftProfile": [
      "specialist",
      "map_dependent"
    ],
    "riskFlags": [
      "linear",
      "mode_dependent"
    ]
  },
  {
    "name": "Clancy",
    "key": "clancy",
    "officialClass": "damage_dealer",
    "roles": {
      "primary": "lane",
      "secondary": "mid"
    },
    "traits": [
      "poke",
      "scaling",
      "anti_tank",
      "pressure"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "needs_ramp",
      "punishable_early"
    ]
  },
  {
    "name": "Colette",
    "key": "colette",
    "officialClass": "damage_dealer",
    "roles": {
      "primary": "lane",
      "secondary": "mid"
    },
    "traits": [
      "anti_tank",
      "objective",
      "poke",
      "engage"
    ],
    "draftProfile": [
      "counter",
      "comp_glue"
    ],
    "riskFlags": [
      "weak_into_squishy_finish"
    ]
  },
  {
    "name": "Colt",
    "key": "colt",
    "officialClass": "damage_dealer",
    "roles": {
      "primary": "lane",
      "secondary": "mid"
    },
    "traits": [
      "wallbreak",
      "objective",
      "anti_tank",
      "dps"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "aim_reliant",
      "fragile"
    ]
  },
  {
    "name": "Cordelius",
    "key": "cordelius",
    "officialClass": "assassin",
    "roles": {
      "primary": "assassin",
      "secondary": "lane"
    },
    "traits": [
      "isolation",
      "anti_carry",
      "counterpick",
      "mobility"
    ],
    "draftProfile": [
      "counter",
      "last_pick"
    ],
    "riskFlags": [
      "short_range",
      "punishable_if_behind"
    ]
  },
  {
    "name": "Crow",
    "key": "crow",
    "officialClass": "assassin",
    "roles": {
      "primary": "lane",
      "secondary": "support"
    },
    "traits": [
      "anti_heal",
      "poke",
      "vision",
      "anti_dive"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "low_burst",
      "fragile"
    ]
  },
  {
    "name": "Darryl",
    "key": "darryl",
    "officialClass": "tank",
    "roles": {
      "primary": "tank",
      "secondary": "assassin"
    },
    "traits": [
      "engage",
      "burst",
      "objective",
      "frontline"
    ],
    "draftProfile": [
      "counter",
      "last_pick"
    ],
    "riskFlags": [
      "kiteable",
      "super_path_readable"
    ]
  },
  {
    "name": "Doug",
    "key": "doug",
    "officialClass": "support",
    "roles": {
      "primary": "support",
      "secondary": "tank"
    },
    "traits": [
      "revive",
      "heal",
      "anti_dive",
      "frontline"
    ],
    "draftProfile": [
      "comp_glue",
      "map_dependent"
    ],
    "riskFlags": [
      "short_range",
      "support_needy"
    ]
  },
  {
    "name": "Draco",
    "key": "draco",
    "officialClass": "tank",
    "roles": {
      "primary": "tank",
      "secondary": "lane"
    },
    "traits": [
      "frontline",
      "anti_burst",
      "engage",
      "soak"
    ],
    "draftProfile": [
      "counter",
      "comp_glue"
    ],
    "riskFlags": [
      "short_range",
      "weak_into_kiting"
    ]
  },
  {
    "name": "Dynamike",
    "key": "dynamike",
    "officialClass": "thrower",
    "roles": {
      "primary": "thrower",
      "secondary": "lane"
    },
    "traits": [
      "burst",
      "wall_control",
      "stun",
      "objective"
    ],
    "draftProfile": [
      "counter",
      "map_dependent"
    ],
    "riskFlags": [
      "assassin_prone",
      "aim_reliant"
    ]
  },
  {
    "name": "Edgar",
    "key": "edgar",
    "officialClass": "assassin",
    "roles": {
      "primary": "assassin",
      "secondary": "flank"
    },
    "traits": [
      "dive",
      "cleanup",
      "snowball",
      "pressure"
    ],
    "draftProfile": [
      "last_pick",
      "counter"
    ],
    "riskFlags": [
      "hard_counterable",
      "weak_into_peel"
    ]
  },
  {
    "name": "El Primo",
    "key": "el_primo",
    "officialClass": "tank",
    "roles": {
      "primary": "tank",
      "secondary": "assassin"
    },
    "traits": [
      "engage",
      "knockup",
      "anti_tank",
      "bush"
    ],
    "draftProfile": [
      "counter",
      "last_pick"
    ],
    "riskFlags": [
      "kiteable",
      "super_reliant"
    ]
  },
  {
    "name": "Emz",
    "key": "emz",
    "officialClass": "controller",
    "roles": {
      "primary": "mid",
      "secondary": "lane"
    },
    "traits": [
      "zone",
      "anti_tank",
      "anti_dive",
      "control"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "weak_into_snipers",
      "wall_dependent"
    ]
  },
  {
    "name": "Eve",
    "key": "eve",
    "officialClass": "damage_dealer",
    "roles": {
      "primary": "lane",
      "secondary": "mid"
    },
    "traits": [
      "poke",
      "spawnable",
      "water_control",
      "vision"
    ],
    "draftProfile": [
      "blind",
      "map_dependent"
    ],
    "riskFlags": [
      "fragile",
      "weak_into_aggro"
    ]
  },
  {
    "name": "Fang",
    "key": "fang",
    "officialClass": "assassin",
    "roles": {
      "primary": "assassin",
      "secondary": "lane"
    },
    "traits": [
      "engage",
      "chain_kill",
      "burst",
      "finisher"
    ],
    "draftProfile": [
      "counter",
      "last_pick"
    ],
    "riskFlags": [
      "hard_counterable",
      "peel_prone"
    ]
  },
  {
    "name": "Finx",
    "key": "finx",
    "officialClass": "controller",
    "roles": {
      "primary": "mid",
      "secondary": "support"
    },
    "traits": [
      "tempo_control",
      "poke",
      "utility",
      "comp_enable"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "team_dependent",
      "low_burst"
    ]
  },
  {
    "name": "Frank",
    "key": "frank",
    "officialClass": "tank",
    "roles": {
      "primary": "tank",
      "secondary": "lane"
    },
    "traits": [
      "frontline",
      "stun",
      "anti_tank",
      "objective"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "interruptible",
      "kiteable"
    ]
  },
  {
    "name": "Gale",
    "key": "gale",
    "officialClass": "controller",
    "roles": {
      "primary": "mid",
      "secondary": "support"
    },
    "traits": [
      "peel",
      "anti_tank",
      "anti_dive",
      "control"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "low_burst",
      "mode_dependent"
    ]
  },
  {
    "name": "Gene",
    "key": "gene",
    "officialClass": "support",
    "roles": {
      "primary": "mid",
      "secondary": "support"
    },
    "traits": [
      "pick",
      "poke",
      "heal",
      "comp_enable"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "low_dps",
      "pull_reliant"
    ]
  },
  {
    "name": "Gigi",
    "key": "gigi",
    "officialClass": "support",
    "roles": {
      "primary": "support",
      "secondary": "lane"
    },
    "traits": [
      "utility",
      "sustain",
      "comp_enable",
      "peel"
    ],
    "draftProfile": [
      "comp_glue",
      "blind"
    ],
    "riskFlags": [
      "low_carry",
      "team_dependent"
    ]
  },
  {
    "name": "Glowbert",
    "key": "glowbert",
    "officialClass": "mythic_support_controller",
    "roles": {
      "primary": "support",
      "secondary": "mid"
    },
    "traits": [
      "heal",
      "fear",
      "poke",
      "utility"
    ],
    "draftProfile": [
      "comp_glue",
      "blind"
    ],
    "riskFlags": [
      "low_burst",
      "team_dependent"
    ]
  },
  {
    "name": "Gray",
    "key": "gray",
    "officialClass": "support",
    "roles": {
      "primary": "mid",
      "secondary": "assassin"
    },
    "traits": [
      "pick",
      "portal",
      "mobility",
      "playmaking"
    ],
    "draftProfile": [
      "counter",
      "comp_glue"
    ],
    "riskFlags": [
      "execution_heavy",
      "punishable"
    ]
  },
  {
    "name": "Griff",
    "key": "griff",
    "officialClass": "damage_dealer",
    "roles": {
      "primary": "lane",
      "secondary": "mid"
    },
    "traits": [
      "burst",
      "wallbreak",
      "anti_tank",
      "objective"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "mid_range",
      "punishable"
    ]
  },
  {
    "name": "Grom",
    "key": "grom",
    "officialClass": "thrower",
    "roles": {
      "primary": "thrower",
      "secondary": "lane"
    },
    "traits": [
      "range",
      "choke_control",
      "burst",
      "anti_static"
    ],
    "draftProfile": [
      "counter",
      "map_dependent"
    ],
    "riskFlags": [
      "dive_prone",
      "weak_at_close_range"
    ]
  },
  {
    "name": "Gus",
    "key": "gus",
    "officialClass": "support",
    "roles": {
      "primary": "support",
      "secondary": "mid"
    },
    "traits": [
      "shield",
      "poke",
      "save",
      "comp_enable"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "low_burst",
      "team_dependent"
    ]
  },
  {
    "name": "Hank",
    "key": "hank",
    "officialClass": "tank",
    "roles": {
      "primary": "tank",
      "secondary": "lane"
    },
    "traits": [
      "pressure",
      "area_denial",
      "anti_tank",
      "bush"
    ],
    "draftProfile": [
      "counter",
      "map_dependent"
    ],
    "riskFlags": [
      "kiteable",
      "reveal_prone"
    ]
  },
  {
    "name": "Jacky",
    "key": "jacky",
    "officialClass": "tank",
    "roles": {
      "primary": "tank",
      "secondary": "lane"
    },
    "traits": [
      "wall_pressure",
      "engage",
      "anti_dive",
      "objective"
    ],
    "draftProfile": [
      "counter",
      "map_dependent"
    ],
    "riskFlags": [
      "short_range",
      "kiteable"
    ]
  },
  {
    "name": "Jae-yong",
    "key": "jae_yong",
    "officialClass": "support",
    "roles": {
      "primary": "support",
      "secondary": "mid"
    },
    "traits": [
      "buff",
      "utility",
      "poke",
      "comp_enable"
    ],
    "draftProfile": [
      "comp_glue",
      "blind"
    ],
    "riskFlags": [
      "team_dependent",
      "low_burst"
    ]
  },
  {
    "name": "Janet",
    "key": "janet",
    "officialClass": "marksman",
    "roles": {
      "primary": "mid",
      "secondary": "lane"
    },
    "traits": [
      "poke",
      "safety",
      "anti_dive",
      "scouting"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "lower_dps",
      "super_tempo_cost"
    ]
  },
  {
    "name": "Jessie",
    "key": "jessie",
    "officialClass": "controller",
    "roles": {
      "primary": "mid",
      "secondary": "lane"
    },
    "traits": [
      "turret",
      "objective",
      "anti_aggro",
      "control"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "fragile",
      "turret_dependent"
    ]
  },
  {
    "name": "Juju",
    "key": "juju",
    "officialClass": "controller",
    "roles": {
      "primary": "thrower",
      "secondary": "support"
    },
    "traits": [
      "zone",
      "summon",
      "control",
      "anti_dive"
    ],
    "draftProfile": [
      "counter",
      "map_dependent"
    ],
    "riskFlags": [
      "assassin_prone",
      "setup_reliant"
    ]
  },
  {
    "name": "Kaze",
    "key": "kaze",
    "officialClass": "assassin",
    "roles": {
      "primary": "assassin",
      "secondary": "lane"
    },
    "traits": [
      "mobility",
      "burst",
      "outplay",
      "finisher"
    ],
    "draftProfile": [
      "counter",
      "last_pick"
    ],
    "riskFlags": [
      "fragile",
      "control_prone"
    ]
  },
  {
    "name": "Kenji",
    "key": "kenji",
    "officialClass": "assassin",
    "roles": {
      "primary": "assassin",
      "secondary": "lane"
    },
    "traits": [
      "dive",
      "sustain",
      "outplay",
      "cleanup"
    ],
    "draftProfile": [
      "counter",
      "last_pick"
    ],
    "riskFlags": [
      "hard_counterable",
      "weak_into_tanks"
    ]
  },
  {
    "name": "Kit",
    "key": "kit",
    "officialClass": "support",
    "roles": {
      "primary": "support",
      "secondary": "assassin"
    },
    "traits": [
      "attach",
      "engage",
      "save",
      "comp_enable"
    ],
    "draftProfile": [
      "comp_glue",
      "counter"
    ],
    "riskFlags": [
      "team_dependent",
      "punishable"
    ]
  },
  {
    "name": "Larry & Lawrie",
    "key": "larry_and_lawrie",
    "officialClass": "controller",
    "roles": {
      "primary": "lane",
      "secondary": "mid"
    },
    "traits": [
      "burst",
      "spawnable",
      "anti_dive",
      "control"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "fragile",
      "summon_dependent"
    ]
  },
  {
    "name": "Leon",
    "key": "leon",
    "officialClass": "assassin",
    "roles": {
      "primary": "assassin",
      "secondary": "lane"
    },
    "traits": [
      "stealth",
      "burst",
      "vision",
      "cleanup"
    ],
    "draftProfile": [
      "counter",
      "last_pick"
    ],
    "riskFlags": [
      "reveal_prone",
      "weak_into_tanks"
    ]
  },
  {
    "name": "Lily",
    "key": "lily",
    "officialClass": "assassin",
    "roles": {
      "primary": "assassin",
      "secondary": "flank"
    },
    "traits": [
      "dive",
      "isolation",
      "burst",
      "mobility"
    ],
    "draftProfile": [
      "counter",
      "last_pick"
    ],
    "riskFlags": [
      "fragile",
      "hard_counterable"
    ]
  },
  {
    "name": "Lola",
    "key": "lola",
    "officialClass": "damage_dealer",
    "roles": {
      "primary": "mid",
      "secondary": "lane"
    },
    "traits": [
      "sustained_dps",
      "safe_damage",
      "objective",
      "control"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "positioning_sensitive",
      "low_utility"
    ]
  },
  {
    "name": "Lou",
    "key": "lou",
    "officialClass": "controller",
    "roles": {
      "primary": "mid",
      "secondary": "support"
    },
    "traits": [
      "freeze",
      "zone",
      "peel",
      "control"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "low_burst",
      "super_value_dependent"
    ]
  },
  {
    "name": "Lumi",
    "key": "lumi",
    "officialClass": "controller",
    "roles": {
      "primary": "mid",
      "secondary": "lane"
    },
    "traits": [
      "poke",
      "control",
      "utility",
      "anti_dive"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "fragile",
      "moderate_dps"
    ]
  },
  {
    "name": "Maisie",
    "key": "maisie",
    "officialClass": "marksman",
    "roles": {
      "primary": "lane",
      "secondary": "mid"
    },
    "traits": [
      "anti_aggro",
      "burst",
      "engage_denial",
      "objective"
    ],
    "draftProfile": [
      "blind",
      "counter"
    ],
    "riskFlags": [
      "aim_reliant",
      "punishable"
    ]
  },
  {
    "name": "Mandy",
    "key": "mandy",
    "officialClass": "marksman",
    "roles": {
      "primary": "mid",
      "secondary": "lane"
    },
    "traits": [
      "long_range",
      "snipe",
      "lane_control",
      "finisher"
    ],
    "draftProfile": [
      "blind",
      "map_dependent"
    ],
    "riskFlags": [
      "immobile_while_aiming",
      "dive_prone"
    ]
  },
  {
    "name": "Max",
    "key": "max",
    "officialClass": "support",
    "roles": {
      "primary": "support",
      "secondary": "lane"
    },
    "traits": [
      "speed",
      "engage",
      "anti_dive",
      "comp_enable"
    ],
    "draftProfile": [
      "comp_glue",
      "blind"
    ],
    "riskFlags": [
      "short_range",
      "low_range_damage"
    ]
  },
  {
    "name": "Meeple",
    "key": "meeple",
    "officialClass": "controller",
    "roles": {
      "primary": "mid",
      "secondary": "support"
    },
    "traits": [
      "control",
      "utility",
      "setup",
      "comp_enable"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "low_carry",
      "team_dependent"
    ]
  },
  {
    "name": "Meg",
    "key": "meg",
    "officialClass": "damage_dealer",
    "roles": {
      "primary": "mid",
      "secondary": "tank"
    },
    "traits": [
      "safe_damage",
      "frontline",
      "objective",
      "anti_tank"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "form_reliant",
      "chip_vulnerable"
    ]
  },
  {
    "name": "Melodie",
    "key": "melodie",
    "officialClass": "assassin",
    "roles": {
      "primary": "lane",
      "secondary": "assassin"
    },
    "traits": [
      "mobility",
      "burst",
      "pressure",
      "objective"
    ],
    "draftProfile": [
      "counter",
      "last_pick"
    ],
    "riskFlags": [
      "commit_heavy",
      "control_prone"
    ]
  },
  {
    "name": "Mico",
    "key": "mico",
    "officialClass": "assassin",
    "roles": {
      "primary": "assassin",
      "secondary": "flank"
    },
    "traits": [
      "mobility",
      "dodge",
      "dive",
      "cleanup"
    ],
    "draftProfile": [
      "counter",
      "last_pick"
    ],
    "riskFlags": [
      "hard_counterable",
      "predictable_landing"
    ]
  },
  {
    "name": "Mina",
    "key": "mina",
    "officialClass": "controller",
    "roles": {
      "primary": "lane",
      "secondary": "mid"
    },
    "traits": [
      "zone",
      "utility",
      "control",
      "poke",
      "anti_aim_reliant"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "fragile",
      "low_burst"
    ]
  },
  {
    "name": "Moe",
    "key": "moe",
    "officialClass": "damage_dealer",
    "roles": {
      "primary": "lane",
      "secondary": "mid"
    },
    "traits": [
      "poke",
      "burst",
      "mobility",
      "control"
    ],
    "draftProfile": [
      "blind",
      "flex"
    ],
    "riskFlags": [
      "fragile",
      "execution_heavy"
    ]
  },
  {
    "name": "Mortis",
    "key": "mortis",
    "officialClass": "assassin",
    "roles": {
      "primary": "assassin",
      "secondary": "flank"
    },
    "traits": [
      "dive",
      "cleanup",
      "anti_thrower",
      "mobility"
    ],
    "draftProfile": [
      "counter",
      "last_pick"
    ],
    "riskFlags": [
      "hard_counterable",
      "weak_into_tanks"
    ]
  },
  {
    "name": "Mr. P",
    "key": "mr_p",
    "officialClass": "controller",
    "roles": {
      "primary": "mid",
      "secondary": "lane"
    },
    "traits": [
      "spawnable",
      "anti_sniper",
      "control",
      "chip"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "low_burst",
      "setup_reliant"
    ]
  },
  {
    "name": "Nani",
    "key": "nani",
    "officialClass": "marksman",
    "roles": {
      "primary": "lane",
      "secondary": "mid"
    },
    "traits": [
      "burst",
      "snipe",
      "anti_tank",
      "finisher"
    ],
    "draftProfile": [
      "counter",
      "blind"
    ],
    "riskFlags": [
      "aim_reliant",
      "fragile"
    ]
  },
  {
    "name": "Nita",
    "key": "nita",
    "officialClass": "damage_dealer",
    "roles": {
      "primary": "lane",
      "secondary": "mid"
    },
    "traits": [
      "summon",
      "pressure",
      "anti_aggro",
      "control"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "short_range",
      "bear_dependent"
    ]
  },
  {
    "name": "Ollie",
    "key": "ollie",
    "officialClass": "tank",
    "roles": {
      "primary": "tank",
      "secondary": "support"
    },
    "traits": [
      "frontline",
      "engage",
      "disruption",
      "peel"
    ],
    "draftProfile": [
      "counter",
      "comp_glue"
    ],
    "riskFlags": [
      "kiteable",
      "short_range"
    ]
  },
  {
    "name": "Otis",
    "key": "otis",
    "officialClass": "controller",
    "roles": {
      "primary": "mid",
      "secondary": "lane"
    },
    "traits": [
      "silence",
      "anti_assassin",
      "control",
      "poke"
    ],
    "draftProfile": [
      "blind",
      "counter"
    ],
    "riskFlags": [
      "low_burst",
      "super_reliant"
    ]
  },
  {
    "name": "Pam",
    "key": "pam",
    "officialClass": "support",
    "roles": {
      "primary": "mid",
      "secondary": "support"
    },
    "traits": [
      "heal",
      "sustain",
      "anti_dive",
      "objective"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "large_hitbox",
      "low_burst"
    ]
  },
  {
    "name": "Pearl",
    "key": "pearl",
    "officialClass": "damage_dealer",
    "roles": {
      "primary": "lane",
      "secondary": "mid"
    },
    "traits": [
      "burst",
      "anti_tank",
      "control",
      "objective"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "heat_management",
      "punishable"
    ]
  },
  {
    "name": "Penny",
    "key": "penny",
    "officialClass": "controller",
    "roles": {
      "primary": "mid",
      "secondary": "lane"
    },
    "traits": [
      "turret",
      "area_denial",
      "objective",
      "splash"
    ],
    "draftProfile": [
      "blind",
      "map_dependent"
    ],
    "riskFlags": [
      "turret_dependent",
      "fragile"
    ]
  },
  {
    "name": "Pierce",
    "key": "pierce",
    "officialClass": "marksman",
    "roles": {
      "primary": "lane",
      "secondary": "mid"
    },
    "traits": [
      "poke",
      "projectile_pressure",
      "anti_tank",
      "range"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "fragile",
      "aim_reliant"
    ]
  },
  {
    "name": "Piper",
    "key": "piper",
    "officialClass": "marksman",
    "roles": {
      "primary": "lane",
      "secondary": "mid"
    },
    "traits": [
      "snipe",
      "burst",
      "wallbreak",
      "finisher"
    ],
    "draftProfile": [
      "blind",
      "counter"
    ],
    "riskFlags": [
      "assassin_prone",
      "aim_reliant"
    ]
  },
  {
    "name": "Poco",
    "key": "poco",
    "officialClass": "support",
    "roles": {
      "primary": "support",
      "secondary": "tank"
    },
    "traits": [
      "heal",
      "sustain",
      "comp_enable",
      "anti_chip"
    ],
    "draftProfile": [
      "comp_glue",
      "blind"
    ],
    "riskFlags": [
      "low_dps",
      "punishable_alone"
    ]
  },
  {
    "name": "R-T",
    "key": "r_t",
    "officialClass": "controller",
    "roles": {
      "primary": "mid",
      "secondary": "lane"
    },
    "traits": [
      "mark",
      "anti_dive",
      "pick",
      "control"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "form_management",
      "moderate_range"
    ]
  },
  {
    "name": "Rico",
    "key": "rico",
    "officialClass": "damage_dealer",
    "roles": {
      "primary": "lane",
      "secondary": "mid"
    },
    "traits": [
      "wall_play",
      "dps",
      "anti_tank",
      "area_control"
    ],
    "draftProfile": [
      "blind",
      "map_dependent"
    ],
    "riskFlags": [
      "assassin_prone",
      "wall_reliant"
    ]
  },
  {
    "name": "Rosa",
    "key": "rosa",
    "officialClass": "tank",
    "roles": {
      "primary": "tank",
      "secondary": "lane"
    },
    "traits": [
      "bush_control",
      "frontline",
      "sustain",
      "anti_dive"
    ],
    "draftProfile": [
      "counter",
      "map_dependent"
    ],
    "riskFlags": [
      "kiteable",
      "weak_into_range"
    ]
  },
  {
    "name": "Ruffs",
    "key": "ruffs",
    "officialClass": "support",
    "roles": {
      "primary": "support",
      "secondary": "mid"
    },
    "traits": [
      "buff",
      "wallbreak",
      "control",
      "comp_enable"
    ],
    "draftProfile": [
      "comp_glue",
      "blind"
    ],
    "riskFlags": [
      "low_burst",
      "team_dependent"
    ]
  },
  {
    "name": "Sam",
    "key": "sam",
    "officialClass": "assassin",
    "roles": {
      "primary": "tank",
      "secondary": "assassin"
    },
    "traits": [
      "engage",
      "sustain",
      "anti_sniper",
      "pressure"
    ],
    "draftProfile": [
      "counter",
      "last_pick"
    ],
    "riskFlags": [
      "short_range",
      "control_prone"
    ]
  },
  {
    "name": "Sandy",
    "key": "sandy",
    "officialClass": "controller",
    "roles": {
      "primary": "mid",
      "secondary": "support"
    },
    "traits": [
      "zone",
      "invisibility",
      "poke",
      "comp_enable"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "low_range_pressure",
      "super_value_dependent"
    ]
  },
  {
    "name": "Shade",
    "key": "shade",
    "officialClass": "assassin",
    "roles": {
      "primary": "assassin",
      "secondary": "flank"
    },
    "traits": [
      "ambush",
      "mobility",
      "burst",
      "cleanup"
    ],
    "draftProfile": [
      "counter",
      "last_pick"
    ],
    "riskFlags": [
      "fragile",
      "reveal_prone"
    ]
  },
  {
    "name": "Shelly",
    "key": "shelly",
    "officialClass": "damage_dealer",
    "roles": {
      "primary": "lane",
      "secondary": "tank_buster"
    },
    "traits": [
      "anti_tank",
      "bush_control",
      "peel",
      "burst"
    ],
    "draftProfile": [
      "counter",
      "comp_glue"
    ],
    "riskFlags": [
      "short_range",
      "kiteable"
    ]
  },
  {
    "name": "Sirius",
    "key": "sirius",
    "officialClass": "controller",
    "roles": {
      "primary": "mid",
      "secondary": "support"
    },
    "traits": [
      "summon",
      "zone",
      "control",
      "comp_enable"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "setup_heavy",
      "summon_management"
    ]
  },
  {
    "name": "Spike",
    "key": "spike",
    "officialClass": "damage_dealer",
    "roles": {
      "primary": "lane",
      "secondary": "mid"
    },
    "traits": [
      "anti_tank",
      "zone",
      "poke",
      "control"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "fragile",
      "aim_dependent"
    ]
  },
  {
    "name": "Sprout",
    "key": "sprout",
    "officialClass": "thrower",
    "roles": {
      "primary": "thrower",
      "secondary": "support"
    },
    "traits": [
      "wall_control",
      "zone",
      "sustain",
      "choke"
    ],
    "draftProfile": [
      "counter",
      "map_dependent"
    ],
    "riskFlags": [
      "dive_prone",
      "low_burst"
    ]
  },
  {
    "name": "Squeak",
    "key": "squeak",
    "officialClass": "controller",
    "roles": {
      "primary": "mid",
      "secondary": "lane"
    },
    "traits": [
      "zone",
      "vision",
      "anti_aggro",
      "control"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "low_burst",
      "projectile_delay"
    ]
  },
  {
    "name": "Stu",
    "key": "stu",
    "officialClass": "assassin",
    "roles": {
      "primary": "lane",
      "secondary": "assassin"
    },
    "traits": [
      "mobility",
      "poke",
      "anti_thrower",
      "outplay"
    ],
    "draftProfile": [
      "blind",
      "flex"
    ],
    "riskFlags": [
      "execution_heavy",
      "aim_reliant"
    ]
  },
  {
    "name": "Surge",
    "key": "surge",
    "officialClass": "damage_dealer",
    "roles": {
      "primary": "lane",
      "secondary": "mid"
    },
    "traits": [
      "scaling",
      "anti_tank",
      "anti_dive",
      "carry"
    ],
    "draftProfile": [
      "counter",
      "snowball"
    ],
    "riskFlags": [
      "needs_upgrade",
      "range_sensitive"
    ]
  },
  {
    "name": "Tara",
    "key": "tara",
    "officialClass": "controller",
    "roles": {
      "primary": "mid",
      "secondary": "support"
    },
    "traits": [
      "pull",
      "vision",
      "anti_spawnable",
      "control"
    ],
    "draftProfile": [
      "counter",
      "comp_glue"
    ],
    "riskFlags": [
      "low_range",
      "super_reliant"
    ]
  },
  {
    "name": "Tick",
    "key": "tick",
    "officialClass": "thrower",
    "roles": {
      "primary": "thrower",
      "secondary": "mid"
    },
    "traits": [
      "zone",
      "vision",
      "stall",
      "choke_control"
    ],
    "draftProfile": [
      "counter",
      "map_dependent"
    ],
    "riskFlags": [
      "dive_prone",
      "low_dps"
    ]
  },
  {
    "name": "Trunk",
    "key": "trunk",
    "officialClass": "tank",
    "roles": {
      "primary": "tank",
      "secondary": "lane"
    },
    "traits": [
      "frontline",
      "area_denial",
      "anti_dive",
      "engage"
    ],
    "draftProfile": [
      "counter",
      "comp_glue"
    ],
    "riskFlags": [
      "short_range",
      "kiteable"
    ]
  },
  {
    "name": "Willow",
    "key": "willow",
    "officialClass": "controller",
    "roles": {
      "primary": "thrower",
      "secondary": "support"
    },
    "traits": [
      "mind_control",
      "zone",
      "anti_frontline",
      "playmaking"
    ],
    "draftProfile": [
      "counter",
      "map_dependent"
    ],
    "riskFlags": [
      "assassin_prone",
      "super_skillshot"
    ]
  },
  {
    "name": "Ziggy",
    "key": "ziggy",
    "officialClass": "controller",
    "roles": {
      "primary": "lane",
      "secondary": "mid"
    },
    "traits": [
      "fear",
      "projectile_pressure",
      "control",
      "anti_dive"
    ],
    "draftProfile": [
      "blind",
      "comp_glue"
    ],
    "riskFlags": [
      "fragile",
      "moderate_dps"
    ]
  }
];
