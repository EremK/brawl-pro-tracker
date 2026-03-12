import { useEffect, useState } from 'react'
import s from './AuthForm.module.scss'
import app from '../App.module.scss'

type Props = {
    onLogin: (args: { email: string; password: string }) => Promise<void>
    onRegister: (args: { email: string; password: string; name?: string | null }) => Promise<void>
}

export default function AuthForm({ onLogin, onRegister }: Props) {
    const [mode, setMode] = useState<'login' | 'register' | null>(null)
    const [renderPanel, setRenderPanel] = useState(false)
    const [panelOpen, setPanelOpen] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    useEffect(() => {
        if (mode) {
            setRenderPanel(true)
            const frame = window.requestAnimationFrame(() => setPanelOpen(true))
            return () => window.cancelAnimationFrame(frame)
        }

        setPanelOpen(false)
        if (!renderPanel) {
            return
        }

        const timeout = window.setTimeout(() => setRenderPanel(false), 220)
        return () => window.clearTimeout(timeout)
    }, [mode, renderPanel])

    const submit = async () => {
        setLoading(true)
        setErr(null)
        try {
            if (mode === 'login') {
                await onLogin({ email, password })
            } else {
                await onRegister({ email, password, name: name.trim() || null })
            }

            setPassword('')
        } catch (e: any) {
            setErr(e?.message ?? String(e))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={s.box}>
            <div className={s.tabs}>
                <button
                    className={`${app.navButton} ${mode === 'login' ? app.active : ''}`}
                    type="button"
                    onClick={() => setMode((prev) => (prev === 'login' ? null : 'login'))}
                >
                    Log in
                </button>
                <button
                    className={`${app.navButton} ${mode === 'register' ? app.active : ''}`}
                    type="button"
                    onClick={() => setMode((prev) => (prev === 'register' ? null : 'register'))}
                >
                    Register
                </button>
            </div>

            {renderPanel && (
                <div className={`${s.panel} ${panelOpen ? s.panelOpen : s.panelClosed}`}>
                    <div className={s.fields}>
                        {mode === 'register' && (
                            <input
                                className="uiInput"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Name (optional)"
                            />
                        )}

                        <input
                            className="uiInput"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                        />

                        <input
                            className="uiInput"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                        />
                    </div>

                    <button
                        className={`${app.navButton} ${app.active}`}
                        type="button"
                        onClick={submit}
                        disabled={loading || !email.trim() || !password}
                    >
                        {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
                    </button>

                    {err && <div className="err">{err}</div>}
                </div>
            )}
        </div>
    )
}
