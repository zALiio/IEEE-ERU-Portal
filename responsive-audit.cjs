/* Responsive audit harness.
 * Stubs Supabase REST so every page renders logged-in with seeded data,
 * walks all routes at multiple viewports, screenshots each, and reports
 * horizontal overflow (documentElement.scrollWidth > innerWidth).
 *
 * Run: node responsive-audit.cjs
 */
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright-core')
const fs = require('fs')
const path = require('path')

const BASE = 'http://localhost:5173'
const OUT = path.join(__dirname, '.audit')
const PROJECT_REF = 'bxrsjhpoivenbfcjbfhy'
const TOKEN_KEY = `sb-${PROJECT_REF}-auth-token`

const NOW = new Date().toISOString()

const TEAMS = [
  { id: 't1', name: 'Web Committee' },
  { id: 't2', name: 'PR Committee' },
  { id: 't3', name: 'Robotics Committee' },
]

const PENDING = {
  'member-1': { id: 'member-1', full_name: 'Ahmed Hassan El-Sayed', role: 'member', points: 142, team_id: 't1', status: 'active', email: 'ahmed@ieee-eru.org', created_at: NOW, teams: { name: 'Web Committee' } },
  'member-2': { id: 'member-2', full_name: 'Mariam Nasser', role: 'member', points: 87, team_id: 't2', status: 'active', email: 'mariam@ieee-eru.org', created_at: NOW, teams: { name: 'PR Committee' } },
  'leader-1': { id: 'leader-1', full_name: 'Omar Abdelfattah Mahmoud', role: 'leader', points: 96, team_id: 't1', status: 'active', email: 'omar@ieee-eru.org', created_at: NOW, teams: { name: 'Web Committee' } },
  'excom-1': { id: 'excom-1', full_name: 'Youssef Kareem', role: 'excom', points: 55, team_id: null, status: 'active', email: 'youssef@ieee-eru.org', created_at: NOW, teams: null },
  'admin-1': { id: 'admin-1', full_name: 'Sara Tarek', role: 'admin', points: 30, team_id: null, status: 'active', email: 'sara@ieee-eru.org', created_at: NOW, teams: null },
}

const TASKS = [
  { id: 'task-1', title: 'Build a portfolio page for the web committee onboarding flow', description: 'A very long description that should never blow out the card layout on small phones when it wraps over multiple lines gracefully', status: 'in_progress', assigned_to: 'member-1', priority: 'high', points: 30, team_id: 't1', created_at: NOW, assigned_by: 'excom-1' },
  { id: 'task-2', title: 'Design Instagram post', status: 'todo', assigned_to: 'member-2', priority: 'medium', points: 15, team_id: 't2', created_at: NOW, assigned_by: 'leader-1' },
  { id: 'task-3', title: 'Prepare EXCOM minutes', status: 'submitted', assigned_to: 'member-1', priority: 'low', points: 10, team_id: 't1', created_at: NOW, assigned_by: 'excom-1' },
  { id: 'task-4', title: 'Robotics workshop venue booking', status: 'confirmed', assigned_to: 'member-1', priority: 'high', points: 25, team_id: 't1', created_at: NOW, assigned_by: 'leader-1' },
  { id: 'task-5', title: 'Photography for the awards ceremony', status: 'todo', assigned_to: 'member-2', priority: 'low', points: 12, team_id: 't2', created_at: NOW, assigned_by: 'leader-1' },
]

const EVENTS = [
  { id: 'ev-1', title: 'IEEE ERU Orientation Week Kickoff', description: 'Welcome all new members with an introduction to committees, our mentors, and what the coming semester has in store.', location_type: 'in_person', location: 'Main Hall B102', event_date: '2026-10-05T18:00:00Z', points: 10, created_by: 'excom-1', created_at: NOW },
  { id: 'ev-2', title: 'AI & Cloud Basics Workshop', description: 'Hands-on session building a small ML pipeline.', location_type: 'online', location: 'https://meet.example.com/ai', event_date: '2026-10-20T19:00:00Z', points: 20, created_by: 'excom-1', created_at: NOW },
  { id: 'ev-3', title: 'Past: Hackathon scoping session', description: 'Old event.', location_type: 'in_person', location: 'Lab 3', event_date: '2026-08-01T12:00:00Z', points: 5, created_by: 'excom-1', created_at: NOW },
  { id: 'ev-4', title: 'Past: Robotics intro', description: 'Old event 2.', location_type: 'in_person', location: 'Lab 1', event_date: '2026-07-15T12:00:00Z', points: 5, created_by: 'excom-1', created_at: NOW },
]

const RSVPS = [
  { id: 'r1', event_id: 'ev-1', status: 'going', profile_id: 'member-1', profiles: { full_name: 'Ahmed Hassan El-Sayed' } },
  { id: 'r2', event_id: 'ev-1', status: 'attended', profile_id: 'member-2', profiles: { full_name: 'Mariam Nasser' } },
  { id: 'r3', event_id: 'ev-1', status: 'no_show', profile_id: 'leader-1', profiles: { full_name: 'Omar Abdelfattah Mahmoud' } },
  { id: 'r4', event_id: 'ev-2', status: 'going', profile_id: 'member-1', profiles: { full_name: 'Ahmed Hassan El-Sayed' } },
]

const ANNOUNCEMENTS = [
  { id: 'a1', title: 'Welcome to the 2026/27 season — read everything carefully', body: 'This is a very important announcement that needs to be read by every single member before the semester begins.', pinned: true, created_by: 'admin-1', created_at: NOW },
  { id: 'a2', title: 'Committee meetings resume', body: 'Weekly meetings are back. Check your team group for the schedule.', pinned: false, created_by: 'excom-1', created_at: NOW },
]

const POINTS_LOG = [
  { id: 'p1', task_id: null, profile_id: 'member-1', points: 30, note: 'Task completed: Build web committee portfolio page', entry_type: 'task', created_at: NOW },
  { id: 'p2', task_id: null, profile_id: 'member-1', points: -10, note: 'First Warning issued — missed deadline without notice', entry_type: 'warning', created_at: NOW },
  { id: 'p3', task_id: null, profile_id: 'member-1', points: 15, note: 'Attendance bonus — orientation week', entry_type: 'adjustment', created_at: NOW },
]

const NOTIFICATIONS = [
  { id: 'n1', message: 'You have been assigned a new task: "Build a portfolio page for the web committee onboarding flow"', link: '/tasks', is_read: false, created_at: NOW, user_id: 'member-1' },
  { id: 'n2', message: 'Your task "Prepare EXCOM minutes" was confirmed', link: '/tasks', is_read: false, created_at: NOW, user_id: 'member-1' },
  { id: 'n3', message: 'New event: IEEE ERU Orientation Week Kickoff', link: '/events', is_read: true, created_at: NOW, user_id: 'member-1' },
]

const TEAM_LEADS = [
  { id: 'l1', profile_id: 'leader-1', team_id: 't1', position: 'head', profiles: { full_name: 'Omar Abdelfattah Mahmoud' } },
]

function tableFor(url) {
  const m = url.pathname.match(/rest\/v1\/([^/?]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

function makeSession(identity, people) {
  const user = {
    id: identity.id,
    email: identity.email,
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: { provider: 'email', roles: [identity.role] },
    user_metadata: { full_name: identity.full_name, team_id: identity.team_id },
    created_at: NOW,
    updated_at: NOW,
  }
  return {
    access_token: 'fake-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'fake-refresh',
    user,
  }
}

const VIEWPORTS = [
  { name: 'phone-320', width: 320, height: 568, isMobile: true },
  { name: 'phone-360', width: 360, height: 800, isMobile: true },
  { name: 'phone-375', width: 375, height: 667, isMobile: true },
  { name: 'phone-390', width: 390, height: 844, isMobile: true },
  { name: 'phone-430', width: 430, height: 932, isMobile: true },
  { name: 'fold-small', width: 655, height: 721, isMobile: true },
  { name: 'fold-large', width: 673, height: 841, isMobile: true },
  { name: 'tablet-768', width: 768, height: 1024, isMobile: true },
  { name: 'ipad-834', width: 834, height: 1112, isMobile: true },
  { name: 'ipad-1024', width: 1024, height: 1366, isMobile: true },
  { name: 'desktop-1280', width: 1280, height: 800, isMobile: false },
]

const ROUTES = {
  'member': ['/', '/tasks', '/leaderboard', '/events', '/announcements', '/profile'],
  'leader': ['/', '/tasks', '/leaderboard', '/events', '/directory', '/profile'],
  'excom': ['/', '/tasks', '/leaderboard', '/events', '/directory', '/analytics', '/approve', '/team/t1', '/announcements', '/profile'],
}

// Windows path-safe label for files.
const safe = (s) => s.replace(/[/\\:*?"<>|]/g, '_')

async function main() {
  const browser = await chromium.launch({ channel: 'msedge' })
  const report = []

  // Seed localStorage session before app JS runs.
  async function newPage(identity, people) {
    const ctx = await browser.newContext({
      viewport: null, // set per-navigation
    })
    await ctx.addInitScript(({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session))
    }, { key: TOKEN_KEY, session: makeSession(identity, people) })
    const page = await ctx.newPage()
    return { ctx, page }
  }

  const identities = {
    'member': PENDING['member-1'],
    'leader': PENDING['leader-1'],
    'excom': PENDING['excom-1'],
  }

  for (const [role, identity] of Object.entries(identities)) {
    for (const vp of VIEWPORTS) {
      for (const route of ROUTES[role]) {
        const { ctx, page } = await newPage(identity, PENDING)

        // Stub Supabase REST.
        await page.route(/sus|supabase\.co\/rest\/v1\/|supabase\.co\/auth\/v1\//, (r) => {
          const url = new URL(r.request().url())
          const table = tableFor(url)
          const method = r.request().method()

          // PostgREST: when the client sends `Accept: application/vnd.pgrst.object+json`
          // (i.e. `.single()`), the server returns ONE plain object, not an array.
          // Our stub must mirror that or the app treats an array as the profile row.
          const accept = r.request().headers()['accept'] || ''
          const wantsObject = accept.includes('pgrst.object+json')
          const json = (body) => {
            const payload = wantsObject && Array.isArray(body) && body.length === 1 ? body[0] : body
            return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) }).catch(() => {})
          }
          const ignore = () => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }).catch(() => {})

          // PATCH/POST/DELETE update calls — respond with empty array (ok for layout audit).
          if (['PATCH', 'POST', 'DELETE'].includes(method)) return ignore()
          if (table === null) return ignore()

          switch (table) {
            case 'profiles':
              // If asking for a single profile (id=eq.<id>), return that one; else all.
              // Supabase serialises filters as `id=eq.member-1` — strip the `eq.` prefix.
              const idParam = (url.searchParams.get('id') || '').replace(/^eq\./, '')
              const rows = Object.values(PENDING)
              const chosen = idParam ? rows.filter((p) => p.id === idParam) : rows
              return json(chosen)
            case 'teams': {
              // Honour `id=eq.<id>` (TeamDetailPage fetches one team via .single()).
              const teamIdParam = (url.searchParams.get('id') || '').replace(/^eq\./, '')
              const teamRows = teamIdParam ? TEAMS.filter((t) => t.id === teamIdParam) : TEAMS
              return json(teamRows)
            }
            case 'tasks': return json(TASKS)
            case 'portal_events': return json(EVENTS)
            case 'portal_event_rsvps': return json(RSVPS)
            case 'portal_announcements': return json(ANNOUNCEMENTS)
            case 'points_log': return json(POINTS_LOG)
            case 'notifications': return json(NOTIFICATIONS)
            case 'team_leads': return json(TEAM_LEADS)
            default: return ignore()
          }
        })
        // Never let auth/user fetch through (session already seeded).
        await page.route(/auth\/v1\/user/, (r) => r.fulfill({ status: 401, contentType: 'application/json', body: '{}' }).catch(() => {}))

        await page.setViewportSize({ width: vp.width, height: vp.height })
        const url = BASE + route
        let failed = false
        let errorMsg = ''
        page.on('pageerror', (err) => { errorMsg = err.message })
        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
          await page.waitForTimeout(1200) // let animations/data settle
        } catch (e) {
          failed = true
          errorMsg = e.message
        }

        // Measure overflow.
        const measure = !failed
          ? await page.evaluate(() => {
              const de = document.documentElement
              return {
                scrollW: de.scrollWidth,
                innerW: window.innerWidth,
                bodyScrollW: document.body.scrollWidth,
              }
            })
          : null

        const overflow = measure && measure.scrollW > measure.innerW + 1
        const fileBase = `${safe(role)}__${vp.name}__${safe(route || '/')}`
        let shotName = ''
        if (!failed) {
          shotName = `${fileBase}.png`
          await page.screenshot({ path: path.join(OUT, shotName), fullPage: false })
        }

        report.push({
          role, vp: vp.name, route: route || '/', width: vp.width,
          overflow: overflow ? { scrollW: measure.scrollW, innerW: measure.innerW } : null,
          error: errorMsg || null,
          shot: shotName,
        })

        await ctx.close()
      }
    }
  }

  await browser.close()

  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))

  // Print a compact summary: only problems.
  console.log('=== Overflow / error summary ===')
  let problems = 0
  for (const r of report) {
    if (r.overflow || r.error) {
      problems++
      console.log(
        `[${r.role}/${r.vp}/${r.width}px] ${r.route}  ` +
        (r.overflow ? `OVERFLOW ${r.overflow.scrollW}px > ${r.overflow.innerW}px` : '') +
        (r.error ? `  ERROR: ${r.error}` : '')
      )
    }
  }
  console.log(`\n${problems} issues out of ${report.length} page/viewport checks.`)
  console.log(`Screenshots in ${OUT}`)
}

fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })
main().catch((e) => { console.error('FATAL', e); process.exit(1) })