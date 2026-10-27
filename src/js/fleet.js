// Fleet Check (/fleet/) - Client-side telemetry, localStorage persistence, and 90d+36m trajectory engine.
// PRIVACY: User-submitted BTC addresses and Vast.ai machine IDs are stored ONLY in browser localStorage.
// BTC lookups go directly from the browser to mempool.space. Vast.ai bundle lookups use stateless /api/fleet.
(() => {
  const STORAGE_KEY = 'jm_fleet_v1';

  const ASIC_SPECS = {
    'S21 XP': { name: 'Antminer S21 XP', jPerTh: 13.5, pricePerTh: 15.81, thPerUnit: 270 },
    'S21 Pro': { name: 'Antminer S21 Pro', jPerTh: 15.0, pricePerTh: 13.90, thPerUnit: 234 },
    'S21': { name: 'Antminer S21', jPerTh: 17.5, pricePerTh: 11.50, thPerUnit: 200 },
    'S19k Pro': { name: 'Antminer S19k Pro', jPerTh: 23.0, pricePerTh: 4.50, thPerUnit: 120 },
    'S19 XP': { name: 'Antminer S19 XP (Used)', jPerTh: 21.5, pricePerTh: 2.11, thPerUnit: 141 }
  };

  const SAMPLE_BTC_CACHE = {
    'bc1q660erw3c59m88hzqxs8tgs7rn39ehgn93vd42s': {
      txCount90d: 36,
      m3Btc: 0.0282,
      m2Btc: 0.3214,
      m1Btc: 0.4444,
      totalBtc90d: 0.7940,
      avgReceiptUsdPrice: 68900,
      source: 'mempool-cached'
    },
    '3FDjMthmz5GKFfrh25skdysZtXijvBg7br': {
      txCount90d: 42,
      m3Btc: 0.1331,
      m2Btc: 0.3811,
      m1Btc: 0.4066,
      totalBtc90d: 0.9208,
      avgReceiptUsdPrice: 68400,
      source: 'mempool-cached'
    }
  };

  const SAMPLE_VAST_CACHE = {
    142194: {
      machine_id: 142194,
      gpu_name: 'H100 SXM',
      total_gpus: 4,
      avail_gpus: 0,
      occupied_gpus: 4,
      utilization_live: 1.0,
      utilization_est: 0.76,
      dph_renter_per_gpu: 2.1333,
      dph_host_per_gpu: 1.7067,
      min_bid_per_gpu: 1.80,
      reliability: 0.9879,
      verification: 'verified',
      geolocation: 'Montana, US',
      gpu_ram_gb: 80,
      gpu_tdp_w: 700,
      sys_watts_per_gpu: 1000,
      cpu_name: 'AMD EPYC 9684X 96-Core Processor',
      source: 'vast-cached',
      benchmark: { model: 'H100 SXM', renterDph: 2.13, hostDph: 1.70, util: 0.56, tdpW: 700, sysW: 1000, capexPerGpu: 27500 }
    },
    153411: {
      machine_id: 153411,
      gpu_name: 'RTX 4090',
      total_gpus: 2,
      avail_gpus: 1,
      occupied_gpus: 1,
      utilization_live: 0.50,
      utilization_est: 0.56,
      dph_renter_per_gpu: 0.3733,
      dph_host_per_gpu: 0.2987,
      min_bid_per_gpu: 0.3467,
      reliability: 0.9925,
      verification: 'deverified',
      geolocation: 'Texas, US',
      gpu_ram_gb: 24,
      gpu_tdp_w: 450,
      sys_watts_per_gpu: 600,
      cpu_name: 'AMD EPYC 7282 16-Core Processor',
      source: 'vast-cached',
      benchmark: { model: 'RTX 4090', renterDph: 0.35, hostDph: 0.28, util: 0.61, tdpW: 450, sysW: 600, capexPerGpu: 2000 }
    }
  };

  function getDefaultSampleFleet() {
    return {
      isSample: true,
      btcList: [
        {
          addr: 'bc1q660erw3c59m88hzqxs8tgs7rn39ehgn93vd42s',
          label: 'Ocean S21 XP',
          kwh: 0.058,
          asic: 'S21 XP',
          thOverride: 0
        },
        {
          addr: '3FDjMthmz5GKFfrh25skdysZtXijvBg7br',
          label: 'Ocean S21 Pro',
          kwh: 0.062,
          asic: 'S21 Pro',
          thOverride: 0
        }
      ],
      vastList: [
        {
          id: 142194,
          label: '4x H100 SXM',
          kwh: 0.065,
          utilOverride: 0
        },
        {
          id: 153411,
          label: '2x RTX 4090',
          kwh: 0.070,
          utilOverride: 0
        }
      ],
      showBenchmark: false
    };
  }

  const state = {
    spotBtcUsd: 71400,
    satsPerThDay: 43.5,
    btcY1: 100000,
    btcY2: 135000,
    btcY3: 180000,
    deflatorMode: 'cpi', // 'cpi' | 'm2'
    cpiRate: 3.1,
    m2Rate: 7.0,
    diffDriftMonthly: 0.02,
    scrubberMonth: 36,
    btcCache: { ...SAMPLE_BTC_CACHE },
    vastCache: { ...SAMPLE_VAST_CACHE },
    fleet: getDefaultSampleFleet()
  };

  function fireEvent(val) {
    if (typeof window.jmEvent === 'function') {
      window.jmEvent('fleet', val);
    }
  }

  function fmtUsd(n, sign = false) {
    if (!Number.isFinite(n)) return '$0';
    const abs = Math.abs(Math.round(n));
    const str = '$' + abs.toLocaleString('en-US');
    if (n < 0) return '-' + str;
    if (sign && n > 0) return '+' + str;
    return str;
  }

  function fmtUsdCompact(n) {
    if (!Number.isFinite(n)) return '$0';
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 1e6) return sign + '$' + (abs / 1e6).toFixed(2) + 'M';
    if (abs >= 1e4) return sign + '$' + (abs / 1e3).toFixed(1) + 'k';
    return sign + '$' + Math.round(abs).toLocaleString('en-US');
  }

  function shortAddr(a) {
    const s = String(a || '');
    if (s.length <= 14) return s;
    return s.slice(0, 6) + '..' + s.slice(-4);
  }

  function getGlobalKwh() {
    const el = document.getElementById('in-global-kwh');
    const v = parseFloat(el ? el.value : '');
    return Number.isFinite(v) && v >= 0 ? v : 0.065;
  }

  function initFleetState() {
    const params = new URLSearchParams(window.location.search);
    const urlBtc = params.get('btc');
    const urlVast = params.get('vast');
    const urlKwh = parseFloat(params.get('kwh') || '');

    if (urlBtc || urlVast) {
      const btcList = [];
      if (urlBtc) {
        for (const raw of urlBtc.split(/[\s,;]+/)) {
          const clean = raw.trim();
          if (clean.length >= 24) {
            btcList.push({
              addr: clean,
              label: 'Miner ' + shortAddr(clean),
              kwh: Number.isFinite(urlKwh) ? urlKwh : 0.060,
              asic: 'S21 XP',
              thOverride: 0
            });
          }
        }
      }
      const vastList = [];
      if (urlVast) {
        for (const raw of urlVast.split(/[\s,;]+/)) {
          const id = parseInt(raw.replace(/[^0-9]/g, ''), 10);
          if (Number.isFinite(id) && id > 0) {
            vastList.push({
              id,
              label: 'Vast #' + id,
              kwh: Number.isFinite(urlKwh) ? urlKwh : 0.065,
              utilOverride: 0
            });
          }
        }
      }
      if (btcList.length || vastList.length) {
        state.fleet = {
          isSample: false,
          btcList,
          vastList,
          showBenchmark: (btcList.length === 0 || vastList.length === 0)
        };
        saveFleetToLocalStorage();
        return;
      }
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (Array.isArray(parsed.btcList) || Array.isArray(parsed.vastList))) {
          state.fleet = {
            isSample: Boolean(parsed.isSample),
            btcList: parsed.btcList || [],
            vastList: parsed.vastList || [],
            showBenchmark: Boolean(parsed.showBenchmark)
          };
        }
      }
    } catch (_) {}
  }

  function saveFleetToLocalStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.fleet));
    } catch (_) {}
  }

  function clearSavedFleet() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    state.fleet = getDefaultSampleFleet();
    fireEvent('clear');
    renderConfigLists();
    recalcAndRender();
  }

  async function fetchLiveNetworkStats() {
    try {
      const [priceRes, diffRes] = await Promise.all([
        fetch('https://mempool.space/api/v1/prices'),
        fetch('https://mempool.space/api/v1/mining/hashrate/3d')
      ]);
      if (priceRes.ok) {
        const p = await priceRes.json();
        if (p && p.USD > 1000) state.spotBtcUsd = p.USD;
      }
      if (diffRes.ok) {
        const d = await diffRes.json();
        const curDiff = d && d.currentDifficulty;
        if (curDiff > 1e12) {
          const btcPerThDay = (1e12 * 86400) / (curDiff * Math.pow(2, 32)) * 3.15;
          state.satsPerThDay = +(btcPerThDay * 1e8).toFixed(2);
        }
      }
    } catch (_) {}
  }

  async function fetchBtcAddress90d(addr) {
    const now = Math.floor(Date.now() / 1000);
    const d90 = now - 90 * 86400;
    const d60 = now - 60 * 86400;
    const d30 = now - 30 * 86400;

    try {
      let txs = [];
      let lastTxid = '';
      for (let page = 0; page < 3; page++) {
        const url = page === 0
          ? `https://mempool.space/api/address/${encodeURIComponent(addr)}/txs`
          : `https://mempool.space/api/address/${encodeURIComponent(addr)}/txs/chain/${encodeURIComponent(lastTxid)}`;
        const res = await fetch(url);
        if (!res.ok) break;
        const batch = await res.json();
        if (!Array.isArray(batch) || !batch.length) break;
        txs = txs.concat(batch);
        const oldestTime = batch[batch.length - 1]?.status?.block_time || now;
        lastTxid = batch[batch.length - 1]?.txid || '';
        if (batch.length < 50 || oldestTime < d90 || !lastTxid) break;
      }

      let m3Sats = 0, m2Sats = 0, m1Sats = 0, count = 0, oldestObserved = now;
      for (const tx of txs) {
        const t = tx.status?.block_time || now;
        if (t < d90) continue;
        const isSelfSpend = (tx.vin || []).some(v => v.prevout?.scriptpubkey_address === addr);
        if (isSelfSpend) continue;
        let received = 0;
        for (const o of tx.vout || []) {
          if (o.scriptpubkey_address === addr) received += (o.value || 0);
        }
        if (received > 0) {
          count++;
          if (t < oldestObserved) oldestObserved = t;
          if (t < d60) m3Sats += received;
          else if (t < d30) m2Sats += received;
          else m1Sats += received;
        }
      }

      const spanDays = Math.max(1, (now - oldestObserved) / 86400);
      const rawTotalBtc = (m3Sats + m2Sats + m1Sats) / 1e8;
      let m3Btc = m3Sats / 1e8;
      let m2Btc = m2Sats / 1e8;
      let m1Btc = m1Sats / 1e8;
      if (txs.length >= 150 && spanDays < 75 && rawTotalBtc > 0) {
        const scaledTotal = rawTotalBtc * (90 / spanDays);
        m3Btc = +(scaledTotal / 3).toFixed(4);
        m2Btc = +(scaledTotal / 3).toFixed(4);
        m1Btc = +(scaledTotal / 3).toFixed(4);
      }

      state.btcCache[addr] = {
        txCount90d: count,
        m3Btc: +m3Btc.toFixed(4),
        m2Btc: +m2Btc.toFixed(4),
        m1Btc: +m1Btc.toFixed(4),
        totalBtc90d: +(m3Btc + m2Btc + m1Btc).toFixed(4),
        avgReceiptUsdPrice: Math.round(state.spotBtcUsd * 0.96),
        source: 'mempool-live'
      };
    } catch (_) {
      if (!state.btcCache[addr]) {
        state.btcCache[addr] = {
          txCount90d: 0,
          m3Btc: 0.18,
          m2Btc: 0.19,
          m1Btc: 0.19,
          totalBtc90d: 0.56,
          avgReceiptUsdPrice: Math.round(state.spotBtcUsd * 0.96),
          source: 'estimated'
        };
      }
    }
  }

  async function fetchVastMachines(ids) {
    if (!ids.length) return;
    try {
      const res = await fetch(`/api/fleet?machines=${ids.join(',')}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.machines) {
        for (const [id, info] of Object.entries(data.machines)) {
          if (info && !info.not_found) {
            state.vastCache[Number(id)] = info;
          } else if (!state.vastCache[Number(id)]) {
            state.vastCache[Number(id)] = {
              machine_id: Number(id),
              gpu_name: 'RTX 4090 (Unlisted)',
              total_gpus: 4,
              avail_gpus: 1,
              occupied_gpus: 3,
              utilization_live: 0.75,
              utilization_est: 0.60,
              dph_renter_per_gpu: 0.35,
              dph_host_per_gpu: 0.28,
              min_bid_per_gpu: 0.24,
              reliability: 0.98,
              verification: 'unverified',
              geolocation: 'Unlisted',
              gpu_tdp_w: 450,
              sys_watts_per_gpu: 600,
              source: 'fallback',
              benchmark: { model: 'RTX 4090', renterDph: 0.35, hostDph: 0.28, util: 0.61, tdpW: 450, sysW: 600, capexPerGpu: 2000 }
            };
          }
        }
      }
    } catch (_) {}
  }

  async function refreshAllLiveFeeds() {
    const btn = document.getElementById('btn-refresh-live');
    if (btn) btn.textContent = 'Refreshing...';
    await fetchLiveNetworkStats();
    const btcPromises = state.fleet.btcList.map(item => fetchBtcAddress90d(item.addr));
    const vastIds = state.fleet.vastList.map(item => item.id);
    await Promise.all([...btcPromises, fetchVastMachines(vastIds)]);
    if (btn) btn.innerHTML = '&#8635; Refresh';
    renderConfigLists();
    recalcAndRender();
  }

  function getBtcPriceAtMonth(m) {
    const p0 = state.spotBtcUsd;
    if (m <= 0) return p0 * (1 + m * 0.02);
    if (m <= 12) return p0 + (state.btcY1 - p0) * (m / 12);
    if (m <= 24) return state.btcY1 + (state.btcY2 - state.btcY1) * ((m - 12) / 12);
    return state.btcY2 + (state.btcY3 - state.btcY2) * ((m - 24) / 12);
  }

  function getDiscountFactor(m, annualRatePct) {
    if (m <= 0) return 1.0;
    const r = (annualRatePct || 0) / 100;
    return Math.pow(1 + r, m / 12);
  }

  function computeBtcUnitModel(item) {
    const cache = state.btcCache[item.addr] || {
      txCount90d: 18,
      m3Btc: 0.22,
      m2Btc: 0.24,
      m1Btc: 0.24,
      totalBtc90d: 0.70,
      avgReceiptUsdPrice: state.spotBtcUsd * 0.96,
      source: 'estimated'
    };
    const spec = ASIC_SPECS[item.asic] || ASIC_SPECS['S21 XP'];
    const totalBtc90d = Math.max(0.001, cache.totalBtc90d || 0.50);
    const dailyBtc90d = totalBtc90d / 90;

    const btcPerThDay = Math.max(1e-9, state.satsPerThDay / 1e8);
    const inferredTh = Math.max(50, Math.round(dailyBtc90d / (btcPerThDay * 0.98)));
    const activeTh = item.thOverride > 0 ? item.thOverride : inferredTh;
    const estUnits = Math.max(1, Math.round(activeTh / spec.thPerUnit));
    const kw = +((activeTh * spec.jPerTh) / 1000).toFixed(2);
    const capex = Math.round(activeTh * spec.pricePerTh);
    const monthlyPowerUsd = kw * 24 * 30.4375 * (item.kwh || 0.06);
    const monthlyDeprUsd = capex / 36;

    const past90dPowerUsd = monthlyPowerUsd * 3;
    const past90dGrossSpotUsd = totalBtc90d * state.spotBtcUsd;
    const past90dNetSpotUsd = past90dGrossSpotUsd - past90dPowerUsd;

    const byMonth = {};
    const m3Net = cache.m3Btc * getBtcPriceAtMonth(-2) - monthlyPowerUsd;
    const m2Net = (cache.m3Btc + cache.m2Btc) * getBtcPriceAtMonth(-1) - monthlyPowerUsd * 2;
    const m0Net = past90dNetSpotUsd;

    byMonth[-3] = { btcCum: 0, grossUsd: 0, powerUsd: 0, deprUsd: 0, nomNet: 0, cpiNet: 0, m2Net: 0 };
    byMonth[-2] = { btcCum: cache.m3Btc, grossUsd: cache.m3Btc * getBtcPriceAtMonth(-2), powerUsd: monthlyPowerUsd, deprUsd: 0, nomNet: m3Net, cpiNet: m3Net, m2Net: m3Net };
    byMonth[-1] = { btcCum: cache.m3Btc + cache.m2Btc, grossUsd: (cache.m3Btc + cache.m2Btc) * getBtcPriceAtMonth(-1), powerUsd: monthlyPowerUsd * 2, deprUsd: 0, nomNet: m2Net, cpiNet: m2Net, m2Net: m2Net };
    byMonth[0] = { btcCum: totalBtc90d, grossUsd: past90dGrossSpotUsd, powerUsd: past90dPowerUsd, deprUsd: 0, nomNet: m0Net, cpiNet: m0Net, m2Net: m0Net };

    let fwdBtcCum = 0, fwdPowerCum = 0, fwdDeprCum = 0;
    for (let m = 1; m <= 36; m++) {
      const diffFactor = Math.pow(1 + state.diffDriftMonthly, m);
      const halvingFactor = m >= 18 ? 0.5 : 1.0;
      const monthlyBtc = (activeTh * btcPerThDay * 30.4375 * 0.98 * halvingFactor) / diffFactor;
      fwdBtcCum += monthlyBtc;
      fwdPowerCum += monthlyPowerUsd;
      fwdDeprCum += monthlyDeprUsd;

      const btcPriceM = getBtcPriceAtMonth(m);
      const grossHeldUsd = fwdBtcCum * btcPriceM;
      const nomNet = grossHeldUsd - fwdPowerCum - fwdDeprCum;
      const cpiDisc = getDiscountFactor(m, state.cpiRate);
      const m2Disc = getDiscountFactor(m, state.m2Rate);

      byMonth[m] = {
        btcCum: fwdBtcCum,
        grossUsd: grossHeldUsd,
        powerUsd: fwdPowerCum,
        deprUsd: fwdDeprCum,
        nomNet,
        cpiNet: nomNet / cpiDisc,
        m2Net: nomNet / m2Disc
      };
    }

    return {
      kind: 'btc',
      id: item.addr,
      title: `${item.label || 'Miner'} (${shortAddr(item.addr)})`,
      subtitle: `${activeTh.toLocaleString('en-US')} TH/s (~${estUnits}x ${item.asic}) · ${totalBtc90d.toFixed(4)} BTC (90d)`,
      kw,
      kwhRate: item.kwh || 0.06,
      capex,
      past90dGrossUsd: past90dGrossSpotUsd,
      past90dPowerUsd,
      past90dNetUsd: past90dNetSpotUsd,
      past90dBtc: totalBtc90d,
      byMonth,
      source: cache.source
    };
  }

  function computeVastUnitModel(item) {
    const info = state.vastCache[item.id] || SAMPLE_VAST_CACHE[142194];
    const bm = info.benchmark || { model: info.gpu_name, renterDph: 0.50, hostDph: 0.40, util: 0.55, tdpW: 450, sysW: 600, capexPerGpu: 2500 };
    const totalGpus = Math.max(1, info.total_gpus || 1);
    const util = item.utilOverride > 0 ? (item.utilOverride / 100) : (info.utilization_est || bm.util || 0.60);
    const hostDphPerGpu = info.dph_host_per_gpu || (info.dph_renter_per_gpu ? info.dph_renter_per_gpu * 0.8 : bm.hostDph);

    const fullLoadKw = (totalGpus * (info.sys_watts_per_gpu || bm.sysW || 600)) / 1000;
    const avgKw = +(fullLoadKw * (0.35 + 0.65 * util)).toFixed(2);
    const capex = Math.round(totalGpus * (bm.capexPerGpu || 2500));

    const monthlyGrossUsd = totalGpus * hostDphPerGpu * 24 * 30.4375 * util;
    const monthlyPowerUsd = avgKw * 24 * 30.4375 * (item.kwh || 0.065);
    const monthlyDeprUsd = capex / 48;

    const past90dGrossUsd = monthlyGrossUsd * 3;
    const past90dPowerUsd = monthlyPowerUsd * 3;
    const past90dNetUsd = past90dGrossUsd - past90dPowerUsd;

    const byMonth = {};
    byMonth[-3] = { grossUsd: 0, powerUsd: 0, deprUsd: 0, nomNet: 0, cpiNet: 0, m2Net: 0 };
    byMonth[-2] = { grossUsd: monthlyGrossUsd, powerUsd: monthlyPowerUsd, deprUsd: 0, nomNet: monthlyGrossUsd - monthlyPowerUsd, cpiNet: monthlyGrossUsd - monthlyPowerUsd, m2Net: monthlyGrossUsd - monthlyPowerUsd };
    byMonth[-1] = { grossUsd: monthlyGrossUsd * 2, powerUsd: monthlyPowerUsd * 2, deprUsd: 0, nomNet: (monthlyGrossUsd - monthlyPowerUsd) * 2, cpiNet: (monthlyGrossUsd - monthlyPowerUsd) * 2, m2Net: (monthlyGrossUsd - monthlyPowerUsd) * 2 };
    byMonth[0] = { grossUsd: past90dGrossUsd, powerUsd: past90dPowerUsd, deprUsd: 0, nomNet: past90dNetUsd, cpiNet: past90dNetUsd, m2Net: past90dNetUsd };

    let fwdGrossCum = 0, fwdPowerCum = 0, fwdDeprCum = 0, fwdRealCpiCum = 0, fwdRealM2Cum = 0;
    for (let m = 1; m <= 36; m++) {
      fwdGrossCum += monthlyGrossUsd;
      fwdPowerCum += monthlyPowerUsd;
      fwdDeprCum += monthlyDeprUsd;
      const monthNomNet = monthlyGrossUsd - monthlyPowerUsd - monthlyDeprUsd;
      const cpiDisc = getDiscountFactor(m, state.cpiRate);
      const m2Disc = getDiscountFactor(m, state.m2Rate);
      fwdRealCpiCum += monthNomNet / cpiDisc;
      fwdRealM2Cum += monthNomNet / m2Disc;

      byMonth[m] = {
        grossUsd: fwdGrossCum,
        powerUsd: fwdPowerCum,
        deprUsd: fwdDeprCum,
        nomNet: fwdGrossCum - fwdPowerCum - fwdDeprCum,
        cpiNet: fwdRealCpiCum,
        m2Net: fwdRealM2Cum
      };
    }

    return {
      kind: 'gpu',
      id: String(item.id),
      title: `Vast #${item.id} (${totalGpus}x ${info.gpu_name})`,
      subtitle: `${info.occupied_gpus}/${totalGpus} rented live (${Math.round(util * 100)}% util) · $${hostDphPerGpu.toFixed(2)}/GPU-hr net`,
      kw: avgKw,
      kwhRate: item.kwh || 0.065,
      capex,
      monthlyGrossUsd,
      monthlyNetCashUsd: monthlyGrossUsd - monthlyPowerUsd,
      past90dGrossUsd,
      past90dPowerUsd,
      past90dNetUsd,
      byMonth,
      source: info.source
    };
  }

  function computeBenchmarkModel(btcModels, gpuModels) {
    const totalBtcKw = btcModels.reduce((s, u) => s + u.kw, 0);
    const totalGpuKw = gpuModels.reduce((s, u) => s + u.kw, 0);

    if (gpuModels.length === 0 || totalBtcKw >= totalGpuKw) {
      const targetKw = Math.max(4, totalBtcKw || 28);
      const gpusCount = Math.max(1, Math.round(targetKw / 0.80));
      return {
        ...computeVastUnitModel({
          id: 142194,
          label: `Benchmark (${gpusCount}x H100 SXM)`,
          kwh: getGlobalKwh(),
          utilOverride: 65
        }),
        isBenchmark: true,
        title: `Benchmark: ${gpusCount}x H100 SXM (${targetKw.toFixed(1)} kW)`,
        kw: targetKw,
        subtitle: `Equal-kW AI GPU comparison ($1.70/hr host net, 65% util)`
      };
    } else {
      const targetKw = Math.max(3.65, totalGpuKw || 10);
      const targetTh = Math.round((targetKw * 1000) / 13.5);
      return {
        ...computeBtcUnitModel({
          addr: 'bc1q660erw3c59m88hzqxs8tgs7rn39ehgn93vd42s',
          label: `Benchmark (${targetKw.toFixed(1)} kW S21 XP)`,
          kwh: getGlobalKwh(),
          asic: 'S21 XP',
          thOverride: targetTh
        }),
        isBenchmark: true,
        title: `Benchmark: S21 XP Pod (${targetKw.toFixed(1)} kW)`,
        subtitle: `Equal-kW BTC mining comparison (${targetTh.toLocaleString('en-US')} TH/s at 13.5 J/TH)`
      };
    }
  }

  function renderConfigLists() {
    const isDemo = Boolean(state.fleet.isSample);
    const btcChipsEl = document.getElementById('wiz-btc-chips');
    const vastChipsEl = document.getElementById('wiz-vast-chips');
    const btcContainer = document.getElementById('btc-item-list');
    const vastContainer = document.getElementById('vast-item-list');

    // Render compact chips inside Step 1 & Step 2
    if (btcChipsEl) {
      if (!state.fleet.btcList.length) {
        btcChipsEl.innerHTML = `<span class="note" style="font-size:.74rem">No BTC address added</span>`;
      } else {
        btcChipsEl.innerHTML = state.fleet.btcList.map((item, idx) => {
          const prefix = isDemo ? 'Demo: ' : '';
          return `<span class="f-chip btc" title="${item.addr}">
            <span class="c-tag">BTC</span>
            <span class="c-txt">${prefix}${shortAddr(item.addr)}</span>
            <button type="button" data-rm-btc="${idx}" aria-label="Remove BTC address">&times;</button>
          </span>`;
        }).join('');
      }
    }

    if (vastChipsEl) {
      if (!state.fleet.vastList.length) {
        vastChipsEl.innerHTML = `<span class="note" style="font-size:.74rem">No Vast machine added</span>`;
      } else {
        vastChipsEl.innerHTML = state.fleet.vastList.map((item, idx) => {
          const info = state.vastCache[item.id];
          const gpuShort = info ? `${info.total_gpus}x ${info.gpu_name}` : '';
          const prefix = isDemo ? 'Demo: ' : '';
          return `<span class="f-chip gpu" title="Vast machine_id ${item.id}">
            <span class="c-tag">VAST</span>
            <span class="c-txt">${prefix}#${item.id}${gpuShort ? ' (' + gpuShort + ')' : ''}</span>
            <button type="button" data-rm-vast="${idx}" aria-label="Remove Vast machine">&times;</button>
          </span>`;
        }).join('');
      }
    }

    // Render detailed per-machine rows inside the collapsed <details> drawer
    if (btcContainer) {
      if (!state.fleet.btcList.length) {
        btcContainer.innerHTML = `<div class="empty" style="padding:.5rem;font-size:.78rem">No BTC addresses loaded.</div>`;
      } else {
        btcContainer.innerHTML = state.fleet.btcList.map((item, idx) => {
          const c = state.btcCache[item.addr];
          const statusTxt = c
            ? `${c.txCount90d} payouts (90d) &middot; <b>${c.totalBtc90d.toFixed(4)} BTC</b>`
            : 'Fetching from mempool.space...';
          const asicOpts = Object.keys(ASIC_SPECS).map(k => `<option value="${k}"${item.asic === k ? ' selected' : ''}>${k} (${ASIC_SPECS[k].jPerTh} J/TH)</option>`).join('');
          return `<div class="fleet-item">
            <div class="fleet-item-top">
              <span class="fleet-item-id" title="${item.addr}"><span class="badge btc">BTC</span> ${shortAddr(item.addr)}</span>
              <button type="button" class="btn-sm danger" data-rm-btc="${idx}" style="padding:.12rem .4rem;font-size:.7rem">Remove</button>
            </div>
            <div class="fleet-item-meta">${statusTxt}</div>
            <div class="fleet-item-controls">
              <label>ASIC <select data-btc-asic="${idx}">${asicOpts}</select></label>
              <label>$/kWh <input type="number" step="0.005" min="0" max="0.50" value="${item.kwh}" data-btc-kwh="${idx}"></label>
              <label>TH/s <input type="number" step="10" min="0" max="500000" value="${item.thOverride || ''}" placeholder="Auto" data-btc-th="${idx}"></label>
            </div>
          </div>`;
        }).join('');
      }
    }

    if (vastContainer) {
      if (!state.fleet.vastList.length) {
        vastContainer.innerHTML = `<div class="empty" style="padding:.5rem;font-size:.78rem">No Vast.ai machines loaded.</div>`;
      } else {
        vastContainer.innerHTML = state.fleet.vastList.map((item, idx) => {
          const info = state.vastCache[item.id];
          const statusTxt = info
            ? `<b>${info.total_gpus}x ${info.gpu_name}</b> (${info.geolocation}) &middot; ${info.occupied_gpus}/${info.total_gpus} rented &middot; $${info.dph_host_per_gpu.toFixed(2)}/hr net`
            : 'Querying Vast.ai...';
          return `<div class="fleet-item">
            <div class="fleet-item-top">
              <span class="fleet-item-id"><span class="badge gpu">VAST</span> #${item.id}</span>
              <button type="button" class="btn-sm danger" data-rm-vast="${idx}" style="padding:.12rem .4rem;font-size:.7rem">Remove</button>
            </div>
            <div class="fleet-item-meta">${statusTxt}</div>
            <div class="fleet-item-controls">
              <label>$/kWh <input type="number" step="0.005" min="0" max="0.50" value="${item.kwh}" data-vast-kwh="${idx}"></label>
              <label>Util % <input type="number" step="5" min="0" max="100" value="${item.utilOverride || ''}" placeholder="Auto" data-vast-util="${idx}"></label>
            </div>
          </div>`;
        }).join('');
      }
    }

    const chkBm = document.getElementById('chk-benchmark');
    if (chkBm) chkBm.checked = Boolean(state.fleet.showBenchmark);
  }

  function renderSvgChart(series, scrubberM) {
    const svg = document.getElementById('fleet-chart-svg');
    if (!svg) return;

    const W = 720, H = 270;
    const padL = 62, padR = 20, padT = 18, padB = 32;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const months = [];
    for (let m = -3; m <= 36; m++) months.push(m);

    let minY = 0, maxY = 10000;
    for (const m of months) {
      const pt = series[m];
      if (!pt) continue;
      minY = Math.min(minY, pt.btcNom, pt.gpuNom, pt.totNom, pt.totReal);
      maxY = Math.max(maxY, pt.btcNom, pt.gpuNom, pt.totNom, pt.totReal);
    }
    const spanY = Math.max(1000, maxY - minY);
    minY = Math.min(0, minY - spanY * 0.06);
    maxY = maxY + spanY * 0.08;

    const xOf = m => padL + ((m - (-3)) / 39) * plotW;
    const yOf = v => padT + (1 - (v - minY) / (maxY - minY)) * plotH;
    const makePath = key => months.map((m, i) => `${i === 0 ? 'M' : 'L'}${xOf(m).toFixed(1)},${yOf(series[m][key]).toFixed(1)}`).join(' ');

    const gridLines = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const val = minY + ((maxY - minY) * i) / steps;
      const y = yOf(val);
      gridLines.push(`<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" class="chart-grid" stroke-dasharray="3 3"/>`);
      gridLines.push(`<text x="${padL - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" class="chart-l">${fmtUsdCompact(val)}</text>`);
    }

    const yZero = yOf(0);
    const zeroLine = `<line x1="${padL}" y1="${yZero.toFixed(1)}" x2="${W - padR}" y2="${yZero.toFixed(1)}" stroke="var(--line2)" stroke-width="1.2"/>`;

    const xToday = xOf(0);
    const xHalving = xOf(18);
    const xScrub = xOf(scrubberM);
    const ptScrub = series[scrubberM] || series[36];

    const xTicks = [
      { m: -3, lbl: '-3m (90d)' },
      { m: 0, lbl: 'Today' },
      { m: 12, lbl: '+12m (Y1)' },
      { m: 18, lbl: '+18m (Halving)' },
      { m: 24, lbl: '+24m (Y2)' },
      { m: 36, lbl: '+36m (Y3)' }
    ];
    const xLabels = xTicks.map(t => `<text x="${xOf(t.m).toFixed(1)}" y="${H - 8}" text-anchor="middle" class="chart-l">${t.lbl}</text>`).join('');

    svg.innerHTML = `
      <rect x="${padL}" y="${padT}" width="${(xToday - padL).toFixed(1)}" height="${plotH}" fill="var(--accent-soft)" opacity="0.35"/>
      ${gridLines.join('')}
      ${zeroLine}
      <line x1="${xToday.toFixed(1)}" y1="${padT}" x2="${xToday.toFixed(1)}" y2="${padT + plotH}" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="4 3"/>
      <text x="${(xToday + 5).toFixed(1)}" y="${padT + 12}" class="chart-l" style="fill:var(--accent-ink);font-size:10px">Today &rarr; 36m</text>
      <line x1="${xHalving.toFixed(1)}" y1="${padT}" x2="${xHalving.toFixed(1)}" y2="${padT + plotH}" stroke="var(--line2)" stroke-width="1" stroke-dasharray="2 3"/>
      <path d="${makePath('btcNom')}" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linecap="round"/>
      <path d="${makePath('gpuNom')}" fill="none" stroke="var(--gpu)" stroke-width="2.4" stroke-linecap="round"/>
      <path d="${makePath('totNom')}" fill="none" stroke="var(--good)" stroke-width="2.6" stroke-linecap="round"/>
      <path d="${makePath('totReal')}" fill="none" stroke="var(--text)" stroke-width="2" stroke-dasharray="5 4" stroke-linecap="round"/>
      <line x1="${xScrub.toFixed(1)}" y1="${padT}" x2="${xScrub.toFixed(1)}" y2="${padT + plotH}" stroke="var(--text)" stroke-width="1.5"/>
      <circle cx="${xScrub.toFixed(1)}" cy="${yOf(ptScrub.btcNom).toFixed(1)}" r="4" fill="var(--accent)"/>
      <circle cx="${xScrub.toFixed(1)}" cy="${yOf(ptScrub.gpuNom).toFixed(1)}" r="4" fill="var(--gpu)"/>
      <circle cx="${xScrub.toFixed(1)}" cy="${yOf(ptScrub.totNom).toFixed(1)}" r="4.5" fill="var(--good)"/>
      <circle cx="${xScrub.toFixed(1)}" cy="${yOf(ptScrub.totReal).toFixed(1)}" r="4" fill="var(--text)"/>
      ${xLabels}
    `;
  }

  function recalcAndRender() {
    document.getElementById('val-btc-y1').textContent = fmtUsd(state.btcY1);
    document.getElementById('val-btc-y2').textContent = fmtUsd(state.btcY2);
    document.getElementById('val-btc-y3').textContent = fmtUsd(state.btcY3);

    const activeRate = state.deflatorMode === 'm2' ? state.m2Rate : state.cpiRate;
    const lblDef = document.getElementById('lbl-deflator-rate');
    const valDef = document.getElementById('val-cpi');
    if (lblDef) lblDef.textContent = state.deflatorMode === 'm2' ? 'M2 Supply Growth' : 'CPI Inflation Rate';
    if (valDef) valDef.textContent = `${activeRate.toFixed(1)}%/yr`;

    const btcModels = state.fleet.btcList.map(computeBtcUnitModel);
    const gpuModels = state.fleet.vastList.map(computeVastUnitModel);
    const allUnits = [...btcModels, ...gpuModels];
    const totalKw = allUnits.reduce((s, u) => s + u.kw, 0);

    // Update top wizard status & demo banner
    const isDemo = Boolean(state.fleet.isSample);
    const modeLabel = document.getElementById('fleet-mode-label');
    const wizDot = document.getElementById('wiz-dot');
    const drawerSummary = document.getElementById('wiz-drawer-summary');
    const demoBanner = document.getElementById('demo-banner');
    const demoBannerText = document.getElementById('demo-banner-text');

    if (modeLabel) {
      modeLabel.textContent = isDemo
        ? `Viewing Demo Fleet (2 ASICs + 2 GPUs) · Add yours below or expand to edit preset`
        : `Your Fleet (${btcModels.length} BTC + ${gpuModels.length} Vast · saved in browser)`;
    }
    if (wizDot) {
      wizDot.className = isDemo ? 'wiz-dot' : 'wiz-dot user';
    }
    if (drawerSummary) {
      drawerSummary.textContent = isDemo
        ? `Edit ${allUnits.length} demo preset machines & power rates (${totalKw.toFixed(1)} kW total)`
        : `Edit ${allUnits.length} loaded machine${allUnits.length === 1 ? '' : 's'} & power rates (${totalKw.toFixed(1)} kW total)`;
    }
    if (demoBanner && demoBannerText) {
      if (isDemo) {
        demoBanner.className = 'demo-bar';
        demoBannerText.innerHTML = `&#128202; <b>Demo Fleet Results below</b> (2 Ocean BTC addresses + 2 Vast.ai GPU rigs). Paste your address or machine ID above to replace with your own.`;
      } else {
        demoBanner.className = 'demo-bar user-mode';
        demoBannerText.innerHTML = `&#9989; <b>Showing Your Custom Fleet</b> (${btcModels.length} BTC address${btcModels.length === 1 ? '' : 'es'} + ${gpuModels.length} Vast.ai rig${gpuModels.length === 1 ? '' : 's'} &middot; ${totalKw.toFixed(1)} kW total). Saved only in this browser.`;
      }
    }

    // Build combined timeline series (-3 .. +36)
    const series = {};
    const deflatorKey = state.deflatorMode === 'm2' ? 'm2Net' : 'cpiNet';
    for (let m = -3; m <= 36; m++) {
      const btcNom = btcModels.reduce((s, u) => s + u.byMonth[m].nomNet, 0);
      const gpuNom = gpuModels.reduce((s, u) => s + u.byMonth[m].nomNet, 0);
      const btcReal = btcModels.reduce((s, u) => s + u.byMonth[m][deflatorKey], 0);
      const gpuReal = gpuModels.reduce((s, u) => s + u.byMonth[m][deflatorKey], 0);
      series[m] = {
        btcNom,
        gpuNom,
        totNom: btcNom + gpuNom,
        totReal: btcReal + gpuReal
      };
    }

    // Top 4 KPI Cards
    const tot90dBtc = btcModels.reduce((s, u) => s + u.past90dBtc, 0);
    const tot90dGpuNet = gpuModels.reduce((s, u) => s + u.past90dNetUsd, 0);
    const tot90dNet = allUnits.reduce((s, u) => s + u.past90dNetUsd, 0);

    document.getElementById('kpi-90d-net').textContent = fmtUsd(tot90dNet);
    document.getElementById('kpi-90d-sub').textContent = `${tot90dBtc.toFixed(4)} BTC mined + ${fmtUsdCompact(tot90dGpuNet)} GPU net`;

    const end36 = series[36];
    const tot36Depr = allUnits.reduce((s, u) => s + u.byMonth[36].deprUsd, 0);
    const debaseDrag36 = end36.totNom - end36.totReal;

    document.getElementById('kpi2-badge').textContent = state.deflatorMode === 'm2' ? 'M2 Real' : 'CPI Real';
    document.getElementById('kpi-36m-real').textContent = fmtUsd(end36.totReal);
    document.getElementById('kpi-36m-nom').textContent = `Nominal: ${fmtUsdCompact(end36.totNom)} after power & capex`;

    const posBtc = Math.max(0, end36.btcNom);
    const posGpu = Math.max(0, end36.gpuNom);
    const posSum = Math.max(1, posBtc + posGpu);
    const btcShare = allUnits.length ? Math.round((posBtc / posSum) * 100) : 0;
    const gpuShare = allUnits.length ? (100 - btcShare) : 0;
    const monthlyGpuCash = gpuModels.reduce((s, u) => s + u.monthlyNetCashUsd, 0);
    const end36BtcGross = btcModels.reduce((s, u) => s + u.byMonth[36].grossUsd, 0);

    document.getElementById('kpi-split-val').textContent = `${btcShare}% BTC / ${gpuShare}% AI`;
    document.getElementById('kpi-split-foot').textContent = `${fmtUsdCompact(monthlyGpuCash)}/mo GPU · ${fmtUsdCompact(end36BtcGross)} 3Y BTC`;

    const totalDrag = -(tot36Depr + Math.max(0, debaseDrag36));
    document.getElementById('kpi-drag-val').textContent = fmtUsd(totalDrag);
    document.getElementById('kpi-drag-sub').textContent = `${fmtUsdCompact(-tot36Depr)} capex & ${fmtUsdCompact(-Math.max(0, debaseDrag36))} ${state.deflatorMode.toUpperCase()} drag`;

    // Scrubber & SVG Chart
    const m = state.scrubberMonth;
    renderSvgChart(series, m);

    const mLabel = m < 0 ? `Month ${m} (90d)` : (m === 0 ? 'Month 0 (Today)' : `Month +${m}${m === 18 ? ' (Halving)' : ''}`);
    const mShort = m <= 0 ? (m === 0 ? '90d' : `${m}m`) : `+${m}m`;
    document.getElementById('scrubber-pill').textContent = mLabel;

    const btcAtM = Math.round(getBtcPriceAtMonth(m));
    const inlineReadout = document.getElementById('scrubber-inline-readout');
    if (inlineReadout) {
      inlineReadout.innerHTML = `BTC ${fmtUsd(btcAtM)} &middot; Nominal <b>${fmtUsd(series[m].totNom)}</b> &middot; Real <b id="scr-real">${fmtUsd(series[m].totReal)}</b>`;
    }

    // Breakdown Table at selected scrubber month
    document.getElementById('tbl-horizon-label').textContent = `at ${mLabel}`;
    document.getElementById('tbl-basis-note').textContent = state.deflatorMode === 'm2'
      ? `Real $ discounted at ${state.m2Rate.toFixed(1)}%/yr M2 growth`
      : `Real $ discounted at ${state.cpiRate.toFixed(1)}%/yr CPI`;
    for (const el of document.querySelectorAll('.m-lbl')) {
      el.textContent = mShort;
    }

    const rowsHtml = [];
    for (const u of allUnits) {
      const snap = u.byMonth[m];
      const realVal = state.deflatorMode === 'm2' ? snap.m2Net : snap.cpiNet;
      const badge = u.kind === 'btc' ? '<span class="badge btc">BTC</span>' : '<span class="badge gpu">VAST</span>';
      rowsHtml.push(`<tr>
        <td>
          <div>${badge} <b>${u.title}</b></div>
          <div class="note" style="font-size:.73rem">${u.subtitle}</div>
        </td>
        <td>${u.kw.toFixed(1)} kW<div class="note" style="font-size:.72rem">$${u.kwhRate.toFixed(3)}/kWh</div></td>
        <td class="${u.past90dNetUsd >= 0 ? 'pos' : 'neg'}"><b>${fmtUsd(u.past90dNetUsd)}</b></td>
        <td>${fmtUsd(snap.grossUsd)}</td>
        <td class="neg">${fmtUsd(-snap.powerUsd)}</td>
        <td class="neg">${fmtUsd(-snap.deprUsd)}</td>
        <td class="${snap.nomNet >= 0 ? 'pos' : 'neg'}"><b>${fmtUsd(snap.nomNet)}</b></td>
        <td class="${realVal >= 0 ? 'pos' : 'neg'}"><b>${fmtUsd(realVal)}</b></td>
      </tr>`);
    }

    if (state.fleet.showBenchmark) {
      const bmUnit = computeBenchmarkModel(btcModels, gpuModels);
      const bmSnap = bmUnit.byMonth[m];
      const bmReal = state.deflatorMode === 'm2' ? bmSnap.m2Net : bmSnap.cpiNet;
      rowsHtml.push(`<tr class="bm-row">
        <td>
          <div><span class="badge bm">BENCHMARK</span> <b>${bmUnit.title}</b></div>
          <div class="note" style="font-size:.73rem">${bmUnit.subtitle}</div>
        </td>
        <td>${bmUnit.kw.toFixed(1)} kW<div class="note" style="font-size:.72rem">$${bmUnit.kwhRate.toFixed(3)}/kWh</div></td>
        <td><b>${fmtUsd(bmUnit.past90dNetUsd)}</b></td>
        <td>${fmtUsd(bmSnap.grossUsd)}</td>
        <td class="neg">${fmtUsd(-bmSnap.powerUsd)}</td>
        <td class="neg">${fmtUsd(-bmSnap.deprUsd)}</td>
        <td><b>${fmtUsd(bmSnap.nomNet)}</b></td>
        <td><b>${fmtUsd(bmReal)}</b></td>
      </tr>`);
    }

    document.getElementById('fleet-tbody').innerHTML = rowsHtml.join('') || `<tr><td colspan="8" class="empty">No machines loaded. Paste a Bitcoin payout address or Vast.ai Machine ID in Step 1 or Step 2 above.</td></tr>`;

    const totGrossM = allUnits.reduce((s, u) => s + u.byMonth[m].grossUsd, 0);
    const totPowerM = allUnits.reduce((s, u) => s + u.byMonth[m].powerUsd, 0);
    const totDeprM = allUnits.reduce((s, u) => s + u.byMonth[m].deprUsd, 0);
    const totNomM = series[m].totNom;
    const totRealM = series[m].totReal;

    document.getElementById('fleet-tfoot').innerHTML = `<tr class="tot-row">
      <td>Total Fleet (${allUnits.length} unit${allUnits.length === 1 ? '' : 's'})</td>
      <td>${totalKw.toFixed(1)} kW</td>
      <td class="${tot90dNet >= 0 ? 'pos' : 'neg'}">${fmtUsd(tot90dNet)}</td>
      <td>${fmtUsd(totGrossM)}</td>
      <td class="neg">${fmtUsd(-totPowerM)}</td>
      <td class="neg">${fmtUsd(-totDeprM)}</td>
      <td class="${totNomM >= 0 ? 'pos' : 'neg'}">${fmtUsd(totNomM)}</td>
      <td class="${totRealM >= 0 ? 'pos' : 'neg'}">${fmtUsd(totRealM)}</td>
    </tr>`;
  }

  function bindEvents() {
    const slY1 = document.getElementById('sl-btc-y1');
    const slY2 = document.getElementById('sl-btc-y2');
    const slY3 = document.getElementById('sl-btc-y3');
    const slCpi = document.getElementById('sl-cpi');
    const slScrub = document.getElementById('sl-scrubber');
    const selDiff = document.getElementById('sel-diff');

    let sliderEvSent = false;
    const onPriceSlide = () => {
      state.btcY1 = Number(slY1.value);
      state.btcY2 = Number(slY2.value);
      state.btcY3 = Number(slY3.value);
      if (!sliderEvSent) { sliderEvSent = true; fireEvent('slider-btc'); }
      recalcAndRender();
    };
    slY1?.addEventListener('input', onPriceSlide);
    slY2?.addEventListener('input', onPriceSlide);
    slY3?.addEventListener('input', onPriceSlide);

    slCpi?.addEventListener('input', () => {
      if (state.deflatorMode === 'm2') {
        state.m2Rate = Number(slCpi.value);
      } else {
        state.cpiRate = Number(slCpi.value);
      }
      recalcAndRender();
    });

    let scrubEvSent = false;
    slScrub?.addEventListener('input', () => {
      state.scrubberMonth = Number(slScrub.value);
      if (!scrubEvSent) { scrubEvSent = true; fireEvent('scrubber'); }
      recalcAndRender();
    });

    selDiff?.addEventListener('change', () => {
      state.diffDriftMonthly = Number(selDiff.value);
      recalcAndRender();
    });

    for (const radio of document.querySelectorAll('input[name="deflator"]')) {
      radio.addEventListener('change', e => {
        if (e.target.checked) {
          state.deflatorMode = e.target.value;
          if (slCpi) {
            slCpi.value = state.deflatorMode === 'm2' ? state.m2Rate : state.cpiRate;
          }
          recalcAndRender();
        }
      });
    }

    for (const btn of document.querySelectorAll('.fp-chip')) {
      btn.addEventListener('click', () => {
        for (const b of document.querySelectorAll('.fp-chip')) b.setAttribute('aria-pressed', 'false');
        btn.setAttribute('aria-pressed', 'true');
        const fp = btn.dataset.fp;
        if (fp === 'flat') {
          const s = Math.round(state.spotBtcUsd / 2500) * 2500;
          state.btcY1 = s; state.btcY2 = s; state.btcY3 = s;
        } else if (fp === 'bull') {
          state.btcY1 = 125000; state.btcY2 = 185000; state.btcY3 = 250000;
        } else if (fp === 'bear') {
          state.btcY1 = 55000; state.btcY2 = 70000; state.btcY3 = 85000;
        } else {
          state.btcY1 = 100000; state.btcY2 = 135000; state.btcY3 = 180000;
        }
        slY1.value = state.btcY1;
        slY2.value = state.btcY2;
        slY3.value = state.btcY3;
        fireEvent('preset');
        recalcAndRender();
      });
    }

    // Step 1: Add BTC address
    document.getElementById('form-add-btc')?.addEventListener('submit', async e => {
      e.preventDefault();
      const addrIn = document.getElementById('in-btc-addr');
      const addr = (addrIn.value || '').trim();
      if (addr.length < 24) return;
      const kwh = getGlobalKwh();

      // If currently viewing demo presets, replace demo with the user's own fleet
      if (state.fleet.isSample) {
        state.fleet.isSample = false;
        state.fleet.btcList = [];
        state.fleet.vastList = [];
      }
      state.fleet.btcList.push({
        addr,
        label: 'Miner',
        kwh,
        asic: 'S21 XP',
        thOverride: 0
      });
      addrIn.value = '';
      saveFleetToLocalStorage();
      fireEvent('btc-add');
      renderConfigLists();
      recalcAndRender();
      await fetchBtcAddress90d(addr);
      fireEvent('btc-lookup');
      renderConfigLists();
      recalcAndRender();
    });

    // Step 2: Add Vast Machine ID
    document.getElementById('form-add-vast')?.addEventListener('submit', async e => {
      e.preventDefault();
      const idIn = document.getElementById('in-vast-id');
      const id = parseInt((idIn.value || '').replace(/[^0-9]/g, ''), 10);
      if (!Number.isFinite(id) || id <= 0) return;
      const kwh = getGlobalKwh();

      // If currently viewing demo presets, replace demo with the user's own fleet
      if (state.fleet.isSample) {
        state.fleet.isSample = false;
        state.fleet.btcList = [];
        state.fleet.vastList = [];
      }
      state.fleet.vastList.push({
        id,
        label: 'Vast #' + id,
        kwh,
        utilOverride: 0
      });
      idIn.value = '';
      saveFleetToLocalStorage();
      fireEvent('vast-add');
      renderConfigLists();
      recalcAndRender();
      await fetchVastMachines([id]);
      fireEvent('vast-lookup');
      renderConfigLists();
      recalcAndRender();
    });

    // Step 3: Apply global power rate to all loaded machines
    document.getElementById('btn-apply-kwh')?.addEventListener('click', () => {
      const kwh = getGlobalKwh();
      for (const b of state.fleet.btcList) b.kwh = kwh;
      for (const v of state.fleet.vastList) v.kwh = kwh;
      saveFleetToLocalStorage();
      renderConfigLists();
      recalcAndRender();
    });

    // Clear demo & start blank
    document.getElementById('btn-start-blank')?.addEventListener('click', () => {
      state.fleet = { isSample: false, btcList: [], vastList: [], showBenchmark: false };
      saveFleetToLocalStorage();
      renderConfigLists();
      recalcAndRender();
      document.getElementById('in-btc-addr')?.focus();
    });

    // Delegate remove & inline override changes inside #fleet-inputs
    document.getElementById('fleet-inputs')?.addEventListener('click', e => {
      const rmBtc = e.target.closest('[data-rm-btc]');
      if (rmBtc) {
        const idx = Number(rmBtc.dataset.rmBtc);
        state.fleet.isSample = false;
        state.fleet.btcList.splice(idx, 1);
        saveFleetToLocalStorage();
        renderConfigLists();
        recalcAndRender();
        return;
      }
      const rmVast = e.target.closest('[data-rm-vast]');
      if (rmVast) {
        const idx = Number(rmVast.dataset.rmVast);
        state.fleet.isSample = false;
        state.fleet.vastList.splice(idx, 1);
        saveFleetToLocalStorage();
        renderConfigLists();
        recalcAndRender();
      }
    });

    document.getElementById('fleet-inputs')?.addEventListener('change', e => {
      const t = e.target;
      if (t.dataset.btcAsic !== undefined) {
        const idx = Number(t.dataset.btcAsic);
        if (state.fleet.btcList[idx]) {
          state.fleet.isSample = false;
          state.fleet.btcList[idx].asic = t.value;
          saveFleetToLocalStorage();
          recalcAndRender();
        }
      } else if (t.dataset.btcKwh !== undefined) {
        const idx = Number(t.dataset.btcKwh);
        if (state.fleet.btcList[idx]) {
          state.fleet.isSample = false;
          state.fleet.btcList[idx].kwh = parseFloat(t.value) || 0.06;
          saveFleetToLocalStorage();
          recalcAndRender();
        }
      } else if (t.dataset.btcTh !== undefined) {
        const idx = Number(t.dataset.btcTh);
        if (state.fleet.btcList[idx]) {
          state.fleet.isSample = false;
          state.fleet.btcList[idx].thOverride = parseFloat(t.value) || 0;
          saveFleetToLocalStorage();
          recalcAndRender();
        }
      } else if (t.dataset.vastKwh !== undefined) {
        const idx = Number(t.dataset.vastKwh);
        if (state.fleet.vastList[idx]) {
          state.fleet.isSample = false;
          state.fleet.vastList[idx].kwh = parseFloat(t.value) || 0.065;
          saveFleetToLocalStorage();
          recalcAndRender();
        }
      } else if (t.dataset.vastUtil !== undefined) {
        const idx = Number(t.dataset.vastUtil);
        if (state.fleet.vastList[idx]) {
          state.fleet.isSample = false;
          state.fleet.vastList[idx].utilOverride = parseFloat(t.value) || 0;
          saveFleetToLocalStorage();
          recalcAndRender();
        }
      } else if (t.id === 'chk-benchmark') {
        state.fleet.showBenchmark = t.checked;
        saveFleetToLocalStorage();
        fireEvent('benchmark-toggle');
        recalcAndRender();
      }
    });

    document.getElementById('btn-clear-top')?.addEventListener('click', clearSavedFleet);
    document.getElementById('btn-reset-sample')?.addEventListener('click', () => {
      state.fleet = getDefaultSampleFleet();
      saveFleetToLocalStorage();
      fireEvent('sample');
      renderConfigLists();
      recalcAndRender();
    });

    document.getElementById('btn-refresh-live')?.addEventListener('click', refreshAllLiveFeeds);

    document.getElementById('btn-copy-link')?.addEventListener('click', async e => {
      const btn = e.currentTarget;
      const u = new URL(window.location.href);
      u.search = '';
      if (state.fleet.btcList.length) {
        u.searchParams.set('btc', state.fleet.btcList.map(b => b.addr).join(','));
      }
      if (state.fleet.vastList.length) {
        u.searchParams.set('vast', state.fleet.vastList.map(v => v.id).join(','));
      }
      try {
        await navigator.clipboard.writeText(u.toString());
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Share link'; }, 1800);
      } catch (_) {}
    });
  }

  initFleetState();
  renderConfigLists();
  recalcAndRender();
  bindEvents();
  refreshAllLiveFeeds();
})();
