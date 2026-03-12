import { NavLink, Route, Routes, Link } from 'react-router-dom'
import MapsPage from './pages/MapsPage'
import TrackedPage from './pages/TrackedPage'
import AdminPage from './pages/AdminPage'
import MapDetailsPage from './pages/MapDetailsPage'
import RankedHelperPage from './pages/RankedHelperPage.tsx'
import ProfilePage from './pages/ProfilePage'
import AuthForm from './components/AuthForm'
import { useAuth } from './shared/auth'

import s from './App.module.scss'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `${s.navLink} ${isActive ? s.active : ''}`

function AdminOnlyPage({ isAdmin, child }: { isAdmin: boolean; child: JSX.Element }) {
  return isAdmin ? child : <MapsPage />
}

function AuthOnlyPage({ signedIn, child }: { signedIn: boolean; child: JSX.Element }) {
  return signedIn ? child : <MapsPage />
}

export default function App() {
  const { ready, user, isAdmin, login, register, signOut } = useAuth()

  return (
    <div>
      <header className={s.header}>
        <div className="container">
          <div className={s.headerInner}>
            <Link to="/" className={s.brandLink} aria-label="Go to Maps">
              <div className={s.brand}>
                <h1 className={s.title}>Brawl Pro Tracker</h1>
                <p className={s.subtitle}>Maps • best brawlers • comps • matchups analyzer</p>
              </div>
            </Link>

            <div className={s.rightSide}>
              <nav className={s.nav}>
                <NavLink to="/" className={linkClass} end>
                  Maps
                </NavLink>
                <NavLink to="/ranked-helper" className={linkClass}>
                  Ranked Helper
                </NavLink>
                {isAdmin && (
                  <NavLink to="/tracked" className={linkClass}>
                    Tracked
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/admin" className={linkClass}>
                    Admin
                  </NavLink>
                )}
              </nav>

              <div className={s.authBox}>
                {!ready && <span className="muted2">Checking session...</span>}

                {ready && user && (
                  <>
                    <Link to="/profile" className={s.navButton}>
                      Profile
                    </Link>

                    <button className={s.navButton} type="button" onClick={signOut}>
                      Sign out
                    </button>
                  </>
                )}

                {ready && !user && (
                  <AuthForm onLogin={login} onRegister={register} />
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className={s.main}>
        <Routes>
          <Route path="/" element={<MapsPage />} />
          <Route path="/maps/:map" element={<MapDetailsPage />} />
          <Route path="/profile" element={<AuthOnlyPage signedIn={Boolean(user)} child={<ProfilePage />} />} />
          <Route path="/tracked" element={<AdminOnlyPage isAdmin={isAdmin} child={<TrackedPage />} />} />
          <Route path="/admin" element={<AdminOnlyPage isAdmin={isAdmin} child={<AdminPage />} />} />
          <Route path="/ranked-helper" element={<RankedHelperPage />} />
        </Routes>
      </main>

      <footer className={s.footer}>
        <div className="container">
          <div className="rowBetween">
            <span>Dark UI • compact panels • minimal scrolling</span>
            <span className="muted2">Data updates via collector</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
