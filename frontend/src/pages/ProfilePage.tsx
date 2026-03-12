import { Fragment, useEffect, useMemo, useState } from 'react'
import { api } from '../shared/api'
import { useAuth } from '../shared/auth'
import s from './ProfilePage.module.scss'

type Category = 'ranked' | 'ladder'

const CATEGORIES: Category[] = ['ranked', 'ladder']
const PROFILE_DAYS = 60

function formatDate(value: string | null | undefined) {
    if (!value) return 'Unknown date'

    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
        return date.toLocaleString()
    }

    return value
}

export default function ProfilePage() {
    const { user } = useAuth()
    const [tag, setTag] = useState('')
    const [loading, setLoading] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const [err, setErr] = useState<string | null>(null)
    const [profile, setProfile] = useState<Awaited<ReturnType<typeof api.profileMe>> | null>(null)
    const [modes, setModes] = useState<Record<Category, any[]>>({ ranked: [], ladder: [] })
    const [brawlers, setBrawlers] = useState<Record<Category, any[]>>({ ranked: [], ladder: [] })
    const [matches, setMatches] = useState<Record<Category, any[]>>({ ranked: [], ladder: [] })
    const [rankedMaps, setRankedMaps] = useState<Array<{ map: string; mode: string | null; battles: number; lastSeen: string }>>([])
    const [selectedRankedMap, setSelectedRankedMap] = useState('')
    const [selectedRankedMode, setSelectedRankedMode] = useState('')
    const [rankedMapBrawlers, setRankedMapBrawlers] = useState<any[]>([])

    const load = async () => {
        setLoading(true)
        setErr(null)

        try {
            const profileRes = await api.profileMe()
            setProfile(profileRes)
            setTag(profileRes.playerTag ?? '')

            if (!profileRes.playerTag) {
                setModes({ ranked: [], ladder: [] })
                setBrawlers({ ranked: [], ladder: [] })
                setMatches({ ranked: [], ladder: [] })
                setRankedMaps([])
                setSelectedRankedMap('')
                setSelectedRankedMode('')
                setRankedMapBrawlers([])
                return
            }

            const [rankedModes, ladderModes, rankedBrawlers, ladderBrawlers, rankedMatches, ladderMatches] = await Promise.all([
                api.profileModes({ days: PROFILE_DAYS, category: 'ranked' }),
                api.profileModes({ days: PROFILE_DAYS, category: 'ladder' }),
                api.profileBrawlers({ days: PROFILE_DAYS, category: 'ranked' }),
                api.profileBrawlers({ days: PROFILE_DAYS, category: 'ladder' }),
                api.profileMatches({ days: PROFILE_DAYS, category: 'ranked' }),
                api.profileMatches({ days: PROFILE_DAYS, category: 'ladder' }),
            ])
            const rankedMapsRes = await api.profileMaps({ days: PROFILE_DAYS, category: 'ranked' })

            setModes({ ranked: rankedModes.items, ladder: ladderModes.items })
            setBrawlers({ ranked: rankedBrawlers.items, ladder: ladderBrawlers.items })
            setMatches({ ranked: rankedMatches.items, ladder: ladderMatches.items })
            setRankedMaps(rankedMapsRes.items)

            if (rankedMapsRes.items.length) {
                const hasCurrent = rankedMapsRes.items.some(
                    (item) => item.map === selectedRankedMap && (item.mode ?? '') === selectedRankedMode,
                )
                const next = hasCurrent
                    ? { map: selectedRankedMap, mode: selectedRankedMode }
                    : { map: rankedMapsRes.items[0].map, mode: rankedMapsRes.items[0].mode ?? '' }

                setSelectedRankedMap(next.map)
                setSelectedRankedMode(next.mode)
            } else {
                setSelectedRankedMap('')
                setSelectedRankedMode('')
                setRankedMapBrawlers([])
            }
        } catch (e: any) {
            setErr(e?.message ?? String(e))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void load()
    }, [])

    useEffect(() => {
        if (!selectedRankedMap) {
            setRankedMapBrawlers([])
            return
        }

        let alive = true
        api.profileBrawlersByMap({
            map: selectedRankedMap,
            mode: selectedRankedMode || undefined,
            days: PROFILE_DAYS,
            category: 'ranked',
        })
            .then((res) => {
                if (!alive) return
                setRankedMapBrawlers(res.items)
            })
            .catch((e: any) => {
                if (!alive) return
                setErr(e?.message ?? String(e))
            })

        return () => {
            alive = false
        }
    }, [selectedRankedMap, selectedRankedMode])

    const groupedRankedMaps = useMemo(() => {
        const byMode = new Map<string, string[]>()

        for (const item of rankedMaps) {
            const mode = (item.mode ?? 'unknown').trim() || 'unknown'
            const map = (item.map ?? '').trim()
            if (!map) continue

            const arr = byMode.get(mode) ?? []
            if (!arr.includes(map)) arr.push(map)
            byMode.set(mode, arr)
        }

        for (const [, arr] of byMode) arr.sort((a, b) => a.localeCompare(b))

        return Array.from(byMode.keys())
            .sort((a, b) => a.localeCompare(b))
            .map((mode) => ({ mode, maps: byMode.get(mode)! }))
    }, [rankedMaps])

    const onSaveTag = async () => {
        setSyncing(true)
        setErr(null)
        try {
            await api.profileSetTag({ tag })
            await load()
        } catch (e: any) {
            setErr(e?.message ?? String(e))
        } finally {
            setSyncing(false)
        }
    }

    const onSync = async () => {
        setSyncing(true)
        setErr(null)
        try {
            await api.profileSync()
            await load()
        } catch (e: any) {
            setErr(e?.message ?? String(e))
        } finally {
            setSyncing(false)
        }
    }

    return (
        <div className="container">
            <div className="rowBetween">
                <div>
                    <h2 className="pageTitle">Profile</h2>
                    <div className="muted2" style={{ marginTop: 6 }}>
                        Personal tracking for {user?.email}
                    </div>
                </div>

                <div className="muted2">
                    Last sync: {profile?.lastSyncedAt ? formatDate(profile.lastSyncedAt) : 'never'}
                </div>
            </div>

            <div className={s.setup}>
                <div className="uiField" style={{ flex: 1 }}>
                    <div className="uiLabel">Your Brawl Stars tag</div>
                    <input
                        className="uiInput"
                        value={tag}
                        onChange={(e) => setTag(e.target.value)}
                        placeholder="#8J2LQ9RP"
                    />
                </div>

                <button className="btn btnPrimary" type="button" onClick={onSaveTag} disabled={syncing || !tag.trim()}>
                    Save tag
                </button>

                <button className="btn" type="button" onClick={onSync} disabled={syncing || !profile?.playerTag}>
                    {syncing ? 'Syncing...' : 'Sync now'}
                </button>
            </div>

            {profile?.playerTag && (
                <div className={s.overview}>
                    <div className={s.identityCard}>
                        <div>
                            <div className={s.identityName}>{profile.playerName ?? 'Unknown player'}</div>
                            <div className="muted2">{profile.playerTag}</div>
                            <div className="muted2">{profile.clubName ? `Club: ${profile.clubName}` : 'No club info yet'}</div>
                        </div>
                    </div>

                    <div className={s.statCards}>
                        <div className="kpi">
                            <div className="kpiLabel">Trophies</div>
                            <div className="kpiValue">{profile.trophies ?? '—'}</div>
                        </div>
                        <div className="kpi">
                            <div className="kpiLabel">3v3 Victories</div>
                            <div className="kpiValue">{profile.victories3v3 ?? '—'}</div>
                        </div>
                    </div>
                </div>
            )}

            {err && <div className="err" style={{ marginTop: 12 }}>{err}</div>}
            {loading && <div className="muted" style={{ marginTop: 12 }}>Loading...</div>}

            {!loading && !profile?.playerTag && (
                <div className={s.empty}>
                    Add your player tag to start personal tracking. This data is stored separately and does not affect the pro-analysis endpoints.
                </div>
            )}

            {!loading && profile?.playerTag && (
                <div className={s.sections}>
                    {CATEGORIES.map((category) => (
                        <section key={category} className={s.section}>
                            <div className={s.sectionHeader}>
                                <h3 className={s.sectionTitle}>{category === 'ranked' ? 'Ranked' : 'Ladder (3v3 only)'}</h3>
                            </div>

                            <div className={s.grid}>
                                <div className="panel">
                                    <div className={s.panelTitle}>My best gamemodes</div>
                                    <div className="tableList">
                                        {modes[category].map((item) => (
                                            <div key={`${category}-${item.mode}`} className={s.row}>
                                                <span>{item.mode}</span>
                                                <span>{(item.winRate * 100).toFixed(1)}% • {item.battles} battles</span>
                                            </div>
                                        ))}
                                        {modes[category].length === 0 && <div className="muted">No data yet.</div>}
                                    </div>
                                </div>

                                <div className="panel">
                                    <div className={s.panelTitle}>My best brawlers</div>
                                    <div className="tableList">
                                        {brawlers[category].map((item) => (
                                            <div key={`${category}-${item.brawlerId}`} className={s.row}>
                                                <span>{item.brawler}</span>
                                                <span>{(item.winRate * 100).toFixed(1)}% • {item.picks} picks</span>
                                            </div>
                                        ))}
                                        {brawlers[category].length === 0 && <div className="muted">No data yet.</div>}
                                    </div>
                                </div>
                            </div>

                            {category === 'ranked' && (
                                <div className="panel">
                                    <div className={s.panelHeader}>
                                        <div className={s.panelTitle}>Best brawlers by map</div>
                                        <div className={s.mapControl}>
                                            <div className="uiField">
                                                <div className="uiLabel">Map</div>
                                                <select
                                                    className="uiSelect"
                                                    value={`${selectedRankedMode}||${selectedRankedMap}`}
                                                    onChange={(e) => {
                                                        const value = e.target.value
                                                        if (value.startsWith('__hdr__')) return
                                                        const [mode, map] = value.split('||')
                                                        setSelectedRankedMode(mode === 'unknown' ? '' : mode)
                                                        setSelectedRankedMap(map)
                                                    }}
                                                >
                                                    {!groupedRankedMaps.length && <option value="">No ranked maps yet</option>}
                                                    {groupedRankedMaps.map((group) => (
                                                        <Fragment key={group.mode}>
                                                            <option value={`__hdr__${group.mode}`} disabled>
                                                                --- {group.mode} ---
                                                            </option>
                                                            {group.maps.map((map) => (
                                                                <option key={`${group.mode}||${map}`} value={`${group.mode}||${map}`}>
                                                                    {map}
                                                                </option>
                                                            ))}
                                                        </Fragment>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="tableList">
                                        {rankedMapBrawlers.map((item) => (
                                            <div key={`map-${item.brawlerId}`} className={s.row}>
                                                <span>{item.brawler}</span>
                                                <span>{(item.winRate * 100).toFixed(1)}% • {item.picks} picks</span>
                                            </div>
                                        ))}
                                        {selectedRankedMap && rankedMapBrawlers.length === 0 && <div className="muted">No map-specific data yet.</div>}
                                    </div>
                                </div>
                            )}

                            <div className="panel">
                                <div className={s.panelTitle}>Match history</div>
                                <div className="tableList">
                                    {matches[category].map((item) => (
                                        <div key={item.battleId} className={s.row}>
                                            <span>{item.map} • {item.mode}</span>
                                            <span>{item.result ?? 'unknown'} • {formatDate(item.battleTime)}</span>
                                        </div>
                                    ))}
                                    {matches[category].length === 0 && <div className="muted">No data yet.</div>}
                                </div>
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    )
}
