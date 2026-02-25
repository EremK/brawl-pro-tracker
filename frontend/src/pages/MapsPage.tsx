import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../shared/api'
import type { Category, MapItem } from '../shared/api'
import s from './MapsPage.module.scss'

type ModeFilter = 'all' | string

export default function MapsPage() {
    const [days, setDays] = useState(7)
    const [category, setCategory] = useState<Category>('ranked')
    const [mode, setMode] = useState<ModeFilter>('all')
    const [q, setQ] = useState('')

    const [items, setItems] = useState<MapItem[]>([])
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    useEffect(() => {
        let alive = true
        setLoading(true)
        setErr(null)

        api
            .maps({ days, category, mode: mode === 'all' ? undefined : mode })
            .then((res) => {
                if (!alive) return
                setItems(res.items)
            })
            .catch((e) => {
                if (!alive) return
                setErr(e?.message ?? String(e))
            })
            .finally(() => {
                if (!alive) return
                setLoading(false)
            })

        return () => {
            alive = false
        }
    }, [days, category, mode])

    const modes = useMemo(() => {
        const set = new Set<string>()
        for (const it of items) if (it.mode) set.add(it.mode)
        return ['all', ...Array.from(set).sort()]
    }, [items])

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase()
        if (!s) return items
        return items.filter((i) => {
            const mapOk = (i.map ?? '').toLowerCase().includes(s)
            const modeOk = (i.mode ?? '').toLowerCase().includes(s)
            return mapOk || modeOk
        })
    }, [items, q])

    useEffect(() => {
        if (mode === 'all') return
        if (!modes.includes(mode)) setMode('all')
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modes.join('|')])

    return (
        <div className="container">
            <div className={s.toolbar}>
                <div className="uiField">
                    <div className="uiLabel">Days</div>
                    <input
                        className="uiInput"
                        type="number"
                        min={1}
                        max={30}
                        value={days}
                        onChange={(e) => setDays(Math.max(1, Math.min(30, Number(e.target.value) || 7)))}
                    />
                </div>

                <div className="uiField">
                    <div className="uiLabel">Category</div>
                    <select className="uiSelect" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                        <option value="all">all</option>
                        <option value="ranked">ranked</option>
                        <option value="ladder">ladder</option>
                        <option value="special">special</option>
                    </select>
                </div>

                <div className="uiField">
                    <div className="uiLabel">Mode</div>
                    <select className="uiSelect" value={mode} onChange={(e) => setMode(e.target.value)}>
                        {modes.map((m) => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>

                <div className="uiField" style={{ flex: 1, minWidth: 220 }}>
                    <div className="uiLabel">Search map / mode</div>
                    <input
                        className="uiInput"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="e.g. Hideout or brawlBall"
                    />
                </div>
            </div>

            {loading && <div className="muted" style={{ marginTop: 12 }}>Loading…</div>}
            {err && <div className="err" style={{ marginTop: 12 }}>{err}</div>}

            <div className={s.list}>
                {filtered.map((m) => {
                    const key = `${m.map}__${m.mode ?? ''}`
                    const to = `/maps/${encodeURIComponent(m.map)}?cat=${encodeURIComponent(category)}${m.mode ? `&mode=${encodeURIComponent(m.mode)}` : ''}`

                    return (
                        <Link key={key} to={to} className={s.cardLink}>
                            <div className={s.topRow}>
                                <div className={s.mapName}>{m.map}</div>
                                <div className={s.right}>
                                    {m.mode ?? '—'} • {m.battles} battles
                                </div>
                            </div>
                            <div className="statLine">Last seen: {new Date(m.lastSeen).toLocaleString()}</div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}