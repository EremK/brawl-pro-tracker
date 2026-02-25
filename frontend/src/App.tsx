import { NavLink, Route, Routes, Link } from 'react-router-dom'
import MapsPage from './pages/MapsPage'
import TrackedPage from './pages/TrackedPage'
import AdminPage from './pages/AdminPage'
import MapDetailsPage from './pages/MapDetailsPage'
import RankedHelperPage from './pages/RankedHelperPage.tsx'

import s from './App.module.scss'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `${s.navLink} ${isActive ? s.active : ''}`

export default function App() {
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

            <nav className={s.nav}>
              <NavLink to="/" className={linkClass} end>
                Maps
              </NavLink>
              <NavLink to="/ranked-helper" className={linkClass}>
                Ranked Helper
              </NavLink>
              <NavLink to="/tracked" className={linkClass}>
                Tracked
              </NavLink>
              <NavLink to="/admin" className={linkClass}>
                Admin
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      <main className={s.main}>
        <Routes>
          <Route path="/" element={<MapsPage />} />
          <Route path="/maps/:map" element={<MapDetailsPage />} />
          <Route path="/tracked" element={<TrackedPage />} />
          <Route path="/admin" element={<AdminPage />} />
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