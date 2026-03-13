import { Fragment, useEffect, useMemo, useState } from 'react'
import { api } from '../shared/api'
import { useAuth } from '../shared/auth'
import type { BrawlerLite, MapItem, RankedHelperItem, RankedHelperResponse } from '../shared/api'
import s from './RankedHelperPage.module.scss'

const DRAFT_REASON_LEGEND: Record<string, string> = {
    'Missing mid': 'Your draft has no stable mid yet.',
    'Needs lane': 'Your draft still needs a natural lane brawler.',
    'Needs support': 'Your current picks are light on utility and peel.',
    'Anti-tank value': 'Enemy draft already shows frontline or tank pressure.',
    'Anti-dive value': 'This pick helps punish or peel against enemy aggro.',
    'Thrower pressure': 'Enemy draft is vulnerable to dive or thrower pressure.',
    'Anti-spawnable': 'Enemy comp has summon pressure this pick can answer.',
    'Anti-heal': 'Enemy draft has healing that this brawler can reduce.',
    'Anti-aim value': 'Enemy draft has aim-reliant brawlers this pick can make less consistent.',
    'Enables allies': 'This pick boosts the tempo or survivability of your current core.',
    'Open-map value': 'This map favors range, poke, and safer long-lane pressure.',
    'Open-map risk': 'This map gives enemy range more room to punish short-range picks.',
    'Mid-control map': 'This map rewards stable mid control and center presence.',
    'Lane-pressure map': 'This map rewards reliable side-lane pressure.',
    'Thrower map': 'Walls and choke points make thrower pressure more valuable here.',
    'Wallbreak value': 'Breaking key walls opens strong angles on this map.',
    'Anti-thrower map': 'This map often rewards picks that can pressure throwers.',
    'Bush/vision value': 'Bush control and reveal tools are especially useful here.',
    'Tank map': 'This map gives tanks more workable space and cover.',
    'Assassin angles': 'The map offers flanks and approach paths for dive threats.',
    'Zone-control map': 'This map rewards sustained control over key areas.',
    'Gem-carry map': 'This map values control, stability, and carry support.',
    'Objective value': 'This map rewards damage patterns that pressure the objective well.',
    'Pick potential': 'This map creates strong punish windows for pick-based brawlers.',
    'Blind pick': 'Safer early in the draft before more enemy information appears.',
    'Draft glue': 'Fits many different team shapes as the draft develops.',
    'Flexible slot': 'Still keeps your draft open while adding useful pressure.',
    'Counter window': 'There is enough enemy info for this pick to gain counter value.',
    'Strong punish pick': 'This profile is strongest when the draft is almost complete.',
    'Counter-finisher': 'Late draft state gives this brawler more direct punish value.',
}

const STAR_LEGEND = {
    label: '★',
    detail: 'The star marks a brawler you saved in Profile settings as one of your most skilled picks. Ranked Helper gives it a moderate personal preference boost.',
}

function slugifyBrawler(name: string) {
    return name
        .trim()
        .toLowerCase()
        .replace(/['"]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
}

function pickWrBadge(wr: number) {
    if (wr >= 0.55) return s.good
    if (wr <= 0.45) return s.bad
    return s.mid
}

type SlotTeam = 'ally' | 'enemy'

function BrawlerPicker({
    title,
    brawlers,
    picked,
    onPick,
    onRemove,
    max,
}: {
    title: string
    brawlers: BrawlerLite[]
    picked: number[]
    onPick: (id: number) => void
    onRemove: (id: number) => void
    max: number
}) {
    const [q, setQ] = useState('')
    const pickedSet = useMemo(() => new Set(picked), [picked])

    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase()
        if (!query) return brawlers
        return brawlers.filter((b) => b.name.toLowerCase().includes(query))
    }, [brawlers, q])

    const handlePick = (id: number) => {
        if (pickedSet.has(id) || picked.length >= max) return
        onPick(id)
        setQ('')
    }

    return (
        <div className={s.picker}>
            <div className={s.pickerHead}>
                <div className={s.pickerTitle}>{title}</div>
                <div className={s.pickerCount}>{picked.length}/{max}</div>
            </div>

            <div className={s.slots}>
                {Array.from({ length: max }).map((_, idx) => {
                    const id = picked[idx]
                    const br = id ? brawlers.find((b) => b.id === id) : null
                    const img = br ? `/brawlers/${slugifyBrawler(br.name)}.webp` : ''
                    return (
                        <button
                            key={idx}
                            className={s.slot}
                            type="button"
                            onClick={() => (id ? onRemove(id) : null)}
                            title={id ? 'Remove' : 'Empty'}
                        >
                            {br ? (
                                <>
                                    <img
                                        className={s.slotImg}
                                        src={img}
                                        alt={br.name}
                                        loading="lazy"
                                        onError={(e) => {
                                            ;(e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
                                        }}
                                    />
                                    <div className={s.slotName}>{br.name}</div>
                                </>
                            ) : (
                                <div className={s.slotEmpty}>+</div>
                            )}
                        </button>
                    )
                })}
            </div>

            <input
                className={s.search}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search brawler..."
            />

            <div className={s.grid}>
                {filtered.map((b) => {
                    const disabled = pickedSet.has(b.id) || picked.length >= max
                    const img = `/brawlers/${slugifyBrawler(b.name)}.webp`
                    return (
                        <button
                            key={b.id}
                            type="button"
                            className={s.iconBtn}
                            disabled={disabled}
                            onClick={() => handlePick(b.id)}
                            title={b.name}
                        >
                            <img
                                className={s.iconImg}
                                src={img}
                                alt={b.name}
                                loading="lazy"
                                onError={(e) => {
                                    ;(e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
                                }}
                            />
                            <div className={s.iconName}>{b.name}</div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

function CounterBlock({ item }: { item: RankedHelperItem }) {
    if (item.counters.positive.length === 0) {
        return <div className={s.muted2}>No positive counter data yet.</div>
    }

    return (
        <>
            {item.counters.positive.slice(0, 3).map((counter) => (
                <div key={counter.enemyBrawlerId} className={s.line}>
                    <span className={s.k}>vs {counter.enemyBrawler}</span>
                    <span className={pickWrBadge(counter.winRate)}>
                        {(counter.winRate * 100).toFixed(1)}%
                    </span>
                    <span className={s.v}>{counter.games} games</span>
                </div>
            ))}
        </>
    )
}

function SynergyBlock({ item }: { item: RankedHelperItem }) {
    if (item.synergies.positive.length === 0) {
        return <div className={s.muted2}>No positive synergy data yet.</div>
    }

    return (
        <>
            {item.synergies.positive.slice(0, 2).map((synergy) => (
                <div key={synergy.mateBrawlerId} className={s.line}>
                    <span className={s.k}>with {synergy.mateBrawler}</span>
                    <span className={pickWrBadge(synergy.winRate)}>
                        {(synergy.winRate * 100).toFixed(1)}%
                    </span>
                    <span className={s.v}>{synergy.games} games</span>
                </div>
            ))}
        </>
    )
}

export default function RankedHelperPage() {
    const { user } = useAuth()
    const [days, setDays] = useState(30)
    const [mode, setMode] = useState<string>('')
    const [map, setMap] = useState<string>('')
    const [showLegend, setShowLegend] = useState(false)

    const [maps, setMaps] = useState<MapItem[]>([])
    const [brawlers, setBrawlers] = useState<BrawlerLite[]>([])

    const [ally, setAlly] = useState<number[]>([])
    const [enemy, setEnemy] = useState<number[]>([])

    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState<string | null>(null)
    const [result, setResult] = useState<RankedHelperResponse | null>(null)

    useEffect(() => {
        if (!user) {
            setDays(30)
            return
        }

        let alive = true
        api.profileMe()
            .then((profile) => {
                if (!alive) return
                setDays(profile.preferredDays ?? 30)
            })
            .catch(() => {
                if (!alive) return
                setDays(30)
            })

        return () => {
            alive = false
        }
    }, [user])

    useEffect(() => {
        let alive = true
        setErr(null)

        api.maps({ days, category: 'ranked', activeWithinDays: 3 })
            .then((res) => {
                if (!alive) return
                setMaps(res.items ?? [])
                if (!map && res.items?.[0]?.map) {
                    setMap(res.items[0].map)
                    setMode(res.items[0].mode ?? '')
                }
            })
            .catch((e) => {
                if (!alive) return
                setErr(e instanceof Error ? e.message : String(e))
            })

        return () => {
            alive = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        let alive = true
        api.brawlers()
            .then((res) => {
                if (!alive) return
                setBrawlers(res.items ?? [])
            })
            .catch((e) => {
                if (!alive) return
                setErr(e instanceof Error ? e.message : String(e))
            })
        return () => {
            alive = false
        }
    }, [])

    const fetchSuggest = async () => {
        if (!map) return
        setLoading(true)
        setErr(null)
        try {
            const res = await api.rankedHelper({
                map,
                days,
                mode: mode.trim() || undefined,
                allyIds: ally,
                enemyIds: enemy,
                limit: 12,
            })
            if ((res as { error?: string }).error) setErr((res as { error?: string }).error ?? 'Unknown error')
            else setResult(res)
        } catch (e) {
            setErr(e instanceof Error ? e.message : String(e))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSuggest()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, days, mode, ally.join(','), enemy.join(',')])

    const pickedAll = useMemo(() => new Set([...ally, ...enemy]), [ally, enemy])

    const groupedMaps = useMemo(() => {
        const byMode = new Map<string, string[]>()

        for (const it of maps) {
            const currentMode = (it.mode ?? 'unknown').trim() || 'unknown'
            const currentMap = (it.map ?? '').trim()
            if (!currentMap) continue

            const arr = byMode.get(currentMode) ?? []
            if (!arr.includes(currentMap)) arr.push(currentMap)
            byMode.set(currentMode, arr)
        }

        for (const [, arr] of byMode) arr.sort((a, b) => a.localeCompare(b))

        const modes = Array.from(byMode.keys()).sort((a, b) => a.localeCompare(b))

        return modes.map((entryMode) => ({ mode: entryMode, maps: byMode.get(entryMode)! }))
    }, [maps])

    const legendItems = useMemo(() => {
        return [...Object.keys(DRAFT_REASON_LEGEND).sort((a, b) => a.localeCompare(b)), STAR_LEGEND.label]
            .map((label) => ({
                label,
                detail: label === STAR_LEGEND.label ? STAR_LEGEND.detail : (DRAFT_REASON_LEGEND[label] ?? ''),
            }))
    }, [])

    const addPick = (team: SlotTeam, id: number) => {
        if (pickedAll.has(id)) return
        if (team === 'ally') setAlly((prev) => (prev.length >= 3 ? prev : [...prev, id]))
        else setEnemy((prev) => (prev.length >= 3 ? prev : [...prev, id]))
    }

    const removePick = (team: SlotTeam, id: number) => {
        if (team === 'ally') setAlly((prev) => prev.filter((x) => x !== id))
        else setEnemy((prev) => prev.filter((x) => x !== id))
    }

    return (
        <div className="container">
            <div className={s.page}>
                <div className={s.top}>
                    <div>
                        <h2 className={s.title}>Ranked Helper</h2>
                        <div className={s.sub}>Map-aware picks, draft fit, synergies, counters</div>
                    </div>
                    <div className={s.controls}>
                        <label className={s.field}>
                            <div className={s.label}>Map</div>
                            <select
                                className={s.select}
                                value={`${mode ?? ''}||${map}`}
                                onChange={(e) => {
                                    const value = e.target.value
                                    if (value.startsWith('__hdr__')) return
                                    const [nextMode, nextMap] = value.split('||')
                                    setAlly([])
                                    setEnemy([])
                                    setResult(null)
                                    setMode(nextMode === 'unknown' ? '' : (nextMode ?? ''))
                                    setMap(nextMap ?? '')
                                }}
                            >
                                {groupedMaps.map((group) => (
                                    <Fragment key={group.mode}>
                                        <option value={`__hdr__${group.mode}`} disabled>
                                            --- {group.mode} ---
                                        </option>

                                        {group.maps.map((groupMap) => (
                                            <option key={`${group.mode}||${groupMap}`} value={`${group.mode}||${groupMap}`}>
                                                {groupMap}
                                            </option>
                                        ))}
                                    </Fragment>
                                ))}
                            </select>
                        </label>
                        <label className={s.field}>
                            <div className={s.label}>Days</div>
                            <input
                                className={s.input}
                                type="number"
                                min={7}
                                max={60}
                                value={days}
                                onChange={(e) => setDays(Math.max(7, Math.min(60, Number(e.target.value) || 30)))}
                            />
                        </label>
                        <button className={s.btn} type="button" onClick={fetchSuggest} disabled={loading || !map}>
                            {loading ? 'Analyzing...' : 'Refresh'}
                        </button>
                    </div>
                </div>
                {err && <div className={s.err}>{err}</div>}
                <div className={s.layout}>
                    <div className={s.suggestions}>
                        <div className={s.sHead}>
                            <div>
                                <div className={s.sTitle}>Suggested picks</div>
                            </div>
                            <div className={s.sMeta}>
                                {legendItems.length > 0 && (
                                    <button
                                        className={s.legendToggle}
                                        type="button"
                                        onClick={() => setShowLegend((prev) => !prev)}
                                    >
                                        {showLegend ? 'Hide legend' : 'Show legend'}
                                    </button>
                                )}
                                {result ? (
                                    <>
                                        <span className={s.tag}>ranked</span>
                                        <span className={s.tag}>{result.mode ? result.mode : 'all modes'}</span>
                                    </>
                                ) : (
                                    <span className={s.tag}>-</span>
                                )}
                            </div>
                        </div>

                        {showLegend && legendItems.length > 0 && (
                            <div className={s.legend}>
                                {legendItems.map((item) => (
                                    <div key={item.label} className={s.legendItem}>
                                        <span className={item.label === STAR_LEGEND.label ? s.legendStar : s.legendTag}>
                                            {item.label}
                                        </span>
                                        <span className={s.legendText}>{item.detail}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!loading && (!result || result.items.length === 0) && (
                            <div className={s.muted}>No suggestions yet (select a map or increase days).</div>
                        )}

                        <div className={s.sGrid}>
                            {(result?.items ?? []).map((item) => {
                                const img = `/brawlers/${slugifyBrawler(item.brawler)}.webp`
                                return (
                                    <div key={item.brawlerId} className={s.card}>
                                        {item.userPreference?.preferred && <div className={s.preferenceStar}>★</div>}
                                        <div className={s.cardTop}>
                                            <img
                                                className={s.cardImg}
                                                src={img}
                                                alt={item.brawler}
                                                loading="lazy"
                                                onError={(e) => {
                                                    ;(e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
                                                }}
                                            />
                                            <div>
                                                <div className={s.cardName}>{item.brawler}</div>
                                                <div className={s.cardScore}>Score: {item.score.toFixed(3)}</div>
                                            </div>
                                        </div>

                                        <div className={s.lines}>
                                            <div className={s.line}>
                                                <span className={s.k}>Map WR</span>
                                                <span className={pickWrBadge(item.base.winRate)}>
                                                    {(item.base.winRate * 100).toFixed(1)}%
                                                </span>
                                                <span className={s.v}>{item.base.picks} picks</span>
                                            </div>

                                            {item.draft.reasons.some((reason) => reason.impact >= 0) && (
                                                <div className={s.block}>
                                                    <div className={s.blockTitle}>Draft tags</div>
                                                    <div className={s.reasonTags}>
                                                        {item.draft.reasons
                                                            .filter((reason) => reason.impact >= 0)
                                                            .map((reason, idx) => (
                                                                <span key={`${item.brawlerId}-${idx}`} className={s.reasonTag}>
                                                                    {reason.label}
                                                                </span>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}

                                            {enemy.length > 0 && (
                                                <div className={s.block}>
                                                    <div className={s.blockTitle}>Best counters</div>
                                                    <CounterBlock item={item} />
                                                </div>
                                            )}

                                            {ally.length > 0 && (
                                                <div className={s.block}>
                                                    <div className={s.blockTitle}>Best synergy</div>
                                                    <SynergyBlock item={item} />
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            className={s.pickBtn}
                                            type="button"
                                            disabled={pickedAll.has(item.brawlerId) || ally.length >= 3}
                                            onClick={() => addPick('ally', item.brawlerId)}
                                        >
                                            Pick
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className={s.ally}>
                        <BrawlerPicker
                            title="Your team"
                            brawlers={brawlers}
                            picked={ally}
                            onPick={(id) => addPick('ally', id)}
                            onRemove={(id) => removePick('ally', id)}
                            max={3}
                        />
                    </div>

                    <div className={s.enemy}>
                        <BrawlerPicker
                            title="Enemy team"
                            brawlers={brawlers}
                            picked={enemy}
                            onPick={(id) => addPick('enemy', id)}
                            onRemove={(id) => removePick('enemy', id)}
                            max={3}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
