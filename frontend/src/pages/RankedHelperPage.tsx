import { useEffect, useMemo, useState } from 'react'
import { api } from '../shared/api'
import type { BrawlerLite, MapItem, RankedHelperResponse } from '../shared/api'
import s from './RankedHelperPage.module.scss'

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
        const s = q.trim().toLowerCase()
        if (!s) return brawlers
        return brawlers.filter(b => b.name.toLowerCase().includes(s))
    }, [brawlers, q])

    return (
        <div className={s.picker}>
            <div className={s.pickerHead}>
                <div className={s.pickerTitle}>{title}</div>
                <div className={s.pickerCount}>{picked.length}/{max}</div>
            </div>

            <div className={s.slots}>
                {Array.from({ length: max }).map((_, idx) => {
                    const id = picked[idx]
                    const br = id ? brawlers.find(b => b.id === id) : null
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
                                            ; (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
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
                placeholder="Search brawler…"
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
                            onClick={() => onPick(b.id)}
                            title={b.name}
                        >
                            <img
                                className={s.iconImg}
                                src={img}
                                alt={b.name}
                                loading="lazy"
                                onError={(e) => {
                                    ; (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
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

export default function RankedHelperPage() {
    const [days, setDays] = useState(7)
    const [mode, setMode] = useState<string>('') // optional
    const [map, setMap] = useState<string>('')

    const [maps, setMaps] = useState<MapItem[]>([])
    const [brawlers, setBrawlers] = useState<BrawlerLite[]>([])

    const [ally, setAlly] = useState<number[]>([])
    const [enemy, setEnemy] = useState<number[]>([])

    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState<string | null>(null)
    const [result, setResult] = useState<RankedHelperResponse | null>(null)

    // load ranked maps list
    useEffect(() => {
        let alive = true
        setErr(null)

        api.maps({ days, category: 'ranked' })
            .then((res) => {
                if (!alive) return
                setMaps(res.items ?? [])
                if (!map && res.items?.[0]?.map) setMap(res.items[0].map)
            })
            .catch((e) => {
                if (!alive) return
                setErr(e instanceof Error ? e.message : String(e))
            })

        return () => { alive = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // load brawlers list once
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
        return () => { alive = false }
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
            if ((res as any)?.error) setErr((res as any).error)
            else setResult(res)
        } catch (e: any) {
            setErr(e?.message ?? String(e))
        } finally {
            setLoading(false)
        }
    }

    // auto-run when core inputs change (feels “smart”)
    useEffect(() => {
        fetchSuggest()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, days, mode, ally.join(','), enemy.join(',')])

    const pickedAll = useMemo(() => new Set([...ally, ...enemy]), [ally, enemy])

    const addPick = (team: SlotTeam, id: number) => {
        if (pickedAll.has(id)) return
        if (team === 'ally') setAlly((prev) => (prev.length >= 3 ? prev : [...prev, id]))
        else setEnemy((prev) => (prev.length >= 3 ? prev : [...prev, id]))
    }

    const removePick = (team: SlotTeam, id: number) => {
        if (team === 'ally') setAlly((prev) => prev.filter(x => x !== id))
        else setEnemy((prev) => prev.filter(x => x !== id))
    }

    return (
        <div className="container">
            <div className={s.page}>
                <div className={s.top}>
                    <div>
                        <h2 className={s.title}>Ranked Helper</h2>
                        <div className={s.sub}>Map-aware picks • synergy • counters • ranked only</div>
                    </div>
                    <div className={s.controls}>
                        <label className={s.field}>
                            <div className={s.label}>Map</div>
                            <select className={s.select} value={map} onChange={(e) => setMap(e.target.value)}>
                                {Array.from(new Set(maps.map(m => m.map))).map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </label>
                        <label className={s.field}>
                            <div className={s.label}>Days</div>
                            <input
                                className={s.input}
                                type="number"
                                min={1}
                                max={30}
                                value={days}
                                onChange={(e) => setDays(Math.max(1, Math.min(30, Number(e.target.value) || 7)))}
                            />
                        </label>
                        <label className={s.field}>
                            <div className={s.label}>Mode (optional)</div>
                            <input
                                className={s.input}
                                value={mode}
                                onChange={(e) => setMode(e.target.value)}
                                placeholder="e.g. brawlBall"
                            />
                        </label>
                        <button className={s.btn} type="button" onClick={fetchSuggest} disabled={loading || !map}>
                            {loading ? 'Analyzing…' : 'Refresh'}
                        </button>
                    </div>
                </div>
                {err && <div className={s.err}>{err}</div>}
                <div className={s.layout}>
                    {/* Suggestions first - full width */}
                    <div className={s.suggestions}>
                        <div className={s.sHead}>
                            <div>
                                <div className={s.sTitle}>Suggested picks</div>
                            </div>
                            <div className={s.sMeta}>
                                {result ? (
                                    <>
                                        <span className={s.tag}>ranked</span>
                                        <span className={s.tag}>{result.mode ? result.mode : 'all modes'}</span>
                                    </>
                                ) : (
                                    <span className={s.tag}>—</span>
                                )}
                            </div>
                        </div>

                        {!loading && (!result || result.items.length === 0) && (
                            <div className={s.muted}>No suggestions yet (select a map / increase days).</div>
                        )}

                        <div className={s.sGrid}>
                            {(result?.items ?? []).map((it) => {
                                const img = `/brawlers/${slugifyBrawler(it.brawler)}.webp`
                                return (
                                    <div key={it.brawlerId} className={s.card}>
                                        <div className={s.cardTop}>
                                            <img
                                                className={s.cardImg}
                                                src={img}
                                                alt={it.brawler}
                                                loading="lazy"
                                                onError={(e) => {
                                                    ; (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
                                                }}
                                            />
                                            <div>
                                                <div className={s.cardName}>{it.brawler}</div>
                                                <div className={s.cardScore}>Score: {it.score.toFixed(3)}</div>
                                            </div>
                                        </div>

                                        <div className={s.lines}>
                                            <div className={s.line}>
                                                <span className={s.k}>Map WR</span>
                                                <span className={pickWrBadge(it.base.winRate)}>
                                                    {(it.base.winRate * 100).toFixed(1)}%
                                                </span>
                                                <span className={s.v}>{it.base.picks} picks</span>
                                            </div>

                                            {enemy.length > 0 && (
                                                <div className={s.block}>
                                                    <div className={s.blockTitle}>Best counters</div>
                                                    {it.counters.length === 0 ? (
                                                        <div className={s.muted2}>No positive counter data yet.</div>
                                                    ) : (
                                                        it.counters.slice(0, 3).map((c) => (
                                                            <div key={c.enemyBrawlerId} className={s.line}>
                                                                <span className={s.k}>vs {c.enemyBrawler}</span>
                                                                <span className={pickWrBadge(c.winRate)}>
                                                                    {(c.winRate * 100).toFixed(1)}%
                                                                </span>
                                                                <span className={s.v}>{c.games} games</span>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}

                                            {ally.length > 0 && (
                                                <div className={s.block}>
                                                    <div className={s.blockTitle}>Best synergy</div>
                                                    {it.synergies.length === 0 ? (
                                                        <div className={s.muted2}>No positive synergy data yet.</div>
                                                    ) : (
                                                        it.synergies.slice(0, 2).map((x) => (
                                                            <div key={x.mateBrawlerId} className={s.line}>
                                                                <span className={s.k}>with {x.mateBrawler}</span>
                                                                <span className={pickWrBadge(x.winRate)}>
                                                                    {(x.winRate * 100).toFixed(1)}%
                                                                </span>
                                                                <span className={s.v}>{x.games} games</span>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            className={s.pickBtn}
                                            type="button"
                                            disabled={pickedAll.has(it.brawlerId) || ally.length >= 3}
                                            onClick={() => addPick('ally', it.brawlerId)}
                                        >
                                            Pick
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Below: 2 pickers side-by-side */}
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
