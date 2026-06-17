/*************************************
 * WebApp.gs
 * Serves live Powerwall + plan data as JSON.
 * Deploy as Web app: Execute as Me, Anyone can access.
 *
 * Paste this file into your existing Apps Script project (same project as
 * Code.gs and ChargeScheduler.gs). Then deploy → New deployment → Web app.
 *************************************/

function doGet(e) {
  var out = {
    ok: true,
    ts: Date.now(),
    soc: null, solarKw: null, gridKw: null, homeKw: null, battKw: null,
    reserve: null, priceCents: null, windows: []
  };

  try {
    var cache = _csReadLiveCache();
    if (cache) {
      out.soc      = cache.soc      != null ? Number(cache.soc)      : null;
      out.solarKw  = cache.solarKw  != null ? Number(cache.solarKw)  : null;
      out.gridKw   = cache.gridKw   != null ? Number(cache.gridKw)   : null;
      out.homeKw   = cache.homeKw   != null ? Number(cache.homeKw)   : null;
      out.battKw   = cache.battKw   != null ? Number(cache.battKw)   : null;
      out.reserve  = cache.reserve  != null ? Number(cache.reserve)  : null;
      out.cacheAgeSec = Math.round((Date.now() - (cache.ts || 0)) / 1000);
    }
  } catch (err) { out.cacheError = String(err); }

  try {
    out.priceCents = -amberCurrentFeedInCents();
  } catch (err) { out.priceError = String(err); }

  try {
    var plan = _csLoadPlan();
    if (plan && plan.windows) {
      out.windows = plan.windows.map(function(w) {
        var s = new Date(w.startIso), e = new Date(w.endIso);
        return {
          name: _planLabel(w.label),
          s: Utilities.formatDate(s, _CS_TZ, 'HH:mm'),
          e: Utilities.formatDate(e, _CS_TZ, 'HH:mm'),
          p: Number(w.avgPrice || 0)
        };
      });
    }
  } catch (err) { out.planError = String(err); }

  return ContentService
    .createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var key = _get('WEBAPP_KEY', '');
  var params = e.parameter || {};
  if (key && params.key !== key) {
    return _jsonResp({ ok: false, error: 'unauthorized' });
  }

  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch(_) {}

  var action = body.action || '';
  var result = '';
  try {
    if      (action === 'replan') { csReplanNow();        result = 'replanned'; }
    else if (action === 'force')  { csForceChargeNow();   result = 'charging started'; }
    else if (action === 'stop')   { csForceStopCharge();  result = 'charging stopped'; }
    else if (action === 'status') { csStatusCheck();      result = 'status sent to Telegram'; }
    else { result = 'unknown action: ' + action; }
  } catch(err) {
    return _jsonResp({ ok: false, error: String(err) });
  }

  return _jsonResp({ ok: true, result: result });
}

function _planLabel(label) {
  if (!label) return 'Charge window';
  if (label.indexOf('1') === 0) return 'Midday top-up';
  if (label.indexOf('2') === 0) return 'Evening charge';
  if (label.indexOf('3') === 0) return 'Overnight';
  return label;
}

function _jsonResp(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
