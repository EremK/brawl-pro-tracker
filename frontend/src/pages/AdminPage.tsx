import { useState } from 'react'
import { api } from '../shared/api'
import s from './AdminPage.module.scss'

export default function AdminPage() {
    const [country, setCountry] = useState('global')
    const [limit, setLimit] = useState(200)
    const [replaceActive, setReplaceActive] = useState(false)

    const [out, setOut] = useState<any>(null)
    const [err, setErr] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const [clubTag, setClubTag] = useState('')
    const [clubLimit, setClubLimit] = useState(30)

    const [importLoading, setImportLoading] = useState(false)
    const [importMsg, setImportMsg] = useState<string | null>(null)

    async function onImportClub() {
        const tag = clubTag.trim()
        if (!tag) {
            setImportMsg('Enter club tag')
            return
        }

        setImportLoading(true)
        setImportMsg(null)
        try {
            const res = await api.importClub({ clubTag: tag, limit: clubLimit, replaceActive })
            if (res.error) setImportMsg(`Error: ${res.error}`)
            else setImportMsg(`Imported ${res.imported ?? 0}/${res.membersFound ?? 0} from ${res.clubName ?? res.clubTag ?? 'club'}`)
        } catch (e: any) {
            setImportMsg(e?.message ?? String(e))
        } finally {
            setImportLoading(false)
        }
    }

    const run = async (fn: () => Promise<any>) => {
        setLoading(true)
        setErr(null)
        try {
            const res = await fn()
            setOut(res)
        } catch (e: any) {
            setErr(e?.message ?? String(e))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container">
            <div className="rowBetween">
                <h2 className="pageTitle">Admin</h2>
                <button className="btn btnPrimary" onClick={() => run(() => api.adminCollectNow())} disabled={loading}>
                    Collect now
                </button>
            </div>

            <div className={s.grid} style={{ marginTop: 12 }}>
                <div className={s.block}>
                    <div className="rowBetween">
                        <div>
                            <div style={{ fontWeight: 900 }}>Load top players</div>
                            <div className="muted2" style={{ fontSize: 12 }}>Imports leaderboard players into tracked list</div>
                        </div>
                        <span className="badge"><span className="badgeDot" /> leaderboard</span>
                    </div>

                    <div className={s.row} style={{ marginTop: 12 }}>
                        <div className="uiField">
                            <div className="uiLabel">Country</div>
                            <input className="uiInput" value={country} onChange={(e) => setCountry(e.target.value)} />
                        </div>

                        <div className="uiField">
                            <div className="uiLabel">Limit</div>
                            <input className="uiInput" type="number" min={1} max={200} value={limit} onChange={(e) => setLimit(Number(e.target.value) || 200)} />
                        </div>

                        <label className="pill" style={{ alignSelf: 'center' }}>
                            <input type="checkbox" checked={replaceActive} onChange={(e) => setReplaceActive(e.target.checked)} />
                            <span>replaceActive</span>
                        </label>

                        <button className="btn btnPrimary" onClick={() => run(() => api.adminLoadTop({ country, limit, replaceActive }))} disabled={loading}>
                            Load top
                        </button>
                    </div>
                </div>

                <div className={s.block}>
                    <div className="rowBetween">
                        <div>
                            <div style={{ fontWeight: 900 }}>Import club members</div>
                            <div className="muted2" style={{ fontSize: 12 }}>Adds all club members to tracked list</div>
                        </div>
                        <span className="badge"><span className="badgeDot" /> club</span>
                    </div>

                    <div className={s.row} style={{ marginTop: 12 }}>
                        <div className="uiField">
                            <div className="uiLabel">Club tag</div>
                            <input className="uiInput" value={clubTag} onChange={(e) => setClubTag(e.target.value)} placeholder="#2PPU0G8" />
                        </div>

                        <div className="uiField">
                            <div className="uiLabel">Limit</div>
                            <input className="uiInput" type="number" min={1} max={200} value={clubLimit} onChange={(e) => setClubLimit(Math.max(1, Math.min(200, Number(e.target.value) || 30)))} />
                        </div>

                        <button className="btn btnPrimary" onClick={onImportClub} disabled={importLoading}>
                            {importLoading ? 'Importing…' : 'Import'}
                        </button>
                    </div>

                    {importMsg && <div className="muted" style={{ marginTop: 10 }}>{importMsg}</div>}
                </div>
            </div>

            {err && <div className="err" style={{ marginTop: 12 }}>{err}</div>}

            {out && (
                <div className={s.output} style={{ marginTop: 12 }}>
                    <pre style={{ margin: 0, color: 'var(--text)' }}>{JSON.stringify(out, null, 2)}</pre>
                </div>
            )}
        </div>
    )
}