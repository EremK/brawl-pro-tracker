import { useEffect, useState } from 'react'
import { api } from '../shared/api'
import type { TrackedPlayer } from '../shared/api'
import s from './TrackedPage.module.scss'

export default function TrackedPage() {
    const [items, setItems] = useState<TrackedPlayer[]>([])
    const [tag, setTag] = useState('')
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    const load = async () => {
        setLoading(true)
        setErr(null)
        try {
            const res = await api.trackedList()
            setItems(res)
        } catch (e: any) {
            setErr(e?.message ?? String(e))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const onAdd = async () => {
        setErr(null)
        try {
            await api.trackedAdd({ tag: tag.trim(), name: name.trim() || null })
            setTag('')
            setName('')
            await load()
        } catch (e: any) {
            setErr(e?.message ?? String(e))
        }
    }

    const onDisable = async (t: string) => {
        setErr(null)
        try {
            await api.trackedDisable({ tag: t })
            await load()
        } catch (e: any) {
            setErr(e?.message ?? String(e))
        }
    }

    return (
        <div className="container">
            <div className="rowBetween">
                <h2 className="pageTitle">Tracked players</h2>
                <button className="btn" onClick={load} disabled={loading}>Refresh</button>
            </div>

            <div className={s.wrap} style={{ marginTop: 12 }}>
                <div className={s.formRow}>
                    <div className="uiField">
                        <div className="uiLabel">Player tag</div>
                        <input className="uiInput" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="#92QGPQQJ" />
                    </div>

                    <div className="uiField" style={{ minWidth: 220 }}>
                        <div className="uiLabel">Optional name</div>
                        <input className="uiInput" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
                    </div>

                    <button className="btn btnPrimary" onClick={onAdd} disabled={!tag.trim()}>
                        Add
                    </button>
                </div>

                {err && <div className="err" style={{ marginTop: 12 }}>{err}</div>}

                <div className={s.list}>
                    {items.map((p) => (
                        <div key={p.id} className={s.item}>
                            <div>
                                <div style={{ fontWeight: 900 }}>{p.tag} {p.name ? <span className="muted">({p.name})</span> : null}</div>
                                <div className="statLine">source: {p.source} • active: {String(p.active)}</div>
                            </div>

                            <button className={`btn ${p.active ? 'btnDanger' : ''}`} onClick={() => onDisable(p.tag)} disabled={!p.active}>
                                Disable
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}