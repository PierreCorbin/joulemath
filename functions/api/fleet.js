// Stateless read-only proxy for Vast.ai public bundle lookup by machine_id.
// PRIVACY GUARANTEE: This endpoint stores NOTHING in KV, databases, or logs.
// User-submitted machine IDs are passed directly to Vast.ai's public bundle API
// and discarded immediately after the response is returned.

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, max-age=120',
  'X-Privacy-Policy': 'stateless-no-storage-no-logging'
};

// Marketplace benchmark medians by GPU model (from JouleMath GPU snapshot, methodology/#sources-gpu)
const MARKET_MEDIANS = {
  'H100 SXM': { renterDph: 2.13, hostDph: 1.70, util: 0.56, tdpW: 700, sysW: 1000, capexPerGpu: 27500 },
  'H100 NVL': { renterDph: 1.95, hostDph: 1.56, util: 0.54, tdpW: 400, sysW: 600, capexPerGpu: 25000 },
  'H100 PCIE': { renterDph: 1.85, hostDph: 1.48, util: 0.52, tdpW: 350, sysW: 550, capexPerGpu: 24000 },
  'A100 SXM4': { renterDph: 0.95, hostDph: 0.76, util: 0.55, tdpW: 400, sysW: 600, capexPerGpu: 10500 },
  'A100 PCIE': { renterDph: 0.85, hostDph: 0.68, util: 0.52, tdpW: 300, sysW: 480, capexPerGpu: 9500 },
  'RTX 5090': { renterDph: 0.64, hostDph: 0.51, util: 0.62, tdpW: 575, sysW: 725, capexPerGpu: 2600 },
  'RTX 4090': { renterDph: 0.35, hostDph: 0.28, util: 0.61, tdpW: 450, sysW: 600, capexPerGpu: 2000 },
  'RTX 4080': { renterDph: 0.21, hostDph: 0.17, util: 0.48, tdpW: 320, sysW: 450, capexPerGpu: 1150 },
  'RTX 4080S': { renterDph: 0.23, hostDph: 0.18, util: 0.50, tdpW: 320, sysW: 450, capexPerGpu: 1200 },
  'RTX 3090': { renterDph: 0.16, hostDph: 0.13, util: 0.46, tdpW: 350, sysW: 480, capexPerGpu: 850 },
  'RTX 3080': { renterDph: 0.10, hostDph: 0.08, util: 0.35, tdpW: 320, sysW: 440, capexPerGpu: 500 }
};

// Snapshot fallback for sample fleet & common machines if Vast API is temporarily unreachable or machine is delisted
const SNAPSHOT_FALLBACK = {
  142194: {
    machine_id: 142194,
    gpu_name: 'H100 SXM',
    total_gpus: 4,
    avail_gpus: 0,
    occupied_gpus: 4,
    utilization_live: 1.0,
    utilization_est: 0.78,
    dph_renter_per_gpu: 2.138,
    dph_host_per_gpu: 1.710,
    min_bid_per_gpu: 1.496,
    reliability: 0.9803,
    verification: 'verified',
    geolocation: 'Montana, US',
    gpu_ram_gb: 80,
    gpu_tdp_w: 700,
    sys_watts_per_gpu: 1000,
    cpu_name: 'AMD EPYC 9534 64-Core Processor',
    inet_down: 851,
    inet_up: 852,
    source: 'vast-snapshot'
  },
  153411: {
    machine_id: 153411,
    gpu_name: 'RTX 4090',
    total_gpus: 2,
    avail_gpus: 1,
    occupied_gpus: 1,
    utilization_live: 0.5,
    utilization_est: 0.65,
    dph_renter_per_gpu: 0.380,
    dph_host_per_gpu: 0.304,
    min_bid_per_gpu: 0.250,
    reliability: 0.9924,
    verification: 'deverified',
    geolocation: 'Texas, US',
    gpu_ram_gb: 24,
    gpu_tdp_w: 450,
    sys_watts_per_gpu: 600,
    cpu_name: 'AMD EPYC 7532 32-Core Processor',
    inet_down: 892,
    inet_up: 899,
    source: 'vast-snapshot'
  },
  291940: {
    machine_id: 291940,
    gpu_name: 'H100 SXM',
    total_gpus: 8,
    avail_gpus: 2,
    occupied_gpus: 6,
    utilization_live: 0.75,
    utilization_est: 0.72,
    dph_renter_per_gpu: 1.667,
    dph_host_per_gpu: 1.333,
    min_bid_per_gpu: 1.667,
    reliability: 0.9951,
    verification: 'verified',
    geolocation: 'Utah, US',
    gpu_ram_gb: 80,
    gpu_tdp_w: 700,
    sys_watts_per_gpu: 1000,
    cpu_name: 'Intel Xeon Platinum 8480+',
    inet_down: 1800,
    inet_up: 1800,
    source: 'vast-snapshot'
  },
  525275: {
    machine_id: 525275,
    gpu_name: 'RTX 5090',
    total_gpus: 4,
    avail_gpus: 1,
    occupied_gpus: 3,
    utilization_live: 0.75,
    utilization_est: 0.68,
    dph_renter_per_gpu: 0.650,
    dph_host_per_gpu: 0.520,
    min_bid_per_gpu: 0.480,
    reliability: 0.9910,
    verification: 'verified',
    geolocation: 'Sweden, SE',
    gpu_ram_gb: 32,
    gpu_tdp_w: 575,
    sys_watts_per_gpu: 725,
    cpu_name: 'AMD EPYC 9354',
    inet_down: 1200,
    inet_up: 1200,
    source: 'vast-snapshot'
  }
};

function getBenchmarkForGpu(gpuName = '') {
  const upper = String(gpuName).toUpperCase();
  for (const [k, v] of Object.entries(MARKET_MEDIANS)) {
    if (upper.includes(k.toUpperCase())) return { model: k, ...v };
  }
  if (upper.includes('H100')) return { model: 'H100 SXM', ...MARKET_MEDIANS['H100 SXM'] };
  if (upper.includes('A100')) return { model: 'A100 SXM4', ...MARKET_MEDIANS['A100 SXM4'] };
  if (upper.includes('5090')) return { model: 'RTX 5090', ...MARKET_MEDIANS['RTX 5090'] };
  if (upper.includes('4090')) return { model: 'RTX 4090', ...MARKET_MEDIANS['RTX 4090'] };
  if (upper.includes('4080')) return { model: 'RTX 4080', ...MARKET_MEDIANS['RTX 4080'] };
  if (upper.includes('3090')) return { model: 'RTX 3090', ...MARKET_MEDIANS['RTX 3090'] };
  if (upper.includes('3080')) return { model: 'RTX 3080', ...MARKET_MEDIANS['RTX 3080'] };
  return { model: gpuName || 'GPU', renterDph: 0.50, hostDph: 0.40, util: 0.55, tdpW: 400, sysW: 550, capexPerGpu: 2500 };
}

function summarizeOffersForMachine(machineId, offers) {
  if (!offers || !offers.length) {
    const fb = SNAPSHOT_FALLBACK[machineId];
    if (fb) {
      const bm = getBenchmarkForGpu(fb.gpu_name);
      return { ...fb, benchmark: bm };
    }
    return null;
  }

  // Sort by num_gpus ascending so 1-GPU offer is first for clean per-GPU pricing
  const sorted = [...offers].sort((a, b) => (a.num_gpus || 1) - (b.num_gpus || 1));
  const first = sorted[0];
  const gpuName = first.gpu_name || 'Unknown GPU';
  const bm = getBenchmarkForGpu(gpuName);

  // Total physical GPUs on machine: derived from max num_gpus or num_gpus / gpu_frac
  let totalGpus = 1;
  for (const o of sorted) {
    const n = o.num_gpus || 1;
    const frac = o.gpu_frac || 1;
    const impliedTotal = Math.round(n / frac);
    if (impliedTotal > totalGpus) totalGpus = impliedTotal;
    if (n > totalGpus) totalGpus = n;
  }

  // Available (unrented & rentable) GPUs right now
  const unrentedOffers = sorted.filter(o => o.rentable !== false && !o.rented);
  let availGpus = 0;
  for (const o of unrentedOffers) {
    if ((o.num_gpus || 0) > availGpus) availGpus = o.num_gpus;
  }
  if (availGpus > totalGpus) availGpus = totalGpus;
  const occupiedGpus = Math.max(0, totalGpus - availGpus);
  const liveUtil = totalGpus > 0 ? occupiedGpus / totalGpus : 0;

  // Per-GPU hourly rates (Vast renter rate includes ~25% platform markup over host payout; host receives ~80% of renter rate)
  const refOffer = sorted[0];
  const refGpus = Math.max(1, refOffer.num_gpus || 1);
  const dphBasePerGpu = (refOffer.dph_base || refOffer.dph_total || bm.renterDph) / refGpus;
  const dphHostPerGpu = +(dphBasePerGpu * 0.80).toFixed(4);
  const minBidPerGpu = refOffer.min_bid ? +(refOffer.min_bid / refGpus).toFixed(4) : +(dphHostPerGpu * 0.85).toFixed(4);

  // Blend live occupancy with marketplace baseline & reliability for 90d/36m expected utilization
  const reliability = typeof first.reliability2 === 'number' ? first.reliability2 : (first.reliability || 0.98);
  const estUtil = +Math.min(0.95, Math.max(0.25, liveUtil * 0.45 + bm.util * 0.55)).toFixed(2);

  const tdpW = Math.round(first.gpu_max_power || bm.tdpW);
  const sysW = Math.round(Math.max(tdpW * 1.32, bm.sysW));

  return {
    machine_id: Number(machineId),
    gpu_name: gpuName,
    total_gpus: totalGpus,
    avail_gpus: availGpus,
    occupied_gpus: occupiedGpus,
    utilization_live: +liveUtil.toFixed(2),
    utilization_est: estUtil,
    dph_renter_per_gpu: +dphBasePerGpu.toFixed(4),
    dph_host_per_gpu: dphHostPerGpu,
    min_bid_per_gpu: minBidPerGpu,
    reliability: +reliability.toFixed(4),
    verification: first.verification || 'unverified',
    geolocation: first.geolocation || 'Unknown',
    gpu_ram_gb: first.gpu_ram ? Math.round(first.gpu_ram / 1024) : 24,
    gpu_tdp_w: tdpW,
    sys_watts_per_gpu: sysW,
    cpu_name: (first.cpu_name || '').trim() || 'Server CPU',
    inet_down: Math.round(first.inet_down || 0),
    inet_up: Math.round(first.inet_up || 0),
    source: 'vast-live',
    benchmark: bm
  };
}

function parseMachineIds(raw) {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : String(raw).split(/[\s,;]+/);
  const out = [];
  for (const item of list) {
    const n = parseInt(String(item).replace(/[^0-9]/g, ''), 10);
    if (Number.isFinite(n) && n > 0 && n < 100000000 && !out.includes(n)) {
      out.push(n);
    }
    if (out.length >= 25) break;
  }
  return out;
}

async function handleLookup(ids) {
  if (!ids.length) {
    return new Response(JSON.stringify({ ok: true, machines: {}, marketMedians: MARKET_MEDIANS }), {
      status: 200,
      headers: HEADERS
    });
  }

  let offersByMachine = {};
  let apiStatus = 'live';

  try {
    const vastRes = await fetch('https://console.vast.ai/api/v0/bundles/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'JouleMath-FleetCheck/1.0 (+https://joulemath.com/fleet/)'
      },
      body: JSON.stringify({
        machine_id: { in: ids },
        rentable: { in: [true, false] },
        rented: { in: [true, false] },
        verified: { in: [true, false] },
        limit: 250
      })
    });

    if (vastRes.ok) {
      const data = await vastRes.json();
      for (const o of data.offers || []) {
        const mid = Number(o.machine_id);
        if (!offersByMachine[mid]) offersByMachine[mid] = [];
        offersByMachine[mid].push(o);
      }
    } else {
      apiStatus = 'fallback';
    }
  } catch (_) {
    apiStatus = 'fallback';
  }

  const machines = {};
  for (const id of ids) {
    const summary = summarizeOffersForMachine(id, offersByMachine[id] || []);
    if (summary) {
      machines[id] = summary;
    } else {
      machines[id] = {
        machine_id: id,
        not_found: true,
        error: 'Machine ID not found in active Vast.ai bundles (machine may be offline, delisted, or private).'
      };
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      status: apiStatus,
      privacy: 'stateless-pass-through-zero-storage',
      machines,
      marketMedians: MARKET_MEDIANS
    }),
    { status: 200, headers: HEADERS }
  );
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: HEADERS });
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const ids = parseMachineIds(url.searchParams.get('machines') || url.searchParams.get('id'));
  return handleLookup(ids);
}

export async function onRequestPost({ request }) {
  let ids = [];
  try {
    const body = await request.json();
    ids = parseMachineIds(body.machines || body.machine_ids || body.ids);
  } catch (_) {}
  return handleLookup(ids);
}
