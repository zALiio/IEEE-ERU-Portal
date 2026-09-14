/* Quick focused check: member role, critical mobile viewports, all routes.
 * Uses the corrected (Accept-aware) profile stub so profile.full_name renders.
 */
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright-core')
const P = 'bxrsjhpoivenbfcjbfhy'
const KEY = `sb-${P}-auth-token`
const NOW = new Date().toISOString()

const PROFILE = {
  id: 'member-1', full_name: 'Ahmed Hassan El-Sayed', role: 'member', points: 142,
  team_id: 't1', status: 'active', email: 'ahmed@ieee-eru.org', created_at: NOW,
  teams: { name: 'Web Committee' },
}
function makeSession() {
  const user = { id: PROFILE.id, email: PROFILE.email, aud: 'authenticated', role: 'authenticated',
    app_metadata: { provider: 'email', roles: ['member'] }, user_metadata: { full_name: PROFILE.full_name, team_id: PROFILE.team_id },
    created_at: NOW, updated_at: NOW }
  return { access_token: 'fake-token', token_type: 'bearer', expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'fake-refresh', user }
}
const ROUTES = ['/', '/tasks', '/leaderboard', '/events', '/announcements', '/profile']
const VIEWPORTS = [
  { name: 'phone-320', w: 320, h: 568 },
  { name: 'phone-375', w: 375, h: 667 },
]

async function main() {
  const browser = await chromium.launch({ channel: 'msedge' })
  let problems = 0
  for (const vp of VIEWPORTS) {
    for (const route of ROUTES) {
      const ctx = await browser.newContext({ viewport: null })
      await ctx.addInitScript(({ key, session }) => localStorage.setItem(key, JSON.stringify(session)),
        { key: KEY, session: makeSession() })
      const page = await ctx.newPage()

      const acceptWantsObject = (accept) => (accept || '').includes('pgrst.object+json')
      await page.route('**/*supabase.co*/**', (r) => {
        const url = new URL(r.request().url())
        const m = url.pathname.match(/rest\/v1\/([^/?]+)/)
        const table = m ? decodeURIComponent(m[1]) : null
        const accept = r.request().headers()['accept'] || ''
        let body = []
        if (table === 'profiles') {
          const idParam = (url.searchParams.get('id') || '').replace(/^eq\./, '')
          const rows = [PROFILE]
          const chosen = idParam ? rows.filter((p) => p.id === idParam) : rows
          body = chosen
        }
        const payload = acceptWantsObject(accept) && Array.isArray(body) && body.length === 1 ? body[0] : body
        r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) }).catch(() => {})
      })
      await page.route('**/auth/v1/user', (r) =>
        r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: PROFILE.id, email: PROFILE.email }) }))

      await page.setViewportSize({ width: vp.w, height: vp.h })
      let failed = false, errMsg = ''
      page.on('pageerror', (e) => { failed = true; errMsg = e.message })
      try {
        await page.goto('http://localhost:5173' + route, { waitUntil: 'networkidle', timeout: 30000 })
        await page.waitForTimeout(1500)
      } catch (e) { failed = true; errMsg = e.message }

      const measure = failed ? null : await page.evaluate((route) => {
        const h1 = document.querySelector('.dashboard-header-name')
        return {
          scrollW: document.documentElement.scrollWidth,
          innerW: window.innerWidth,
          name: route === '/' && h1 ? h1.textContent : null,
          nameH: route === '/' && h1 ? Math.round(h1.getBoundingClientRect().height) : null,
          nonZeroScrollable: [...document.querySelectorAll('body *')].some((el) => {
            const s = getComputedStyle(el)
            return s.overflowX === 'scroll' || (el.scrollWidth > el.clientWidth && s.overflowX !== 'hidden')
          }),
        }
      }, route)

      const overflow = measure && measure.scrollW > measure.innerW + 1
      const flag = failed || overflow || measure?.nonZeroScrollable
      if (flag) {
        problems++
        console.log(`[${vp.name} ${route}]`, failed ? `ERROR ${errMsg}` :
          overflow ? `OVERFLOW ${measure.scrollW} > ${measure.innerW}` : 'NON-ZERO SCROLLABLE',
          measure ? `name="${measure.name}" h=${measure.nameH}` : '')
      } else {
        console.log(`ok ${vp.name} ${route} name="${measure.name}" h=${measure.nameH}`)
      }
      await ctx.close()
    }
  }
  await browser.close()
  console.log(`\n${problems} issues`)
}
main().catch((e) => { console.error('FATAL', e); process.exit(1) })