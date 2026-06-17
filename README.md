# Powerwall Dashboard

A mobile PWA showing live Powerwall SoC, Amber electricity prices, and today's charge plan.

## Setup

### 1. Deploy the Apps Script endpoint

1. Open your Apps Script project (the one containing `Code.gs` and `ChargeScheduler.gs`)
2. Add a new file: paste the contents of `WebApp.gs`
3. Click **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Copy the `/exec` URL — you'll need it in step 3

### 2. Serve the dashboard over HTTPS

**GitHub Pages (recommended):**
1. Create a repo named `powerwall-dashboard` on GitHub
2. Upload `index.html`, `manifest.json`, `icon.svg`
3. Go to repo **Settings → Pages → Branch: main → / (root)**
4. Your URL: `https://[username].github.io/powerwall-dashboard`

### 3. Connect the endpoint

1. Open the dashboard URL on your phone
2. Tap **Settings** in the footer
3. Paste the Apps Script `/exec` URL
4. Tap **Save & connect**

The SoC ring, power tiles, and charge plan will now fill with live data.

### 4. Add to Home Screen

- **iPhone:** Safari → Share → Add to Home Screen
- **Android:** Chrome → ⋮ menu → Add to Home Screen

---

## Control buttons

Each button copies a Claude prompt to your clipboard (or POSTs directly to the endpoint for Replan / Force charge / Stop charge if the endpoint is connected).

| Button | Action |
|--------|--------|
| Replan now | Re-fetches Amber forecast and reschedules today's windows |
| Status check | Shows current SoC, reserve, and charge mode |
| Force charge | Starts charging (checks for peak hours first) |
| Stop charge | Restores reserve to 10% and clears triggers |
| List triggers | Shows all active Apps Script triggers |
| Savings report | Sends daily energy savings summary |

### Optional: secure the doPost endpoint

Set the script property `WEBAPP_KEY` in Apps Script to a secret string. Then append `?key=YOUR_KEY` to the endpoint URL when saving in Settings — e.g. `https://script.google.com/macros/s/…/exec?key=abc123`.

---

## Refresh

Data auto-refreshes every **2 minutes**. Amber prices are fetched directly; live SoC and plan data come from the Apps Script endpoint.

At night the Powerwall monitor pauses (sunrise–sunset only). When the cached data is >10 minutes old, the dashboard shows a "Data paused overnight" notice.
