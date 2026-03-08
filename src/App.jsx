import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background, Controls, MiniMap,
  MarkerType, Handle, Position, BaseEdge, EdgeLabelRenderer, getBezierPath
} from 'reactflow';
import 'reactflow/dist/style.css';

// === SECTION 1 & 2: BBN NODE DEFINITIONS, METADATA & EDGES ===
const DATA = {
  R1: { t: 'R', n: "U.S. / Allied Interceptor & Air Defense Depletion", txt: "Composite measure of Patriot PAC-3, Iron Dome, David's Sling, and THAAD inventory exhaustion across U.S. CENTCOM and IDF theater. Tracks the ratio of interceptor magazines spent vs. restocked following sustained drone/missile campaigns since Oct 2023. High = critically low reserves.", val: 0.45 },
  R2: { t: 'R', n: "Iranian Ballistic Missile, Cruise Missile & Drone Operational Capacity", txt: "Surviving IRGC mobile launcher assets, Shahed drone production throughput, and Fateh/Fattah-2 hypersonic unit readiness. Adjusted for Israeli strike degradation. High = IRGC retains significant first-strike capability.", val: 0.55 },
  R3: { t: 'R', n: "U.S. Domestic Political Paralysis & Civil Unrest Index", txt: "Composite: debt ceiling crisis probability, executive-legislative deadlock score, social protest intensity (anti-war, economic, immigration), and national guard deployment levels. High = U.S. unable to authorize rapid overseas military force.", val: 0.50 },
  R4: { t: 'R', n: "BRICS+ De-dollarization Momentum & Sanctions Evasion Capacity", txt: "Tracks mBridge CBDC adoption rate, yuan-denominated energy contracts, Russian-Iranian alternative SWIFT volume, and gold-backed settlement agreements among BRICS+ members. High = adversaries can sustain economic war while circumventing dollar-based pressure.", val: 0.40 },
  R5: { t: 'R', n: "Indo-Pakistani Conventional Border Escalation Level", txt: "LOC ceasefire violation frequency, forward deployment of Strike Corps, cross-border artillery exchange intensity, and Balakot-style air incursion probability. High = conventional war imminent in South Asia.", val: 0.35 },
  R6: { t: 'R', n: "Global Staple Crop & Agricultural Supply Fragility", txt: "Composite of wheat/rice/maize reserve-to-use ratios, Black Sea corridor disruption level, La Niña-driven regional drought severity index, and fertilizer (especially Russian/Belarusian potash & nitrogen) supply disruption. High = acute global food crisis conditions.", val: 0.45 },
  R7: { t: 'R', n: "Russia-Ukraine War Intensity & Direct NATO Involvement Depth", txt: "Tracks frontline movement velocity, Russian mobilization level (2nd/3rd wave), NATO direct ISR/logistics footprint in Ukraine, escalation language from Moscow, and likelihood of Russia declaring war formally on NATO states. High = war has metastasized into a de facto NATO-Russia confrontation.", val: 0.60 },
  R8: { t: 'R', n: "China PLA Multi-Domain Readiness & Taiwan Strait Aggression Posture", txt: "Composite of PLAN carrier battle group operational tempo, PLA rocket force SRBM targeting exercises, PLA Air Force sorties inside Taiwan ADIZ, gray zone ops intensity, and Xi Jinping's political incentives for reunification by force. High = PLA is positioned and motivated for a near-term Taiwan contingency.", val: 0.55 },
  R9: { t: 'R', n: "North Korean ICBM Tactical Nuclear Readiness & Regime Instability", txt: "Tracks DPRK ICBM test frequency, tactical nuclear doctrine announcements, KPA forward deployment, Kim Jong-un succession uncertainty, and Russia-DPRK military cooperation depth (arms/technology transfers). High = North Korea may launch preemptively or in coordination with a wider conflict.", val: 0.40 },
  R10: { t: 'R', n: "Global Sovereign Debt, Banking Fragility & Systemic Financial Risk", txt: "Composite of G20 debt-to-GDP trend, U.S. deficit financing stress, Japanese JGB yield curve control collapse risk, European sovereign spread widening, and shadow banking exposure to geopolitical shocks. High = a geopolitical shock could trigger a 2008-magnitude or worse financial cascade.", val: 0.50 },
  R11: { t: 'R', n: "Lethal Autonomous Weapons (LAWS) Proliferation & AI-Enabled Warfare Acceleration", txt: "Tracks drone swarm AI deployment by non-state actors, AI-enabled target selection without human authorization in active theaters, deepfake command-and-control spoofing incidents, and failure of international LAWS governance frameworks. High = autonomous systems may execute escalatory actions without human decision.", val: 0.35 },
  R12: { t: 'R', n: "Arctic Militarization, Resource Competition & Northern Sea Route Conflict", txt: "Composite of Russian Arctic military base expansion, Norwegian/Finnish/Swedish NATO Arctic integration, Chinese Arctic research-to-dual-use base conversion, and control disputes over exclusive economic zones in the Barents/Beaufort. High = Arctic becomes a viable secondary military theater.", val: 0.30 },
  R13: { t: 'R', n: "Strategic Disinformation, Deepfake Operations & Epistemic Infrastructure Collapse", txt: "Tracks state-sponsored deepfake video incidents targeting heads of state, AI-generated false flag attack claims, social media coordinated inauthentic behavior scale, and public institutional trust collapse indices in G7 nations. High = decision-makers and publics cannot distinguish real attacks from fabricated ones.", val: 0.55 },
  R14: { t: 'R', n: "Simultaneous Breadbasket Climate Shock Severity", txt: "Probability of concurrent crop failure in 3+ major agricultural regions (U.S. Midwest, Indian subcontinent, Sub-Saharan Africa, Chinese plains) driven by climate extremes within a 12-month window. High = food shock is sudden, severe, and geographically distributed.", val: 0.40 },
  R15: { t: 'R', n: "Nuclear Doctrine Normalization & Tactical Nuclear Use Threshold Erosion", txt: "Tracks changes in Russian nuclear doctrine (lowered first-use threshold since 2022), Israeli ambiguity erosion signals, Pakistani battlefield nuclear doctrine, and public statements by heads of state normalizing tactical nuclear weapons as \"usable.\" High = the taboo on nuclear use has materially weakened.", val: 0.35 },

  I1: { t: 'I', n: "GCC Critical Infrastructure Destruction", deps: { R1: 0.80, R2: 0.75 }, txt: "Interceptor failure combined with high IRGC launch capacity results in successful strikes on Saudi Aramco facilities, UAE desalination plants, and Bahrain's 5th Fleet infrastructure. Triggers GCC state fragility." },
  I2: { t: 'I', n: "Strait of Hormuz Closure & Global Energy Shock", deps: { R2: 0.70, R4: 0.55 }, txt: "IRGC naval capacity enables mine-laying and suicide boat attacks on tanker traffic. BRICS financial backing sustains Iran through counter-pressure, extending the closure window. 20% of global oil transits this chokepoint." },
  I3: { t: 'I', n: "European Energy & Industrial Supply Chain Collapse", deps: { I2: 0.65, R7: 0.60 }, txt: "Hormuz closure plus continued disruption of Caspian/Baltic energy from the Ukraine war eliminates remaining European energy diversification buffers, forcing industrial shutdowns and winter humanitarian crises." },
  I4: { t: 'I', n: "Space/ASAT Warfare, ISR Blindness & GPS Degradation", deps: { R1: 0.50, R4: 0.60, R8: 0.65 }, txt: "Failing terrestrial defense forces reliance on space-based early warning, which China and Russia (with BRICS EW support) target via co-orbital ASAT, directed energy, and GPS spoofing. Loss of ISR creates compellence vacuum." },
  I5: { t: 'I', n: "Middle East & Levant Regional Proxy Surge", deps: { R2: 0.75, I1: 0.65 }, txt: "IRGC activates the Axis of Resistance simultaneously: Hezbollah (Lebanon), Houthis (Red Sea), PMF (Iraq), PIJ (Gaza), and Syrian remnants. Coordinated surge exploits GCC infrastructure chaos as strategic distraction." },
  I6: { t: 'I', n: "South Asian Kinetic Escalation & Conventional War", deps: { R5: 0.80, I5: 0.40 }, txt: "Baseline Pakistan-India border tension ignited by regional proxy activity drawing U.S. attention away from South Asia. Pakistani army, facing internal pressure, miscalculates a cross-border strike." },
  I7: { t: 'I', n: "Subsea Cable Sabotage & Global Internet Infrastructure Attack", deps: { I2: 0.55, I4: 0.65 }, txt: "Maritime blockade in Hormuz/Red Sea provides operational cover for Russian/Chinese naval assets to cut Atlantic and Indo-Pacific undersea cables. ISR blindness prevents attribution. 95% of intercontinental internet runs on subsea cables." },
  I8: { t: 'I', n: "Global Financial Contagion, SWIFT Disruption & Market Crash", deps: { R10: 0.70, I7: 0.60, R4: 0.50 }, txt: "Internet infrastructure damage disrupts SWIFT messaging and exchange settlement systems. Pre-existing sovereign debt fragility amplifies the shock into a full banking contagion. BRICS parallel systems lack the depth to substitute." },
  I9: { t: 'I', n: "Mass Famine, Displacement & Refugee Crisis", deps: { R6: 0.65, R14: 0.70, I8: 0.55 }, txt: "Agricultural fragility and climate shock, supercharged by financial collapse destroying import capacity, triggers acute famine in import-dependent nations (Egypt, Yemen, Pakistan, Ethiopia). 500M+ people at acute food insecurity." },
  I10: { t: 'I', n: "Taiwan Strait Hot Incident — Naval / Aerial Clash", deps: { R8: 0.75, I4: 0.55 }, txt: "Chinese gray-zone operations escalate to kinetic exchange: a PLAN vessel collides with or fires on a USN/ROC Navy ship, or a PLA J-20 engages an ROC F-16 in the median line. The incident crosses the threshold of armed conflict." },
  I11: { t: 'I', n: "Korean Peninsula Crisis Activation", deps: { R9: 0.70, I10: 0.50 }, txt: "North Korea exploits U.S. Pacific Command distraction during Taiwan crisis to conduct provocative ICBM test over Japan, nuclear artillery exercise near DMZ, or a limited KPA incursion into the DMZ buffer zone." },
  I12: { t: 'I', n: "Arctic Military Incident & Northern Theater Activation", deps: { R12: 0.65, R7: 0.50 }, txt: "Russian Arctic forces, emboldened by NATO distraction in Ukraine and backed by China's dual-use Arctic infrastructure, conduct a physical seizure of a contested islet or energy platform, drawing Scandinavian NATO members into direct confrontation." },
  I13: { t: 'I', n: "Nuclear Alert / False Flag Misattribution & Crisis Misperception", deps: { I4: 0.60, R13: 0.70, R15: 0.55 }, txt: "ISR degradation and deepfake operations produce a false-positive nuclear launch detection, or a synthetic video of a head of state ordering nuclear use goes viral before it can be debunked. Decision windows collapse from hours to minutes." },
  I14: { t: 'I', n: "Global Internet Fragmentation, Comms Blackout & Governance Collapse", deps: { I7: 0.70, R13: 0.55 }, txt: "Subsea cable cuts plus coordinated cyberattacks on tier-1 internet exchange points produce regional internet islands. Loss of real-time communication collapses diplomatic back-channels and UN Security Council rapid-response mechanisms." },
  I15: { t: 'I', n: "Autonomous Weapon Unauthorized Escalatory Engagement", deps: { R11: 0.65, I4: 0.60, I13: 0.55 }, txt: "An AI-enabled drone swarm or autonomous naval mine system, operating under degraded GPS and command communications, misidentifies a civilian target or allied asset as an enemy combatant and executes a lethal strike, triggering a counter-response before the error can be communicated." },
  I16: { t: 'I', n: "NATO Internal Fracture, Article 5 Credibility Crisis & Alliance Solidarity Breakdown", deps: { R3: 0.65, R7: 0.55, I3: 0.50 }, txt: "U.S. domestic paralysis signals unreliable extended deterrence. European allies facing energy collapse disagree on acceptable risk. Hungary/Slovakia veto mechanisms exploit Article 5 consultation thresholds, fracturing collective response." },
  I17: { t: 'I', n: "Global Shipping, Trade Route & Supply Chain Collapse", deps: { I2: 0.65, I7: 0.55, I10: 0.50 }, txt: "Hormuz closure eliminates the Persian Gulf route; Taiwan crisis threatens South China Sea lanes; cable sabotage disrupts container booking systems. Red Sea (Houthi), Malacca, and Cape of Good Hope routes simultaneously stressed." },
  I18: { t: 'I', n: "Petrodollar Collapse, Reserve Currency War & Sovereign Wealth Liquidation", deps: { R4: 0.70, I2: 0.60, I8: 0.55 }, txt: "Sustained Hormuz closure breaks the implicit petrodollar compact as Saudi Arabia sells oil in yuan. Simultaneous SWIFT disruption accelerates dollar exodus. Central banks begin emergency dollar-asset liquidation, triggering UST yield spike." },
  I19: { t: 'I', n: "Weapons of Mass Destruction Deployment by Non-State Actors", deps: { R2: 0.45, I5: 0.55, R13: 0.40 }, txt: "IRGC-backed proxy groups, exploiting attribution confusion created by disinformation operations, deploy weaponized chemical agents (e.g., modified Novichok analogs) or engineered biological material in a population center, crossing a red line that historically triggers massive state retaliation." },
  I20: { t: 'I', n: "State Fragility Cascade & Multi-State Collapse in MENA/Sub-Saharan Africa", deps: { I9: 0.65, I5: 0.55, I8: 0.50 }, txt: "Famine, proxy violence, and financial collapse simultaneously destabilize nuclear-adjacent states (Pakistan), Gulf monarchies (Saudi Arabia), and African swing states, producing ungoverned space, weapons proliferation, and mass refugee flows that overwhelm European and South Asian borders." },

  E1: { t: 'E', n: "NATO Article 5 Formal Invocation & Collective Defense Mobilization", deps: { I5: 0.60, I7: 0.65, I16: 0.55 }, txt: "Proxy surge striking Cyprus, Italy, or Baltic NATO members (I5), combined with European internet blackout via cable sabotage (I7), overcomes the alliance fracture (I16) with a clear armed-attack determination. NATO formally enters the conflict." },
  E2: { t: 'E', n: "Russian Direct Major Military Intervention in NATO Theater", deps: { I4: 0.65, E1: 0.70, R7: 0.55 }, txt: "Successful ISR blindness (I4) removes the detection deterrent on Russian strike packages. A formally invoked but fractured NATO (E1) appears to Moscow as a paper tiger. Russia conducts direct conventional strikes on NATO logistics nodes in Poland or Romania." },
  E3: { t: 'E', n: "Chinese PLA Taiwan Blockade / Amphibious Invasion Initiation", deps: { R3: 0.60, E2: 0.65, I10: 0.70 }, txt: "U.S. domestic paralysis (R3) degrades credible extended deterrence signaling. Russian engagement (E2) consumes EUCOM/NORTHCOM bandwidth. The Taiwan Strait hot incident (I10) provides a pretext for escalation to a full blockade enforced by PLAN." },
  E4: { t: 'E', n: "Nuclear / Unconventional Weapons Employment", deps: { R1: 0.70, I1: 0.65, I5: 0.60, R15: 0.75, I13: 0.55, I15: 0.50 }, txt: "The convergence of complete interceptor failure, burning GCC infrastructure, overwhelming proxy pressure, eroded nuclear taboo, and a misperception crisis created the first battlefield nuclear employment since 1945. The Samson Option (Israel), Pakistani tactical nuclear use in a South Asian war, or a Russian \"demonstration strike\" all qualify." },
  E5: { t: 'E', n: "Global Food System Collapse & Synchronized Famine Event", deps: { R6: 0.65, I9: 0.75, I17: 0.60 }, txt: "Baseline agricultural fragility (R6), already producing acute famine (I9), is converted into a systemic multi-region collapse as global shipping failure (I17) ends food aid delivery. UN World Food Programme exhausts reserves. Mortality exceeds 10M within 12 months." },
  E6: { t: 'E', n: "Global Financial System Collapse & Great Depression II", deps: { I8: 0.70, I18: 0.65, E5: 0.50 }, txt: "Financial contagion (I8) and petrodollar collapse (I18) converge. The Federal Reserve loses reserve currency credibility. A synchronized G20 bank run produces a credit freeze exceeding 2008. Global GDP contracts >15% within 24 months." },
  E7: { t: 'E', n: "Korean Peninsula Nuclear War Activation", deps: { I11: 0.65, E3: 0.60, R9: 0.70 }, txt: "Korean crisis (I11) escalates beyond the DMZ as PACOM is consumed by the Taiwan emergency (E3). Kim Jong-un, calculating existential threat from U.S. retaliation regardless, authorizes nuclear-armed SCUD/KN-24 employment against USFK/Camp Humphreys. Japan and South Korea face existential decisions about their own deterrents." },
  E8: { t: 'E', n: "Multi-Theater Simultaneous Great Power War Activation", deps: { E1: 0.75, E2: 0.70, E3: 0.70 }, txt: "Three simultaneous active great-power fronts: NATO-Russia in Europe, U.S.-China in the Pacific, and the Middle East proxy war metastasizing into direct U.S.-Iran kinetic conflict. No precedent exists for three-front great-power war in the nuclear age. Command authority and strategic doctrine break down under simultaneous demand." },
  E9: { t: 'E', n: "Eurasia-MENA Multi-State Collapse & Nuclear Proliferation Emergency", deps: { I9: 0.60, E5: 0.65, I20: 0.70 }, txt: "State fragility cascade produces ungoverned space in Pakistan (nuclear), Saudi Arabia (chemical), and the Sahel (French-abandoned enrichment material). Nuclear/radiological material falls outside command-and-control. Non-state nuclear employment becomes credible for the first time." },
  E10: { t: 'E', n: "Full-Spectrum Space War & Satellite Kill Chain Activation", deps: { I4: 0.70, E2: 0.60, E3: 0.65 }, txt: "Russia and China activate full ASAT campaigns, destroying GPS, Starlink, and military communication constellations. Loss of satellite infrastructure collapses precision weapons, real-time targeting, and nuclear command-and-control uplinks — creating use-it-or-lose-it pressure on nuclear forces." },
  E11: { t: 'E', n: "Autonomous AI Escalation Beyond Human Control & Decision Loop Collapse", deps: { I15: 0.65, E4: 0.55, E10: 0.60 }, txt: "The combination of autonomous weapon incidents (I15), nuclear use normalization (E4), and space/comms blackout (E10) produces a theater where AI systems are operating without human-in-the-loop authorization, executing retaliatory strikes faster than human decision cycles. The Fog of War is now algorithmic." },
  E12: { t: 'E', n: "WMD Non-State / Proxy Escalation & Chemical-Biological Mass Casualty Event", deps: { I19: 0.70, E9: 0.65, I5: 0.55 }, txt: "Non-state actors (IRGC proxies, ISIS remnants benefiting from state collapse) deploy WMD in a major population center — chemical agent in a subway system (Tokyo, London, New York) or engineered pathogen released at a crowded international border crossing. This generates public pressure for massive conventional or nuclear retaliation regardless of clean attribution." },

  T1: { t: 'T', n: "WORLD WAR III — Global Systemic War", deps: { E1: 0.70, E2: 0.75, E3: 0.75, E4: 0.80, E7: 0.65, E8: 0.90, E10: 0.55, E11: 0.60, E12: 0.50 }, txt: "Defined as: the simultaneous engagement of at least two nuclear-armed great powers in direct kinetic conflict across three or more geographic theaters, with civilian casualties exceeding one million and no credible ceasefire mechanism in operation. This is not merely a large war — it is the failure of the entire post-1945 deterrence architecture." }
};

const TIER_LEAKS = { I: 0.04, E: 0.02, T: 0.01 };

const computeTopoOrder = () => {
  const inDegree = {}; const graph = {}; const sorted = [];
  Object.keys(DATA).forEach(k => { inDegree[k] = 0; graph[k] = []; });
  Object.entries(DATA).forEach(([k, v]) => {
    if (v.deps) Object.keys(v.deps).forEach(p => { graph[p].push(k); inDegree[k]++; });
  });
  const q = Object.keys(inDegree).filter(k => inDegree[k] === 0);
  while (q.length > 0) {
    const n = q.shift(); sorted.push(n);
    graph[n].forEach(child => { inDegree[child]--; if (inDegree[child] === 0) q.push(child); });
  }
  return sorted;
};
const TOPO_ORDER = computeTopoOrder();

const getEdgeTier = (ciw) => ciw >= 0.75 ? 'Decisive' : ciw >= 0.55 ? 'Strong' : ciw >= 0.35 ? 'Moderate' : 'Weak';
const getColor = (p) => {
  if (p < 0.15) return '#00D4FF';
  if (p < 0.30) return '#22C55E';
  if (p < 0.50) return '#84CC16';
  if (p < 0.70) return '#F59E0B';
  if (p < 0.85) return '#F97316';
  if (p < 0.95) return '#DC2626';
  return '#991B1B';
};
const getWEP = (p) => {
  if (p < 0.05) return "Remote";
  if (p < 0.15) return "Very Unlikely";
  if (p < 0.30) return "Unlikely";
  if (p < 0.50) return "Even Chance";
  if (p < 0.70) return "Likely";
  if (p < 0.85) return "Very Likely";
  if (p < 0.95) return "Highly Likely";
  return "Near Certainty";
};

// === NOISY-OR ENGINE ===
const computeBBN = (roots, interventions) => {
  const res = {};
  TOPO_ORDER.forEach(id => {
    if (interventions[id] !== undefined) { res[id] = interventions[id]; return; }
    const node = DATA[id];
    if (node.t === 'R') {
      res[id] = roots[id] ?? node.val;
    } else {
      let prod = 1.0;
      const parents = Object.entries(node.deps);
      parents.forEach(([pId, ciw]) => {
        const p = res[pId];
        const activeP = 1 / (1 + Math.exp(-8 * (p - 0.5)));
        prod *= (1 - ciw * activeP);
      });
      const numParents = parents.length;
      const depExponent = numParents > 1 ? (1 / Math.pow(numParents, 0.5)) : 1;
      const correctedProd = Math.pow(prod, depExponent);
      res[id] = 1 - (1 - TIER_LEAKS[node.t]) * correctedProd;
    }
  });
  return res;
};

// === MONTE CARLO ===
const randn = () => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};
const rGamma = (alpha) => {
  if (alpha < 1) return rGamma(alpha + 1) * Math.pow(Math.random(), 1 / alpha);
  const d = alpha - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  let v, u, x;
  do {
    do { x = randn(); v = 1 + c * x; } while (v <= 0);
    v = v * v * v; u = Math.random();
  } while (u > 1 - 0.0331 * x * x * x * x && Math.log(u) > 0.5 * x * x + d * (1 - v + Math.log(v)));
  return d * v;
};
const rBeta = (alpha, beta) => {
  const x = rGamma(alpha); const y = rGamma(beta);
  return (x + y === 0) ? 0 : x / (x + y);
};

const SCENARIOS = {
  "Status Quo — March 2026 Baseline": { type: 'roots', vals: { R1: 0.45, R2: 0.55, R3: 0.50, R4: 0.40, R5: 0.35, R6: 0.45, R7: 0.60, R8: 0.55, R9: 0.40, R10: 0.50, R11: 0.35, R12: 0.30, R13: 0.55, R14: 0.40, R15: 0.35 } },
  "Iranian Nuclear Breakout": { type: 'intervene', vals: { R2: 0.9, R1: 0.7, R15: 0.65 } },
  "Taiwan Strait Kinetic Crisis": { type: 'intervene', vals: { R8: 0.85, R3: 0.6, I10: 0.85 } },
  "Russian NATO Direct Strike": { type: 'intervene', vals: { R7: 0.9, E2: 0.75, I4: 0.7 } },
  "BRICS Financial Decoupling": { type: 'intervene', vals: { R4: 0.85, I8: 0.7, I18: 0.75 } },
  "Climate-Famine-War Nexus": { type: 'intervene', vals: { R14: 0.9, R6: 0.85, I9: 0.8 } },
  "AI Autonomous Incident": { type: 'intervene', vals: { R11: 0.85, I15: 0.8, I13: 0.7 } },
  "Perfect Storm — Cascade": { type: 'roots', vals: Object.fromEntries(Object.keys(DATA).filter(k => k.startsWith('R')).map(k => [k, 0.85])) },
  "Diplomatic Breakthrough": { type: 'roots', vals: Object.fromEntries(Object.keys(DATA).filter(k => k.startsWith('R')).map(k => [k, 0.15])) }
};

// ============================================================
// CUSTOM NODE — Root nodes have embedded sliders
// ============================================================
const CustomNode = ({ data }) => {
  const { id, n, p, isIntervened, t, rootVal, onRootChange } = data;
  const col = getColor(p);
  const isTerminal = t === 'T';
  const isCritical = isTerminal && p > 0.70;
  const isRoot = t === 'R';

  const handleSliderChange = useCallback((e) => {
    e.stopPropagation();
    if (onRootChange) onRootChange(id, parseFloat(e.target.value));
  }, [id, onRootChange]);

  const handleSliderClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  return (
    <div
      className={`rounded-lg border-2 shadow-lg transition-all duration-300 ${isCritical ? 'terminal-critical' : ''}`}
      style={{
        borderColor: col,
        boxShadow: isCritical ? undefined : `0 0 14px ${col}35`,
        backgroundColor: isTerminal ? 'rgba(0,0,0,0.88)' : 'rgba(8,12,20,0.92)',
        backdropFilter: 'blur(8px)',
        width: isTerminal ? 300 : isRoot ? 240 : 230,
        padding: isRoot ? '10px 12px 8px' : '10px 12px',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 11,
          fontWeight: 700,
          color: col,
          background: '#000',
          border: `1px solid ${col}60`,
          padding: '2px 7px',
          borderRadius: 4,
        }}>{id}</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {isIntervened && (
            <span style={{
              fontSize: 9,
              fontFamily: "'Share Tech Mono', monospace",
              fontWeight: 700,
              background: '#fff',
              color: '#000',
              padding: '2px 5px',
              borderRadius: 3,
              animation: 'pulse 1.5s infinite',
            }}>DO()</span>
          )}
          <span style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 18,
            fontWeight: 700,
            color: col,
            letterSpacing: '-0.5px',
          }}>{(p * 100).toFixed(1)}%</span>
        </div>
      </div>

      {/* Node name */}
      <div style={{
        fontSize: 10,
        fontFamily: 'sans-serif',
        fontWeight: 600,
        color: '#cbd5e1',
        lineHeight: 1.35,
        marginBottom: isRoot ? 8 : 0,
      }}>
        {n}
      </div>

      {/* Embedded slider — Root nodes only */}
      {isRoot && (
        <div
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          onClick={handleSliderClick}
          style={{ marginTop: 2 }}
        >
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={rootVal}
            onChange={handleSliderChange}
            onClick={handleSliderClick}
            className="bbn-slider"
            style={{
              width: '100%',
              background: `linear-gradient(to right, ${col} ${rootVal * 100}%, #1f2937 ${rootVal * 100}%)`,
            }}
          />
        </div>
      )}

      {/* Terminal WEP badge */}
      {isTerminal && (
        <div style={{
          marginTop: 6,
          borderTop: '1px solid #1e293b',
          paddingTop: 6,
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <span style={{
            fontSize: 10,
            fontFamily: "'Share Tech Mono', monospace",
            fontWeight: 700,
            textTransform: 'uppercase',
            color: '#f87171',
            background: 'rgba(127,29,29,0.35)',
            padding: '3px 8px',
            borderRadius: 4,
          }}>{getWEP(p)}</span>
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
};

// ============================================================
// CUSTOM EDGE
// ============================================================
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, data }) => {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, pointerEvents: 'all' }}
          className="group z-40 hidden md:block"
        >
          <div className="w-6 h-6 rounded-full flex justify-center items-center cursor-help">
            <div className={`w-2 h-2 rounded-full transition-all group-hover:scale-150 ${data.isCrit ? 'bg-red-500 shadow-[0_0_10px_#DC2626]' : 'bg-transparent'}`} />
          </div>
          <div className="hidden group-hover:block absolute bg-black/95 border border-cyan-800 p-3 rounded w-56 text-[11px] shadow-2xl pointer-events-none -translate-y-[calc(100%+10px)] left-1/2 -translate-x-1/2 backdrop-blur-md">
            <div className="font-mono text-cyan-400 mb-1 tracking-wider">{data.source} → {data.target}</div>
            <div className="text-gray-300 font-sans mb-1 border-b border-gray-800 pb-1">
              Weight: <span className="text-white font-mono font-bold">{data.ciw.toFixed(2)}</span>{' '}
              <span className="text-amber-500 italic">[{data.tier}]</span>
            </div>
            <div className="text-gray-400 leading-tight">Causal pathway strength metric.</div>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

const nodeTypes = { custom: CustomNode };
const edgeTypes = { custom: CustomEdge };

// ============================================================
// MAIN APP
// ============================================================
export default function BBNApp() {
  const [roots, setRoots] = useState(() => {
    const init = {};
    Object.keys(DATA).filter(k => k.startsWith('R')).forEach(k => init[k] = DATA[k].val);
    return init;
  });
  const [interventions, setInterventions] = useState({});
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeTab, setActiveTab] = useState('sensitivity');
  const [mcRunning, setMcRunning] = useState(false);
  const [mcResults, setMcResults] = useState(null);
  const [showInterventions, setShowInterventions] = useState(false);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(false);
  const [activeScenario, setActiveScenario] = useState("Status Quo — March 2026 Baseline");

  // Inject styles
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.innerHTML = `
      * { box-sizing: border-box; }
      body { overscroll-behavior: none; }
      .font-mono { font-family: 'Share Tech Mono', monospace !important; }
      .font-rajdhani { font-family: 'Rajdhani', sans-serif; }

      /* Slider base */
      .bbn-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 5px;
        border-radius: 3px;
        outline: none;
        cursor: pointer;
        display: block;
      }
      .bbn-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px; height: 16px;
        border-radius: 50%;
        background: #00D4FF;
        cursor: pointer;
        border: 2px solid #000;
        box-shadow: 0 0 8px rgba(0,212,255,0.6);
      }
      .bbn-slider::-moz-range-thumb {
        width: 16px; height: 16px;
        border-radius: 50%;
        background: #00D4FF;
        cursor: pointer;
        border: 2px solid #000;
        box-shadow: 0 0 8px rgba(0,212,255,0.6);
      }
      /* Mobile: bigger thumb */
      @media (max-width: 768px) {
        .bbn-slider::-webkit-slider-thumb {
          width: 22px; height: 22px;
        }
        .bbn-slider::-moz-range-thumb {
          width: 22px; height: 22px;
        }
        .bbn-slider { height: 6px; }
      }

      /* Scrollbars */
      .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #00D4FF30; border-radius: 4px; }

      /* Animations */
      @keyframes radar-ping { 75%, 100% { transform: scale(2.5); opacity: 0; } }
      .animate-radar { animation: radar-ping 1.5s cubic-bezier(0,0,0.2,1) infinite; }
      @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 10px #DC2626; border-color: #991B1B; }
        50% { box-shadow: 0 0 40px #DC2626; border-color: #DC2626; }
      }
      .terminal-critical { animation: pulse-glow 2s infinite ease-in-out; }
      @keyframes dashdraw { to { stroke-dashoffset: -10; } }
      .edge-animated path { stroke-dasharray: 5; animation: dashdraw 0.5s linear infinite; }
      @keyframes slide-up { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.4,0,0.2,1) forwards; }
      @keyframes slide-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
      .animate-slide-in-right { animation: slide-in-right 0.3s cubic-bezier(0.4,0,0.2,1) forwards; }
      @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      .animate-fade-in { animation: fade-in 0.2s ease forwards; }

      /* ReactFlow override — disable default node drag interference on slider */
      .react-flow__node { touch-action: none; }
    `;
    document.head.appendChild(style);
  }, []);

  const computed = useMemo(() => computeBBN(roots, interventions), [roots, interventions]);

  // Sensitivity
  const sensitivityData = useMemo(() => {
    const baseT1 = computed['T1'];
    return Object.keys(roots).map(r => {
      const testRoots = { ...roots, [r]: Math.min(1.0, roots[r] + 0.01) };
      const testComp = computeBBN(testRoots, interventions);
      const delta = testComp['T1'] - baseT1;
      return { id: r, n: DATA[r].n, v: Math.max(0, delta * 100) };
    }).sort((a, b) => b.v - a.v);
  }, [computed, roots, interventions]);

  const totalSens = sensitivityData.reduce((acc, d) => acc + d.v, 0);
  const shapleyData = sensitivityData.map(d => ({ ...d, pct: (d.v / (totalSens || 1)) * 100 }));

  const criticalPathEdges = useMemo(() => {
    const path = new Set();
    let current = 'T1';
    while (current && DATA[current]?.deps) {
      let maxContr = -1, maxP = null;
      Object.entries(DATA[current].deps).forEach(([p, ciw]) => {
        const c = ciw * computed[p];
        if (c > maxContr) { maxContr = c; maxP = p; }
      });
      if (maxP) { path.add(`${maxP}-${current}`); current = maxP; }
      else break;
    }
    return path;
  }, [computed]);

  const handleRootChange = useCallback((id, val) => {
    setRoots(prev => ({ ...prev, [id]: val }));
    setActiveScenario("Custom");
  }, []);

  const runMC = () => {
    setMcRunning(true);
    setTimeout(() => {
      const res = []; const NU = 8;
      for (let i = 0; i < 10000; i++) {
        const sampleR = {};
        Object.keys(roots).forEach(r => {
          const mean = Math.max(0.01, Math.min(0.99, roots[r]));
          sampleR[r] = rBeta(Math.max(0.1, mean * NU), Math.max(0.1, (1 - mean) * NU));
        });
        res.push(computeBBN(sampleR, interventions)['T1']);
      }
      res.sort((a, b) => a - b);
      setMcResults({ mean: res[5000], p5: res[500], p95: res[9500], hist: res });
      setMcRunning(false);
      setActiveTab('mc');
    }, 50);
  };

  const applyScenario = useCallback((name) => {
    setActiveScenario(name);
    const s = SCENARIOS[name];
    if (s.type === 'roots') { setRoots(s.vals); setInterventions({}); }
    else { setInterventions(s.vals); }
  }, []);

  // Build graph
  const { nodes, edges } = useMemo(() => {
    const cols = { R: [], I1: [], I2: [], E: [], T: [] };
    TOPO_ORDER.forEach(id => {
      const t = DATA[id].t;
      if (t === 'R') cols.R.push(id);
      else if (t === 'I') {
        const pTiers = Object.keys(DATA[id].deps).map(d => DATA[d].t);
        if (pTiers.every(p => p === 'R')) cols.I1.push(id); else cols.I2.push(id);
      } else if (t === 'E') cols.E.push(id);
      else cols.T.push(id);
    });

    const xMap = { R: 20, I1: 340, I2: 660, E: 980, T: 1340 };
    const ySpacing = { R: 108, I1: 120, I2: 120, E: 120, T: 130 };
    const nds = [];
    Object.entries(cols).forEach(([colKey, items]) => {
      items.forEach((id, idx) => {
        nds.push({
          id,
          type: 'custom',
          position: { x: xMap[colKey], y: 30 + idx * (ySpacing[colKey] || 120) },
          data: {
            id,
            n: DATA[id].n,
            p: computed[id],
            isIntervened: !!interventions[id],
            t: DATA[id].t,
            rootVal: roots[id] ?? DATA[id].val,
            onRootChange: DATA[id].t === 'R' ? handleRootChange : undefined,
          },
        });
      });
    });

    const eds = [];
    Object.keys(DATA).forEach(t => {
      if (DATA[t].deps) {
        Object.entries(DATA[t].deps).forEach(([s, ciw]) => {
          const isCrit = criticalPathEdges.has(`${s}-${t}`);
          const col = getColor(computed[s]);
          eds.push({
            id: `${s}-${t}`, source: s, target: t, type: 'custom',
            animated: isCrit,
            className: isCrit ? 'edge-animated' : '',
            data: { source: s, target: t, ciw, tier: getEdgeTier(ciw), isCrit },
            style: { stroke: col, strokeWidth: isCrit ? 3.5 : 1.2 + ciw * 2, opacity: isCrit ? 1 : 0.30 },
            markerEnd: { type: MarkerType.ArrowClosed, color: col },
          });
        });
      }
    });
    return { nodes: nds, edges: eds };
  }, [computed, interventions, roots, criticalPathEdges, handleRootChange]);

  const t1Risk = computed['T1'];
  const riskColor = getColor(t1Risk);

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0A0E14',
      color: '#e2e8f0',
      fontFamily: "'Rajdhani', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>

      {/* ── TOP BAR ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderBottom: '1px solid rgba(0,212,255,0.15)',
        background: 'rgba(4,7,12,0.97)',
        backdropFilter: 'blur(12px)',
        zIndex: 30,
        flexShrink: 0,
        gap: 12,
        flexWrap: 'wrap',
      }}>
        {/* Title */}
        <div>
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 18,
            fontWeight: 700,
            color: '#00D4FF',
            letterSpacing: 2,
            textTransform: 'uppercase',
            textShadow: '0 0 12px rgba(0,212,255,0.5)',
            lineHeight: 1.1,
          }}>BBN RISK ENGINE</div>
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 9,
            color: '#4b5563',
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}>OSINT FUSION // DEMO // v2.0</div>
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Risk gauge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            border: '1px solid #1e293b',
            background: 'rgba(0,0,0,0.6)',
            padding: '6px 14px',
            borderRadius: 8,
          }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {t1Risk > 0.50 && (
                <div style={{
                  position: 'absolute',
                  width: 14, height: 14,
                  background: '#ef4444',
                  borderRadius: '50%',
                  opacity: 0.7,
                  animation: 'radar-ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
                }} />
              )}
              <div style={{
                width: 10, height: 10,
                borderRadius: '50%',
                background: t1Risk > 0.5 ? '#ef4444' : '#22c55e',
                boxShadow: t1Risk > 0.5 ? '0 0 8px #ef4444' : '0 0 8px #22c55e',
                position: 'relative', zIndex: 1,
              }} />
            </div>
            <div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 2 }}>P(WW3)</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 22,
                  fontWeight: 700,
                  color: riskColor,
                  lineHeight: 1,
                }}>{(t1Risk * 100).toFixed(1)}%</span>
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: t1Risk > 0.5 ? '#f87171' : '#6b7280' }}>
                  {getWEP(t1Risk)}
                </span>
              </div>
            </div>
          </div>

          {/* Scenarios button */}
          <button
            onClick={() => setShowInterventions(true)}
            style={{
              padding: '8px 14px',
              background: 'rgba(8,50,70,0.5)',
              border: '1px solid rgba(0,212,255,0.3)',
              borderRadius: 7,
              color: '#67e8f9',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 10,
              letterSpacing: 1,
              cursor: 'pointer',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            ⚙ SCENARIOS {Object.keys(interventions).length > 0 ? `(${Object.keys(interventions).length})` : ''}
          </button>
        </div>
      </div>

      {/* ── GRAPH ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Dot grid bg */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle at center, #00D4FF 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={(_, n) => {
            if (DATA[n.id].t !== 'R') setSelectedNode(n.id);
          }}
          fitView
          maxZoom={1.8}
          minZoom={0.08}
          defaultViewport={{ x: 0, y: 0, zoom: 0.28 }}
          attributionPosition="bottom-right"
          nodesDraggable={true}
          panOnDrag={true}
          zoomOnPinch={true}
          preventScrolling={false}
        >
          <Background color="#1e293b" gap={28} size={1} />
          <Controls className="hidden md:flex" style={{ background: '#0b111a', border: '1px solid #1e293b' }} />
          <MiniMap
            className="hidden lg:block"
            style={{ background: '#0b111a', border: '1px solid #1e293b', bottom: 280 }}
            nodeColor={(n) => getColor(computed[n.id])}
            maskColor="rgba(0,0,0,0.75)"
          />
        </ReactFlow>

        {/* ── BOTTOM ANALYTICS PANEL ── */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          background: 'rgba(4,7,12,0.97)',
          borderTop: '1px solid rgba(0,212,255,0.2)',
          backdropFilter: 'blur(16px)',
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          height: isBottomPanelOpen ? 'min(55vh, 300px)' : 44,
          transition: 'height 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}>
          {/* Toggle bar */}
          <div
            onClick={() => setIsBottomPanelOpen(!isBottomPanelOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
              height: 44,
              cursor: 'pointer',
              borderBottom: isBottomPanelOpen ? '1px solid rgba(0,212,255,0.1)' : 'none',
              flexShrink: 0,
              userSelect: 'none',
            }}
          >
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#22d3ee', letterSpacing: 2, textTransform: 'uppercase' }}>
              📊 Analytics Dashboard
            </span>
            <span style={{ color: '#22d3ee', fontSize: 12 }}>{isBottomPanelOpen ? '▼' : '▲'}</span>
          </div>

          {/* Panel content */}
          {isBottomPanelOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              {/* Tabs */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid rgba(0,212,255,0.1)',
                overflowX: 'auto',
                flexShrink: 0,
              }}>
                {['sensitivity', 'shapley', 'mc'].map(tab => (
                  <button key={tab}
                    onClick={e => { e.stopPropagation(); setActiveTab(tab); }}
                    style={{
                      padding: '8px 18px',
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: 10,
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      background: 'none',
                      border: 'none',
                      borderBottom: activeTab === tab ? '2px solid #22d3ee' : '2px solid transparent',
                      color: activeTab === tab ? '#22d3ee' : '#6b7280',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}
                  >
                    {tab === 'mc' ? 'Monte Carlo' : tab}
                  </button>
                ))}
              </div>

              {/* Tab body */}
              <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
                {activeTab === 'sensitivity' && (
                  <div>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: '#0e7490', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
                      TOP DRIVERS (∂P(WW3)/∂Rᵢ)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px 32px' }}>
                      {sensitivityData.slice(0, 8).map((d) => (
                        <div key={d.id} style={{ display: 'flex', alignItems: 'center', fontFamily: "'Share Tech Mono', monospace", fontSize: 10 }}>
                          <span style={{ width: 28, color: '#22d3ee', fontWeight: 700 }}>{d.id}</span>
                          <div style={{ flex: 1, height: 6, background: '#111827', borderRadius: 3, margin: '0 10px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${(d.v / (sensitivityData[0]?.v || 1)) * 100}%`,
                              background: getColor(roots[d.id]),
                              borderRadius: 3,
                              transition: 'width 0.4s',
                            }} />
                          </div>
                          <span style={{ color: '#6b7280', width: 42, textAlign: 'right' }}>{d.v.toFixed(3)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'shapley' && (
                  <div>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: '#0e7490', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
                      NORMALIZED CAUSAL CONTRIBUTION
                    </div>
                    <div style={{ display: 'flex', height: 28, borderRadius: 6, overflow: 'hidden', border: '1px solid #1e293b', marginBottom: 12 }}>
                      {shapleyData.map(d => (
                        <div key={d.id} style={{ flex: d.pct, background: getColor(roots[d.id]), borderRight: '1px solid rgba(0,0,0,0.4)', transition: 'flex 0.4s' }} title={`${d.id}: ${d.pct.toFixed(1)}%`} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {shapleyData.slice(0, 8).map(d => (
                        <div key={d.id} style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          background: 'rgba(0,0,0,0.4)', border: '1px solid #1e293b',
                          padding: '3px 8px', borderRadius: 4,
                          fontFamily: "'Share Tech Mono', monospace", fontSize: 10,
                        }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: getColor(roots[d.id]) }} />
                          <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{d.id}</span>
                          <span style={{ color: '#6b7280' }}>{d.pct.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'mc' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button onClick={runMC} disabled={mcRunning} style={{
                      padding: '8px 18px',
                      background: mcRunning ? '#1e3a4a' : 'rgba(8,50,70,0.7)',
                      border: '1px solid rgba(0,212,255,0.3)',
                      borderRadius: 6,
                      color: '#67e8f9',
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: 10,
                      letterSpacing: 2,
                      cursor: mcRunning ? 'not-allowed' : 'pointer',
                      textTransform: 'uppercase',
                      alignSelf: 'flex-start',
                      opacity: mcRunning ? 0.6 : 1,
                      transition: 'all 0.2s',
                    }}>
                      {mcRunning ? 'SIMULATING…' : 'RUN MONTE CARLO (10K)'}
                    </button>
                    {mcResults && !mcRunning && (
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div style={{ flex: '1 1 160px', height: 56, display: 'flex', alignItems: 'flex-end', gap: 1, borderBottom: '1px solid #1e293b' }}>
                          {Array.from({ length: 50 }).map((_, i) => {
                            const bucketMin = i / 50; const bucketMax = (i + 1) / 50;
                            const count = mcResults.hist.filter(v => v >= bucketMin && v < bucketMax).length;
                            return <div key={i} style={{ flex: 1, height: `${Math.max(2, (count / 1500) * 100)}%`, background: getColor(bucketMin), transition: 'height 0.3s' }} />;
                          })}
                        </div>
                        <div style={{
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid #1e293b',
                          borderRadius: 7,
                          padding: '10px 14px',
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: 11,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 5,
                          minWidth: 180,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                            <span style={{ color: '#6b7280' }}>P05 Optimistic</span>
                            <span style={{ color: '#22c55e', fontWeight: 700 }}>{(mcResults.p5 * 100).toFixed(1)}%</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                            <span style={{ color: '#6b7280' }}>Mean Estimate</span>
                            <span style={{ color: '#f59e0b', fontWeight: 700 }}>{(mcResults.mean * 100).toFixed(1)}%</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                            <span style={{ color: '#6b7280' }}>P95 Pessimistic</span>
                            <span style={{ color: '#ef4444', fontWeight: 700 }}>{(mcResults.p95 * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── NODE INSPECTOR DRAWER (right slide-in) ── */}
      {selectedNode && (
        <>
          <div
            onClick={() => setSelectedNode(null)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(4px)',
              zIndex: 40,
            }}
            className="animate-fade-in"
          />
          <div
            className="animate-slide-in-right"
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: 'min(88vw, 380px)',
              background: 'rgba(5,9,15,0.98)',
              borderLeft: '1px solid rgba(0,212,255,0.2)',
              backdropFilter: 'blur(20px)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-20px 0 40px rgba(0,0,0,0.8)',
            }}
          >
            {/* Drawer header */}
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid rgba(0,212,255,0.15)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(0,0,0,0.3)',
              flexShrink: 0,
            }}>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#22d3ee', letterSpacing: 3, textTransform: 'uppercase' }}>
                NODE INSPECTOR
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                style={{
                  background: '#111827', border: '1px solid #374151',
                  color: '#9ca3af', borderRadius: 6, padding: '6px 12px',
                  cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  transition: 'all 0.2s',
                }}
              >✕</button>
            </div>

            {/* Drawer body */}
            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace", fontSize: 11, fontWeight: 700,
                  color: '#22d3ee', background: '#083344', border: '1px solid #164e63',
                  padding: '3px 10px', borderRadius: 5,
                }}>{selectedNode}</span>
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: '#6b7280', letterSpacing: 2, textTransform: 'uppercase' }}>
                  {DATA[selectedNode].t === 'R' ? 'Root Node' : DATA[selectedNode].t === 'T' ? 'Terminal Node' : DATA[selectedNode].t === 'E' ? 'Escalation Node' : 'Intermediate Node'}
                </span>
              </div>

              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.3, marginBottom: 14 }}>
                {DATA[selectedNode].n}
              </h2>

              <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 44,
                fontWeight: 700,
                color: getColor(computed[selectedNode]),
                lineHeight: 1,
                marginBottom: 16,
                borderBottom: '1px solid #1e293b',
                paddingBottom: 14,
              }}>
                {(computed[selectedNode] * 100).toFixed(1)}%
              </div>

              <div style={{
                fontSize: 12,
                color: '#94a3b8',
                lineHeight: 1.6,
                background: 'rgba(0,0,0,0.4)',
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid #1e293b',
                marginBottom: 16,
              }}>
                {DATA[selectedNode].txt}
              </div>

              {DATA[selectedNode].deps && (
                <div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: '#0e7490', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
                    CAUSAL PARENTS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {Object.entries(DATA[selectedNode].deps).map(([pId, ciw]) => (
                      <div
                        key={pId}
                        onClick={() => setSelectedNode(pId)}
                        style={{
                          display: 'flex', alignItems: 'center',
                          background: 'rgba(0,0,0,0.35)',
                          border: '1px solid #1e293b',
                          borderRadius: 7,
                          padding: '9px 12px',
                          cursor: 'pointer',
                          gap: 10,
                          transition: 'border-color 0.2s',
                        }}
                      >
                        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: '#22d3ee', fontWeight: 700, minWidth: 32 }}>{pId}</span>
                        <span style={{ fontSize: 11, color: '#94a3b8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{DATA[pId].n}</span>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, fontWeight: 700, color: getColor(computed[pId]) }}>
                            {(computed[pId] * 100).toFixed(0)}%
                          </div>
                          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: '#d97706' }}>CIW {ciw.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── SCENARIOS / DO-CALCULUS MODAL ── */}
      {showInterventions && (
        <>
          <div
            onClick={() => setShowInterventions(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(6px)',
              zIndex: 60,
            }}
            className="animate-fade-in"
          />
          <div
            className="animate-slide-up"
            style={{
              position: 'fixed',
              bottom: 0, left: 0, right: 0,
              maxHeight: '92dvh',
              background: 'rgba(5,9,15,0.99)',
              borderTop: '1px solid rgba(0,212,255,0.25)',
              borderRadius: '20px 20px 0 0',
              zIndex: 70,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -20px 60px rgba(0,0,0,0.9)',
            }}
          >
            {/* Modal header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(0,212,255,0.12)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
            }}>
              <div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 14, color: '#22d3ee', letterSpacing: 2, textTransform: 'uppercase' }}>
                  DO-CALCULUS CONSOLE
                </div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: '#4b5563', letterSpacing: 2, marginTop: 2 }}>
                  SCENARIOS & MANUAL OVERRIDES
                </div>
              </div>
              <button
                onClick={() => setShowInterventions(false)}
                style={{
                  background: '#111827', border: '1px solid #374151',
                  color: '#9ca3af', borderRadius: 8,
                  padding: '8px 16px', cursor: 'pointer',
                  fontSize: 13, fontWeight: 700,
                }}
              >✕</button>
            </div>

            {/* Modal body — two columns on desktop, stacked on mobile */}
            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: 0 }}>

              {/* Preset scenarios */}
              <div style={{
                flex: '1 1 280px',
                borderRight: '1px solid rgba(0,212,255,0.08)',
                padding: '16px 18px',
              }}>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: '#0e7490', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
                  PRESET SCENARIOS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.keys(SCENARIOS).map(s => (
                    <button
                      key={s}
                      onClick={() => { applyScenario(s); setShowInterventions(false); }}
                      style={{
                        textAlign: 'left',
                        padding: '11px 14px',
                        borderRadius: 9,
                        border: `1px solid ${activeScenario === s ? '#0891b2' : '#1e293b'}`,
                        background: activeScenario === s ? 'rgba(8,50,70,0.6)' : 'rgba(0,0,0,0.3)',
                        color: activeScenario === s ? '#e2e8f0' : '#94a3b8',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{s}</span>
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: '#6b7280' }}>
                        {SCENARIOS[s].type === 'intervene' ? 'do() Override Profile' : 'Root Baseline Shift'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active interventions + manual */}
              <div style={{ flex: '1 1 280px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Active list */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: '#0e7490', letterSpacing: 2, textTransform: 'uppercase' }}>
                      ACTIVE OVERRIDES
                    </div>
                    {Object.keys(interventions).length > 0 && (
                      <button
                        onClick={() => setInterventions({})}
                        style={{
                          background: 'rgba(69,10,10,0.5)',
                          border: '1px solid #7f1d1d',
                          color: '#f87171',
                          borderRadius: 5,
                          padding: '4px 10px',
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: 9,
                          cursor: 'pointer',
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                        }}
                      >CLEAR ALL</button>
                    )}
                  </div>
                  {Object.keys(interventions).length === 0 ? (
                    <div style={{
                      fontFamily: "'Share Tech Mono', monospace", fontSize: 10,
                      color: '#4b5563', background: 'rgba(0,0,0,0.2)',
                      border: '1px dashed #1e293b', borderRadius: 7,
                      padding: '12px', textAlign: 'center',
                    }}>No overrides active</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {Object.entries(interventions).map(([id, val]) => (
                        <div key={id} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          background: 'rgba(8,50,70,0.3)',
                          border: '1px solid rgba(0,212,255,0.2)',
                          borderRadius: 7, padding: '8px 12px',
                        }}>
                          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#22d3ee', fontWeight: 700 }}>
                            do({id}={(val * 100).toFixed(0)}%)
                          </span>
                          <span style={{ fontSize: 11, color: '#6b7280', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {DATA[id].n}
                          </span>
                          <button
                            onClick={() => { const c = { ...interventions }; delete c[id]; setInterventions(c); }}
                            style={{
                              background: 'rgba(127,29,29,0.4)', border: '1px solid #7f1d1d',
                              color: '#f87171', borderRadius: 4,
                              width: 26, height: 26, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 700, flexShrink: 0,
                            }}
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Manual override */}
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid #1e293b',
                  borderRadius: 10,
                  padding: '14px 16px',
                }}>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: '#6b7280', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
                    MANUAL OVERRIDE
                  </div>
                  <select
                    id="nodeSelect"
                    style={{
                      width: '100%',
                      background: '#030712',
                      border: '1px solid #374151',
                      color: '#e2e8f0',
                      fontSize: 11,
                      padding: '10px',
                      borderRadius: 7,
                      marginBottom: 12,
                      fontFamily: "'Share Tech Mono', monospace",
                      outline: 'none',
                    }}
                  >
                    <option value="">— Select node —</option>
                    {Object.keys(DATA).map(k => <option key={k} value={k}>[{k}] {DATA[k].n}</option>)}
                  </select>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#6b7280' }}>0%</span>
                    <input
                      type="range" id="nodeVal" min="0" max="1" step="0.01" defaultValue="0.5"
                      className="bbn-slider"
                      style={{ flex: 1, background: `linear-gradient(to right, #22d3ee 50%, #1f2937 50%)` }}
                    />
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#6b7280' }}>100%</span>
                  </div>
                  <button
                    onClick={() => {
                      const id = document.getElementById('nodeSelect').value;
                      if (id) {
                        setInterventions(p => ({ ...p, [id]: parseFloat(document.getElementById('nodeVal').value) }));
                        setActiveScenario("Custom");
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(8,50,70,0.8)',
                      border: '1px solid rgba(0,212,255,0.3)',
                      borderRadius: 8,
                      color: '#67e8f9',
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: 11,
                      letterSpacing: 2,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      transition: 'all 0.2s',
                    }}
                  >
                    APPLY do() OPERATOR
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}