const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`GET ${path} failed: ${res.status} ${text}`);
    }
    return res.json() as Promise<T>;
}

async function apiPost<T>(path: string, body?: any): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`POST ${path} failed: ${res.status} ${text}`);
    }
    return res.json() as Promise<T>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
            'content-type': 'application/json',
            ...(init?.headers ?? {}),
        },
    })

    if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `HTTP ${res.status}`)
    }

    return (await res.json()) as T
}

/** ====== Types (based on your backend responses) ====== */

export type Category = 'ranked' | 'ladder' | 'special' | 'all';
export type Perspective = 'pro' | 'enemy' | 'all';

export type MapItem = {
    map: string
    mode: string | null
    battles: number
    lastSeen: string
}

export type MapsResponse = {
    since: string;
    category: Category;
    items: MapItem[];
};

export type TopCompItem = {
    compKey: string;
    brawlers: string[];
    brawlerIds: number[];
    picks: number;
    wins: number;
    winRate: number;
    lastSeen: string;
};

export type TopCompsResponse = {
    map: string;
    since: string;
    category: Category;
    items: TopCompItem[];
};

export type MatchupItem = {
    proCompKey: string;
    proBrawlers: string[];
    proBrawlerIds: number[];

    enemyCompKey: string;
    enemyBrawlers: string[];
    enemyBrawlerIds: number[];

    games: number;
    proWins: number;
    proLosses: number;
    draws: number;
    winRate: number;
    lastSeen: string;
};

export type MatchupsResponse = {
    map: string;
    since: string;
    category: Category;
    items: MatchupItem[];
};

export type TrackedPlayer = {
    id: string;
    tag: string;
    name: string | null;
    source: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
};

export type ImportClubResponse = {
    ok?: boolean
    error?: string
    clubTag?: string
    clubName?: string | null
    membersFound?: number
    imported?: number
    replaceActive?: boolean
    limit?: number
}

export type BestBrawlerItem = {
    brawlerId: number
    brawler: string
    picks: number
    wins: number
    winRate: number
    pickRate: number
    lastSeen: string
}

export type BestBrawlersResponse = {
    map: string
    since: string
    category: Category
    mode: string | null
    items: BestBrawlerItem[]
}

export type AnalyzerVsItem = {
    enemyBrawlerId: number
    enemyBrawler: string
    games: number
    wins: number
    winRate: number
    lastSeen: string
}

export type AnalyzerItem = {
    brawlerId: number
    brawler: string
    vs: AnalyzerVsItem[]
}

export type AnalyzerResponse = {
    map: string
    since: string
    category: 'ranked'
    mode: string | null
    minGames: number
    items: AnalyzerItem[]
}

export type BrawlerLite = { id: number; name: string }
export type BrawlersResponse = { items: BrawlerLite[] }

export type RankedHelperItem = {
    brawlerId: number
    brawler: string
    score: number
    base: { picks: number; wins: number; winRate: number; component: number }
    counters: Array<{ enemyBrawlerId: number; enemyBrawler: string; games: number; wins: number; winRate: number }>
    synergies: Array<{ mateBrawlerId: number; mateBrawler: string; games: number; wins: number; winRate: number }>
    lastSeen: string
}

export type RankedHelperResponse = {
    map: string
    since: string
    category: 'ranked'
    mode: string | null
    ally: number[]
    enemy: number[]
    weights: { base: number; counters: number; synergies: number }
    items: RankedHelperItem[]
}

/** ====== Endpoints ====== */

export const api = {
    // GET /maps
    maps: (params: { days?: number; category?: Category; mode?: string }) => {
        const days = params.days ?? 7;
        const category = params.category ?? 'all';

        const q = new URLSearchParams();
        q.set('days', String(days));
        q.set('category', category);
        if (params.mode && params.mode.trim()) q.set('mode', params.mode.trim());

        return apiGet<MapsResponse>(`/maps?${q.toString()}`);
    },

    topComps: (params: { map: string; days?: number; category?: Category; playerTag?: string; perspective?: Perspective; mode?: string }) => {
        const days = params.days ?? 7;
        const category = params.category ?? 'all';
        const perspective = params.perspective ?? 'all';

        const q = new URLSearchParams();
        q.set('map', params.map);
        if (params.mode) q.set('mode', params.mode);
        q.set('days', String(days));
        q.set('category', category);
        q.set('perspective', perspective);
        if (params.playerTag) q.set('playerTag', params.playerTag);

        return apiGet<TopCompsResponse>(`/maps/top-comps?${q.toString()}`);
    },

    matchups: (params: { map: string; days?: number; category?: Category; playerTag?: string; mode?: string }) => {
        const days = params.days ?? 7;
        const category = params.category ?? 'all';

        const q = new URLSearchParams();
        q.set('map', params.map);
        if (params.mode) q.set('mode', params.mode);
        q.set('days', String(days));
        q.set('category', category);
        if (params.playerTag) q.set('playerTag', params.playerTag);

        return apiGet<MatchupsResponse>(`/maps/matchups?${q.toString()}`);
    },

    bestBrawlers: (params: { map: string; days?: number; category?: Category; mode?: string }) => {
        const usp = new URLSearchParams()
        usp.set('map', params.map)
        if (params.days) usp.set('days', String(params.days))
        if (params.category) usp.set('category', params.category)
        if (params.mode) usp.set('mode', params.mode)
        return request<BestBrawlersResponse>(`/maps/best-brawlers?${usp.toString()}`)
    },

    analyzer: (params: { map: string; days?: number; mode?: string; minGames?: number }) => {
        const usp = new URLSearchParams()
        usp.set('map', params.map)
        if (params.days) usp.set('days', String(params.days))
        if (params.mode) usp.set('mode', params.mode)
        if (params.minGames) usp.set('minGames', String(params.minGames))
        return request<AnalyzerResponse>(`/maps/analyzer?${usp.toString()}`)
    },

    // tracked
    trackedList: () => apiGet<TrackedPlayer[]>(`/tracked`),

    trackedAdd: (body: { tag: string; name?: string | null }) =>
        apiPost<{ ok: true; tag: string }>(`/tracked`, body),

    trackedDisable: (body: { tag: string }) =>
        apiPost<{ ok: true; tag: string; active: boolean | null }>(`/tracked/disable`, body),

    // admin
    adminCollectNow: () => apiPost<{ processed: number }>(`/admin/collect-now`),

    adminLoadTop: (params: { country?: string; limit?: number; replaceActive?: boolean }) => {
        const q = new URLSearchParams();
        q.set('country', params.country ?? 'global');
        q.set('limit', String(params.limit ?? 200));
        q.set('replaceActive', String(params.replaceActive ?? false));
        return apiPost<any>(`/admin/load-top?${q.toString()}`);
    },
    importClub: (params: { clubTag: string; replaceActive?: boolean; limit?: number }) => {
        const usp = new URLSearchParams()
        usp.set('clubTag', params.clubTag)
        if (typeof params.replaceActive === 'boolean') usp.set('replaceActive', String(params.replaceActive))
        if (typeof params.limit === 'number') usp.set('limit', String(params.limit))

        return fetch(`${API_BASE}/admin/import-club?${usp.toString()}`, { method: 'POST' })
            .then(async (r) => {
                const data = await r.json().catch(() => ({}))
                if (!r.ok) throw new Error(data?.message ?? data?.error ?? 'Request failed')
                return data as ImportClubResponse
            })
    },
    async brawlers(): Promise<BrawlersResponse> {
        return request('/brawlers')
    },
    async rankedHelper(args: {
        map: string
        days: number
        mode?: string
        allyIds?: number[]
        enemyIds?: number[]
        limit?: number
    }): Promise<RankedHelperResponse> {
        const sp = new URLSearchParams()
        sp.set('map', args.map)
        sp.set('days', String(args.days))
        if (args.mode) sp.set('mode', args.mode)
        if (args.allyIds?.length) sp.set('ally', args.allyIds.join(','))
        if (args.enemyIds?.length) sp.set('enemy', args.enemyIds.join(','))
        if (args.limit) sp.set('limit', String(args.limit))
        return request(`/maps/ranked-helper?${sp.toString()}`)
    },
};