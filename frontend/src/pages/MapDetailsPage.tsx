import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../shared/api'
import { useAuth } from '../shared/auth'
import type {
    Category,
    MatchupItem,
    TopCompItem,
    BestBrawlerItem,
    AnalyzerItem,
    TopCompsResponse,
    BestBrawlersResponse,
    AnalyzerResponse,
    MatchupsResponse,
} from '../shared/api'

import s from './MapDetailsPage.module.scss'

function slugifyBrawler(name: string) {
    return name
        .trim()
        .toLowerCase()
        .replace(/['"]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
}

function wrClass(wr: number) {
    if (wr >= 0.55) return s.wrGood
    if (wr <= 0.45) return s.wrBad
    return ''
}

export default function MapDetailsPage() {
    const { user } = useAuth()
    const { map: mapParam } = useParams()
    const mapName = decodeURIComponent(mapParam ?? '')
    const [sp] = useSearchParams()
    const modeFromUrl = sp.get('mode') ?? undefined
    const catFromUrl = (sp.get('cat') as Category | null) ?? null

    // controls
    const [days, setDays] = useState(30)
    const [category, setCategory] = useState<Category>('ranked')
    const [mode, setMode] = useState<string>(modeFromUrl ?? 'all')
    const [showMatchups, setShowMatchups] = useState(false)
    const [minGames, setMinGames] = useState(3)

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
        if (modeFromUrl) setMode(modeFromUrl)
        if (catFromUrl) setCategory(catFromUrl)
    }, [modeFromUrl, catFromUrl])

    // data
    const [topComps, setTopComps] = useState<TopCompItem[]>([])
    const [bestBrawlers, setBestBrawlers] = useState<BestBrawlerItem[]>([])
    const [analyzer, setAnalyzer] = useState<AnalyzerItem[]>([])
    const [matchups, setMatchups] = useState<MatchupItem[]>([])

    // loading/errors
    const [loadingTop, setLoadingTop] = useState(false)
    const [loadingBest, setLoadingBest] = useState(false)
    const [loadingAn, setLoadingAn] = useState(false)
    const [loadingMu, setLoadingMu] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    const modeParam = mode === 'all' ? undefined : mode

    // Top comps
    useEffect(() => {
        let alive = true
        if (!mapName) return

        setLoadingTop(true)
        setErr(null)

        api
            .topComps({ map: mapName, days, category, perspective: 'all', mode: modeParam })
            .then((res: TopCompsResponse) => {
                if (!alive) return
                setTopComps(res.items ?? [])
            })
            .catch((e: unknown) => {
                if (!alive) return
                setErr(e instanceof Error ? e.message : String(e))
            })
            .finally(() => {
                if (!alive) return
                setLoadingTop(false)
            })

        return () => {
            alive = false
        }
    }, [mapName, days, category, modeParam])

    // Best brawlers
    useEffect(() => {
        let alive = true
        if (!mapName) return

        setLoadingBest(true)
        setErr(null)

        api
            .bestBrawlers({ map: mapName, days, category, mode: modeParam })
            .then((res: BestBrawlersResponse) => {
                if (!alive) return
                setBestBrawlers(res.items ?? [])
            })
            .catch((e: unknown) => {
                if (!alive) return
                setErr(e instanceof Error ? e.message : String(e))
            })
            .finally(() => {
                if (!alive) return
                setLoadingBest(false)
            })

        return () => {
            alive = false
        }
    }, [mapName, days, category, modeParam])

    // Analyzer (ranked only)
    useEffect(() => {
        let alive = true
        if (!mapName) return

        if (category !== 'ranked') {
            setAnalyzer([])
            setLoadingAn(false)
            return
        }

        setLoadingAn(true)
        setErr(null)

        api
            .analyzer({ map: mapName, days, mode: modeParam, minGames })
            .then((res: AnalyzerResponse) => {
                if (!alive) return
                setAnalyzer(res.items ?? [])
            })
            .catch((e: unknown) => {
                if (!alive) return
                setErr(e instanceof Error ? e.message : String(e))
            })
            .finally(() => {
                if (!alive) return
                setLoadingAn(false)
            })

        return () => {
            alive = false
        }
    }, [mapName, days, category, modeParam, minGames])

    // Matchups (optional)
    useEffect(() => {
        let alive = true
        if (!mapName) return

        if (!showMatchups) {
            setMatchups([])
            return
        }

        setLoadingMu(true)
        setErr(null)

        api
            .matchups({ map: mapName, days, category, mode: modeParam })
            .then((res: MatchupsResponse) => {
                if (!alive) return
                setMatchups(res.items ?? [])
            })
            .catch((e: unknown) => {
                if (!alive) return
                setErr(e instanceof Error ? e.message : String(e))
            })
            .finally(() => {
                if (!alive) return
                setLoadingMu(false)
            })

        return () => {
            alive = false
        }
    }, [mapName, days, category, modeParam, showMatchups])

    const bestBrawlersSorted = useMemo(() => {
        return [...bestBrawlers].sort((a, b) => {
            const as = a.winRate * 0.7 + a.pickRate * 0.3
            const bs = b.winRate * 0.7 + b.pickRate * 0.3
            return bs - as
        })
    }, [bestBrawlers])

    const kpi = useMemo(() => {
        const top = topComps?.[0]
        const best = bestBrawlersSorted?.[0]
        const an = analyzer?.[0]
        return {
            topComp: top ? `${top.brawlers.join(' • ')}` : '—',
            topWr: top ? `${(top.winRate * 100).toFixed(1)}%` : '—',
            bestB: best ? best.brawler : '—',
            bestWr: best ? `${(best.winRate * 100).toFixed(1)}%` : '—',
            anB: an ? an.brawler : '—',
            anVs: an ? `${an.vs.length}` : '—',
        }
    }, [topComps, bestBrawlersSorted, analyzer])

    return (
        <div>
            <div className={s.header}>
                <div className="container">
                    <div className={s.headerInner}>
                        <div>
                            <h2 className="pageTitle">{mapName}</h2>
                            <div className="kpis" style={{ marginTop: 10 }}>
                                <div className="kpi">
                                    <div className="kpiLabel">Top comp WR</div>
                                    <div className="kpiValue">{kpi.topWr}</div>
                                    <div className="muted2" style={{ fontSize: 12 }}>
                                        {kpi.topComp}
                                    </div>
                                </div>
                                <div className="kpi">
                                    <div className="kpiLabel">Best brawler WR</div>
                                    <div className="kpiValue">{kpi.bestWr}</div>
                                    <div className="muted2" style={{ fontSize: 12 }}>
                                        {kpi.bestB}
                                    </div>
                                </div>
                                <div className="kpi">
                                    <div className="kpiLabel">Analyzer leader</div>
                                    <div className="kpiValue">{kpi.anVs}</div>
                                    <div className="muted2" style={{ fontSize: 12 }}>
                                        {kpi.anB}
                                    </div>
                                </div>
                                <span className="badge" style={{ alignSelf: 'center' }}>
                                    <span className="badgeDot" />
                                    {modeParam ? `Mode: ${modeParam}` : 'All modes'}
                                </span>
                            </div>
                        </div>

                        <Link className={s.backLink} to="/">
                            ← Back
                        </Link>
                    </div>

                    <div className={s.controls}>
                        <div className="uiField">
                            <div className="uiLabel">Days</div>
                            <input
                                className="uiInput"
                                type="number"
                                min={7}
                                max={60}
                                value={days}
                                onChange={(e) => setDays(Math.max(7, Math.min(60, Number(e.target.value) || 30)))}
                            />
                        </div>

                        <div className="uiField">
                            <div className="uiLabel">Category</div>
                            <select className="uiSelect" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                                <option value="ranked">ranked</option>
                                <option value="ladder">ladder</option>
                                <option value="special">special</option>
                                <option value="all">all</option>
                            </select>
                        </div>

                        <div className="uiField" style={{ minWidth: 220 }}>
                            <div className="uiLabel">Mode</div>
                            <input className="uiInput" value={mode} onChange={(e) => setMode(e.target.value)} placeholder="all or e.g. brawlBall" />
                            <div className="uiHelp">Use “all” or exact backend mode string</div>
                        </div>

                        <div className={s.controlsRight}>
                            <label className={s.toggleRow}>
                                <input type="checkbox" checked={showMatchups} onChange={(e) => setShowMatchups(e.target.checked)} />
                                <span className="muted">Show raw matchups</span>
                            </label>

                            <div className="uiField" style={{ minWidth: 170 }}>
                                <div className="uiLabel">Analyzer min games</div>
                                <input
                                    className="uiInput"
                                    type="number"
                                    min={2}
                                    max={200}
                                    value={minGames}
                                    onChange={(e) => setMinGames(Math.max(2, Math.min(200, Number(e.target.value) || 10)))}
                                    disabled={category !== 'ranked'}
                                />
                            </div>
                        </div>
                    </div>

                    {err && <div className="err" style={{ marginTop: 12 }}>{err}</div>}
                </div>
            </div>

            <div className="container">
                <div className={`${s.grid} ${category !== 'ranked' ? s.noAnalyzer : ''}`}>
                    {/* ANALYZER (moved to top-left position) */}
                    {category === 'ranked' && (
                        <div className={`panel ${s.panelAnalyzer}`}>
                            <div className={s.panelHeader}>
                                <h3 className={s.panelTitle}>Analyzer</h3>
                                <div className={s.panelSub}>ranked only • pro perspective • positive WR</div>
                            </div>

                            {loadingAn && <div className="muted">Loading…</div>}

                            {!loadingAn && analyzer.length === 0 && (
                                <div className="muted">Not enough data. Increase Days or lower min games.</div>
                            )}

                            {!loadingAn && analyzer.length > 0 && (
                                <div className={`tableList listScroll ${s.listBox}`}>
                                    {analyzer.slice(0, 18).map((a) => {
                                        const img = `/brawlers/${slugifyBrawler(a.brawler)}.webp`

                                        return (
                                            <div key={a.brawlerId} className={s.anBlock}>
                                                <div className={s.anHeader}>
                                                    <div className={s.anLeft}>
                                                        <img
                                                            className={s.anImg}
                                                            src={img}
                                                            alt={a.brawler}
                                                            loading="lazy"
                                                            onError={(e) => {
                                                                ; (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
                                                            }}
                                                        />
                                                        <div>
                                                            <div className={s.anTitle}>{a.brawler}</div>
                                                            <div className="muted2" style={{ fontSize: 12 }}>
                                                                {a.vs.length} positive matchups
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <span className="badge">Top 3 shown</span>
                                                </div>

                                                <div className={s.vsList}>
                                                    {a.vs.slice(0, 3).map((v) => (
                                                        <div key={`${a.brawlerId}-${v.enemyBrawlerId}`} className={s.vsRow}>
                                                            <span>{v.enemyBrawler}</span>
                                                            <span className={wrClass(v.winRate)}>
                                                                {(v.winRate * 100).toFixed(1)}% • {v.games} games
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {a.vs.length > 3 && <div className="muted2">…and {a.vs.length - 3} more</div>}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* BEST BRAWLERS */}
                    <div className={`panel ${s.panelBest}`}>
                        <div className={s.panelHeader}>
                            <h3 className={s.panelTitle}>Best brawlers</h3>
                            <div className={s.panelSub}>{loadingBest ? 'Loading…' : 'Pickrate + Winrate (both sides)'}</div>
                        </div>

                        {!loadingBest && bestBrawlersSorted.length === 0 && <div className="muted">No data.</div>}

                        <div className={`tableList listScroll ${s.listBox}`}>
                            {bestBrawlersSorted.slice(0, 40).map((b) => {
                                const img = `/brawlers/${slugifyBrawler(b.brawler)}.webp`
                                return (
                                    <div key={b.brawlerId} className={s.brawlerRow}>
                                        <img
                                            className={s.brawlerImg}
                                            src={img}
                                            alt={b.brawler}
                                            loading="lazy"
                                            onError={(e) => {
                                                ; (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
                                            }}
                                        />
                                        <div>
                                            <div className={s.brawlerName}>{b.brawler}</div>
                                            <div className="statLine">Last seen: {new Date(b.lastSeen).toLocaleString()}</div>
                                        </div>
                                        <div className={s.brawlerStats}>
                                            <div className={wrClass(b.winRate)}>{(b.winRate * 100).toFixed(1)}% WR</div>
                                            <div className="muted2">
                                                {(b.pickRate * 100).toFixed(1)}% PR • {b.picks} picks
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* TOP COMPS (moved below analyzer) */}
                    <div className={`panel ${s.panelTop}`}>
                        <div className={s.panelHeader}>
                            <h3 className={s.panelTitle}>Top comps</h3>
                            <div className={s.panelSub}>{loadingTop ? 'Loading…' : `${topComps.length} comps`}</div>
                        </div>

                        {!loadingTop && topComps.length === 0 && <div className="muted">No data.</div>}

                        <div className={`tableList listScroll ${s.listBox}`}>
                            {topComps.map((c) => (
                                <div key={c.compKey} className={s.row}>
                                    <div className={s.rowTop}>
                                        <div className={s.rowTitle}>{c.brawlers.join(' • ')}</div>
                                        <div className={`${s.rowRight} ${wrClass(c.winRate)}`}>
                                            {c.picks} picks • {(c.winRate * 100).toFixed(1)}% WR
                                        </div>
                                    </div>
                                    <div className={s.rowFoot}>
                                        <span>Last seen: {new Date(c.lastSeen).toLocaleString()}</span>
                                        <span className="pill">compKey: {c.compKey}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* MATCHUPS */}
                    <div className={`panel ${s.panelMatchups}`}>
                        <div className={s.panelHeader}>
                            <h3 className={s.panelTitle}>Raw matchups</h3>
                            <div className={s.panelSub}>
                                {showMatchups ? (loadingMu ? 'Loading…' : `${matchups.length} rows`) : 'Hidden by default'}
                            </div>
                        </div>

                        {!showMatchups && <div className="muted">Enable “Show raw matchups”.</div>}
                        {showMatchups && !loadingMu && matchups.length === 0 && <div className="muted">No data.</div>}

                        {showMatchups && matchups.length > 0 && (
                            <div className={`tableList listScroll ${s.listBox}`}>
                                {matchups.map((m) => (
                                    <div key={`${m.proCompKey}-${m.enemyCompKey}`} className={s.row}>
                                        <div className={s.rowTop}>
                                            <div className={s.rowTitle}>{m.proBrawlers.join(' • ')}</div>
                                            <div className={`${s.rowRight} ${wrClass(m.winRate)}`}>
                                                vs {m.enemyBrawlers.join(' • ')} • {(m.winRate * 100).toFixed(1)}% • {m.games} games
                                            </div>
                                        </div>
                                        <div className={s.rowFoot}>
                                            <span>Last seen: {new Date(m.lastSeen).toLocaleString()}</span>
                                            <span className="pill">
                                                pro: {m.proCompKey} • en: {m.enemyCompKey}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
