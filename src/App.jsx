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

// Helper: topological sort the nodes
const computeTopoOrder = () => {
  const inDegree = {};
  const graph = {};
  const sorted = [];
  Object.keys(DATA).forEach(k => { inDegree[k] = 0; graph[k] = []; });
  Object.entries(DATA).forEach(([k, v]) => {
    if (v.deps) {
      Object.keys(v.deps).forEach(p => {
        graph[p].push(k);
        inDegree[k]++;
      });
    }
  });
  const q = Object.keys(inDegree).filter(k => inDegree[k] === 0);
  while (q.length > 0) {
    const n = q.shift();
    sorted.push(n);
    graph[n].forEach(child => {
      inDegree[child]--;
      if (inDegree[child] === 0) q.push(child);
    });
  }
  return sorted;
};
const TOPO_ORDER = computeTopoOrder();

// Util functions
const getEdgeTier = (ciw) => ciw >= 0.75 ? 'Decisive' : ciw >= 0.55 ? 'Strong' : ciw >= 0.35 ? 'Moderate' : 'Weak';
const getColor = (p) => {
  if (p < 0.15) return '#00D4FF'; // Cyan
  if (p < 0.30) return '#22C55E'; // Green
  if (p < 0.50) return '#84CC16'; // Yellow-Green
  if (p < 0.70) return '#F59E0B'; // Amber
  if (p < 0.85) return '#F97316'; // Orange
  if (p < 0.95) return '#DC2626'; // Red
  return '#991B1B'; // Blood Red
};
const getWEP = (p) => {
  if (p < 0.05) return "Remote Possibility";
  if (p < 0.15) return "Very Unlikely";
  if (p < 0.30) return "Unlikely";
  if (p < 0.50) return "Roughly Even Chance";
  if (p < 0.70) return "Likely";
  if (p < 0.85) return "Very Likely";
  if (p < 0.95) return "Highly Likely";
  return "Near Certainty";
};

// === SECTION 3: MATHEMATICALLY SOUND NOISY-OR ENGINE ===
const computeBBN = (roots, interventions) => {
  const res = {};
  TOPO_ORDER.forEach(id => {
    if (interventions[id] !== undefined) {
      res[id] = interventions[id];
      return;
    }
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

// === SECTION 5: MONTE CARLO (BETA SAMPLER ALGORITHMS) ===
const randn = () => {
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};
const rGamma = (alpha) => {
  if (alpha < 1) return rGamma(alpha + 1) * Math.pow(Math.random(), 1 / alpha);
  const d = alpha - 1/3;
  const c = 1 / Math.sqrt(9 * d);
  let v, u, x;
  do {
    do { x = randn(); v = 1 + c * x; } while (v <= 0);
    v = v * v * v; u = Math.random();
  } while (u > 1 - 0.0331 * x * x * x * x && Math.log(u) > 0.5 * x * x + d * (1 - v + Math.log(v)));
  return d * v;
};
const rBeta = (alpha, beta) => {
  const x = rGamma(alpha);
  const y = rGamma(beta);
  return (x + y === 0) ? 0 : x / (x + y);
};

// === SECTION 6 & 7: REACT FLOW CUSTOM RENDERS ===
const CustomNode = ({ data }) => {
  const { id, n, p, isIntervened, t, rootVal, onRootChange } = data;
  const col = getColor(p);
  const isTerminal = t === 'T';
  const isCritical = isTerminal && p > 0.70;
  
  return (
    <div className={`p-3 rounded-lg border-2 shadow-lg transition-all duration-300 ${isTerminal ? 'w-[280px] sm:w-[350px] scale-105 z-50 bg-black/80 backdrop-blur' : 'w-[240px] sm:w-[250px] bg-[#0A0E14]/90'} ${isCritical ? 'terminal-critical' : ''}`}
         style={{ borderColor: col, boxShadow: isCritical ? undefined : `0 0 15px ${col}40` }}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold font-mono px-2 py-0.5 rounded bg-black text-xs border" style={{ color: col, borderColor: col }}>{id}</span>
        {isIntervened && <span className="text-[10px] font-mono font-bold bg-white text-black px-1.5 py-0.5 rounded animate-pulse">DO()</span>}
      </div>
      <div className="text-[11px] font-sans font-semibold leading-snug text-gray-200 mb-3">{n}</div>
      <div className="flex justify-between items-end border-t border-gray-800 pt-2">
        <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight" style={{ color: col }}>{(p * 100).toFixed(1)}%</div>
        {isTerminal && <div className="text-[9px] sm:text-[11px] uppercase font-bold text-red-400 bg-red-950/40 px-2 py-1 rounded">{getWEP(p)}</div>}
      </div>
      
      {/* DIRECT IN-NODE SLIDER FOR ROOTS */}
      {t === 'R' && (
        <div className="mt-3 pt-3 border-t border-gray-800/60 nodrag" onPointerDownCapture={(e) => e.stopPropagation()}>
          <div className="flex justify-between text-[9px] font-mono text-gray-400 mb-1.5 uppercase">
            <span>Input Baseline</span>
            <span style={{color: getColor(rootVal)}}>{(rootVal * 100).toFixed(0)}%</span>
          </div>
          <input type="range" min="0" max="1" step="0.01" value={rootVal} 
            onChange={(e) => onRootChange(id, parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer outline-none transition-all nodrag"
            style={{ background: `linear-gradient(to right, ${getColor(rootVal)} ${rootVal*100}%, #111827 ${rootVal*100}%)` }} />
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
};

const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, data }) => {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, pointerEvents: 'all' }}
             className="group z-40 nodrag">
          <div className="w-6 h-6 rounded-full flex justify-center items-center cursor-help">
            <div className={`w-2 h-2 rounded-full transition-all group-hover:scale-150 ${data.isCrit ? 'bg-red-500 shadow-[0_0_10px_#DC2626]' : 'bg-transparent'}`} />
          </div>
          <div className="hidden group-hover:block absolute bg-black/95 border border-cyan-800 p-3 rounded w-56 text-[11px] shadow-2xl pointer-events-none -translate-y-[calc(100%+10px)] left-1/2 -translate-x-1/2 backdrop-blur-md">
            <div className="font-mono text-cyan-400 mb-1 tracking-wider">{data.source} → {data.target}</div>
            <div className="text-gray-300 font-sans mb-1 border-b border-gray-800 pb-1">
              Weight: <span className="text-white font-mono font-bold">{data.ciw.toFixed(2)}</span> <span className="text-amber-500 italic">[{data.tier}]</span>
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

// === SCENARIOS ===
const SCENARIOS = {
  "Status Quo — March 2026 Baseline": { type: 'roots', vals: { R1:0.45, R2:0.55, R3:0.50, R4:0.40, R5:0.35, R6:0.45, R7:0.60, R8:0.55, R9:0.40, R10:0.50, R11:0.35, R12:0.30, R13:0.55, R14:0.40, R15:0.35 } },
  "Iranian Nuclear Breakout": { type: 'intervene', vals: { R2:0.9, R1:0.7, R15:0.65 } },
  "Taiwan Strait Kinetic Crisis 2026": { type: 'intervene', vals: { R8:0.85, R3:0.6, I10:0.85 } },
  "Russian NATO Direct Strike": { type: 'intervene', vals: { R7:0.9, E2:0.75, I4:0.7 } },
  "BRICS Financial Decoupling Accelerated": { type: 'intervene', vals: { R4:0.85, I8:0.7, I18:0.75 } },
  "Climate-Famine-War Nexus": { type: 'intervene', vals: { R14:0.9, R6:0.85, I9:0.8 } },
  "AI Autonomous Incident": { type: 'intervene', vals: { R11:0.85, I15:0.8, I13:0.7 } },
  "Perfect Storm — Cascade": { type: 'roots', vals: Object.fromEntries(Object.keys(DATA).filter(k=>k.startsWith('R')).map(k=>[k,0.85])) },
  "Diplomatic Breakthrough": { type: 'roots', vals: Object.fromEntries(Object.keys(DATA).filter(k=>k.startsWith('R')).map(k=>[k,0.15])) }
};

// === MAIN APP ===
export default function BBNApp() {
  const [roots, setRoots] = useState(() => {
    const init = {}; Object.keys(DATA).filter(k => k.startsWith('R')).forEach(k => init[k] = DATA[k].val); return init;
  });
  const [interventions, setInterventions] = useState({});
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeTab, setActiveTab] = useState('sensitivity');
  const [mcRunning, setMcRunning] = useState(false);
  const [mcResults, setMcResults] = useState(null);
  const [showInterventions, setShowInterventions] = useState(false);
  const [activeScenario, setActiveScenario] = useState("Status Quo — March 2026 Baseline");
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Dynamic CSS & Typography Injection
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700&family=Rajdhani:wght@400;600;700&family=Share+Tech+Mono&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    const style = document.createElement('style');
    style.innerHTML = `
      .font-mono { font-family: 'Share Tech Mono', monospace; }
      .font-rajdhani { font-family: 'Rajdhani', sans-serif; }
      .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #00D4FF40; border-radius: 4px; }
      @keyframes radar-ping { 75%, 100% { transform: scale(2); opacity: 0; } }
      .animate-radar { animation: radar-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; }
      @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 10px #DC2626; border-color: #991B1B; } 50% { box-shadow: 0 0 40px #DC2626; border-color: #DC2626; } }
      .terminal-critical { animation: pulse-glow 2s infinite ease-in-out; }
      .edge-animated path { stroke-dasharray: 5; animation: dashdraw 0.5s linear infinite; }
      @keyframes dashdraw { to { stroke-dashoffset: -10; } }
    `;
    document.head.appendChild(style);
  },[]);

  const computed = useMemo(() => computeBBN(roots, interventions), [roots, interventions]);

  // Handle root change callback memoized for performance
  const handleRootChange = useCallback((id, val) => {
    setRoots(prev => ({ ...prev, [id]: val }));
    setActiveScenario("Custom");
  }, []);

  const applyScenario = (name) => {
    setActiveScenario(name);
    const s = SCENARIOS[name];
    if (s.type === 'roots') { setRoots(s.vals); setInterventions({}); }
    else { setInterventions(s.vals); }
  };

  // === SENSITIVITY ENGINE ===
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

  // === MONTE CARLO SIMULATION ===
  const runMC = () => {
    setMcRunning(true);
    setTimeout(() => {
      const res =[];
      const NU = 8;
      for (let i = 0; i < 10000; i++) {
        const sampleR = {};
        Object.keys(roots).forEach(r => {
          const mean = Math.max(0.01, Math.min(0.99, roots[r]));
          const alpha = Math.max(0.1, mean * NU);
          const beta = Math.max(0.1, (1 - mean) * NU);
          sampleR[r] = rBeta(alpha, beta);
        });
        res.push(computeBBN(sampleR, interventions)['T1']);
      }
      res.sort((a, b) => a - b);
      setMcResults({ mean: res[5000], p5: res[500], p95: res[9500], hist: res });
      setMcRunning(false);
      setActiveTab('mc');
    }, 50);
  };

  // === GRAPH LAYOUT GENERATION ===
  const { nodes, edges } = useMemo(() => {
    const cols = { R: [], I1:[], I2: [], E: [], T:[] };
    TOPO_ORDER.forEach(id => {
      const t = DATA[id].t;
      if (t === 'R') cols.R.push(id);
      else if (t === 'I') {
        const pTiers = Object.keys(DATA[id].deps).map(d => DATA[d].t);
        if (pTiers.every(p => p === 'R')) cols.I1.push(id); else cols.I2.push(id);
      } else if (t === 'E') cols.E.push(id);
      else cols.T.push(id);
    });

    // Widened X-axis gaps slightly to accommodate the w-[250px] to w-[350px] responsive width
    const xMap = { R: 50, I1: 500, I2: 950, E: 1400, T: 1900 };
    const nds =[];
    Object.entries(cols).forEach(([colKey, items]) => {
      items.forEach((id, idx) => {
        nds.push({
          id, type: 'custom',
          // Increased Y spacing: Root nodes get 250px to account for new slider heights. Other nodes get 180px.
          position: { x: xMap[colKey], y: 50 + idx * (colKey === 'R' ? 250 : 180) },
          data: { id, n: DATA[id].n, p: computed[id], isIntervened: !!interventions[id], t: DATA[id].t, rootVal: roots[id], onRootChange: handleRootChange }
        });
      });
    });

    const eds =[];
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
            style: { stroke: col, strokeWidth: isCrit ? 4 : 1.5 + (ciw * 2), opacity: isCrit ? 1 : 0.35 },
            markerEnd: { type: MarkerType.ArrowClosed, color: col }
          });
        });
      }
    });
    return { nodes: nds, edges: eds };
  }, [computed, interventions, criticalPathEdges, roots, handleRootChange]);

  return (
    <div className="h-screen min-h-screen bg-[#0A0E14] text-gray-200 font-rajdhani flex flex-col overflow-hidden select-none relative">
      {/* RESPONSIVE TOP BAR */}
      <div className="border-b border-cyan-900/60 bg-[#06090D]/90 backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center p-3 md:px-6 z-20 shrink-0 shadow-lg gap-3 md:gap-0">
        <div>
          <h1 className="text-[17px] md:text-2xl font-bold text-[#00D4FF] tracking-wider uppercase drop-shadow-[0_0_5px_rgba(0,212,255,0.5)] leading-tight">GEOPOLITICAL BAYESIAN RISK ENGINE v2.0</h1>
          <div className="text-[9px] md:text-[11px] text-gray-500 font-mono tracking-widest uppercase mt-0.5">OSINT FUSION — Q1 2026 // UNCLASSIFIED</div>
        </div>
        
        <div className="flex w-full md:w-auto justify-between md:justify-end items-center space-x-2 md:space-x-4">
          <div className="flex items-center space-x-2 md:space-x-4 border border-gray-800 bg-black/50 px-3 md:px-5 py-1.5 rounded-md shadow-inner flex-1 md:flex-none">
            <div className="relative flex justify-center items-center">
               {computed['T1'] > 0.50 && <div className="absolute w-3 h-3 md:w-4 md:h-4 bg-red-500 rounded-full animate-radar" />}
               <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full relative z-10 ${computed['T1'] > 0.5 ? 'bg-red-500' : 'bg-green-500 shadow-[0_0_8px_#22C55E]'}`} />
            </div>
            <div className="text-right flex flex-col justify-center">
              <div className="text-[9px] md:text-[10px] font-mono text-gray-400 uppercase tracking-widest leading-none mb-0.5 md:mb-1">P(WW3) Risk</div>
              <div className="text-xl md:text-2xl font-bold font-mono text-white leading-none">
                {(computed['T1'] * 100).toFixed(1)}% <span className={`hidden sm:inline text-xs font-sans tracking-wider ${computed['T1'] > 0.5 ? 'text-red-400' : 'text-gray-400'}`}>[{getWEP(computed['T1'])}]</span>
              </div>
            </div>
          </div>
          <button onClick={() => applyScenario("Status Quo — March 2026 Baseline")} className="hidden md:block px-4 py-2 bg-gray-900/80 border border-gray-700 hover:border-gray-500 text-gray-300 text-[10px] md:text-xs rounded uppercase font-mono transition-all">
            Reset
          </button>
          <button onClick={() => setShowInterventions(true)} className="px-3 md:px-5 py-2 bg-cyan-950/40 border border-cyan-800/80 hover:bg-cyan-900/60 text-cyan-300 text-[10px] md:text-xs rounded uppercase font-mono transition-all shadow-[0_0_10px_rgba(0,212,255,0.1)] whitespace-nowrap">
            do() Mods ({Object.keys(interventions).length})
          </button>
        </div>
      </div>

      {/* FULL WIDTH GRAPH AREA */}
      <div className="flex-1 relative bg-[#0A0E14] overflow-hidden">
        {/* Subtle hex grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #00D4FF 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} onNodeClick={(_, n) => setSelectedNode(n.id)} fitView maxZoom={1.5} minZoom={0.1} defaultViewport={{ x: 0, y: 0, zoom: 0.4 }}>
          <Background color="#1e293b" gap={25} size={1} />
          <Controls className="bg-gray-950 border-gray-800 fill-gray-300 shadow-xl mb-10" />
          <MiniMap className="hidden md:block bg-[#0B111A] border border-gray-800" nodeColor={(n) => getColor(computed[n.id])} maskColor="#00000080" />
        </ReactFlow>

        {/* BOTTOM COLLAPSIBLE ANALYTICS DRAWER */}
        {!showAnalytics && (
          <button 
            onClick={() => setShowAnalytics(true)}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-[#06090D]/95 border-t border-x border-cyan-900/60 px-6 py-1.5 rounded-t-xl text-[10px] md:text-xs font-mono text-cyan-500 hover:text-cyan-300 z-20 shadow-[0_-5px_15px_rgba(0,0,0,0.5)] transition-all">
            ▲ OPEN ANALYTICS ▲
          </button>
        )}

        {showAnalytics && (
          <div className="absolute bottom-0 left-0 right-0 bg-[#06090D]/95 border-t border-cyan-900/60 backdrop-blur-xl z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] flex flex-col max-h-[60vh] md:max-h-[40vh] animate-in slide-in-from-bottom-5">
            <div className="flex justify-between items-center border-b border-cyan-900/40 bg-black/20 shrink-0">
              <div className="flex overflow-x-auto custom-scrollbar">
                {['sensitivity', 'shapley', 'mc'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 md:px-8 py-2.5 text-[10px] md:text-xs font-mono tracking-widest transition-colors whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-cyan-500 text-cyan-400 bg-cyan-950/40' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
                    {tab === 'mc' ? 'MONTE CARLO (BETA)' : tab.toUpperCase()}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowAnalytics(false)} className="px-5 py-2 text-gray-500 hover:text-white font-mono text-xl transition bg-red-950/20 hover:bg-red-900/40">×</button>
            </div>
            
            <div className="p-4 md:p-5 overflow-y-auto custom-scrollbar flex-1">
              {activeTab === 'sensitivity' && (
                <div>
                  <div className="text-[10px] md:text-xs text-cyan-600 mb-3 font-mono tracking-wider">WHICH DRIVER VARIABLES MOST DRIVE WW3 RISK RIGHT NOW?</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
                    {sensitivityData.slice(0, 10).map((d) => (
                      <div key={d.id} className="flex items-center text-[10px] md:text-[11px] font-mono group">
                        <span className="w-8 text-cyan-600 font-bold group-hover:text-cyan-400 transition">{d.id}</span>
                        <div className="flex-1 h-2.5 bg-gray-900 rounded mx-2 md:mx-3 overflow-hidden relative shadow-inner">
                          <div className="h-full absolute left-0 top-0 transition-all duration-500" style={{ width: `${(d.v / sensitivityData[0].v) * 100}%`, backgroundColor: getColor(roots[d.id]) }} />
                        </div>
                        <span className="w-10 md:w-12 text-right text-gray-500">{d.v.toFixed(3)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'shapley' && (
                <div>
                  <div className="text-[10px] md:text-xs text-cyan-600 mb-4 font-mono tracking-wider">NORMALIZED CAUSAL CONTRIBUTION DISTRIBUTION</div>
                  <div className="w-full h-8 md:h-10 flex rounded overflow-hidden shadow-2xl mb-4 border border-gray-800">
                    {shapleyData.map(d => (
                      <div key={d.id} style={{ width: `${d.pct}%`, backgroundColor: getColor(roots[d.id]) }} className="h-full border-r border-black/50 hover:opacity-80 transition cursor-help relative group">
                        <div className="hidden group-hover:block absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-black text-white text-[10px] font-mono p-1 rounded whitespace-nowrap">{d.id}: {d.pct.toFixed(1)}%</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 md:gap-3 text-[10px] md:text-[11px] font-mono text-gray-400">
                    {shapleyData.slice(0, 10).map(d => (
                      <div key={d.id} className="flex items-center bg-black/40 px-2 py-1 rounded border border-gray-800">
                        <div className="w-2.5 h-2.5 mr-2 rounded-sm shadow-sm" style={{ backgroundColor: getColor(roots[d.id]) }} />
                        <span className="font-bold text-gray-300 mr-1">{d.id}</span> {d.pct.toFixed(1)}%
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'mc' && (
                <div>
                  <button onClick={runMC} disabled={mcRunning} className="mb-4 w-full md:w-auto px-6 py-2 bg-cyan-950 border border-cyan-800 text-cyan-300 text-[10px] md:text-[11px] font-mono tracking-wider rounded hover:bg-cyan-900 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                    {mcRunning ? 'EXECUTING BETA SIMULATION...' : 'RUN MONTE CARLO (10,000 SAMPLES)'}
                  </button>
                  {mcResults && !mcRunning && (
                    <div className="flex flex-col md:flex-row md:space-x-12 items-center gap-6 md:gap-0">
                      <div className="w-full md:flex-1 h-20 md:h-24 flex items-end border-b border-gray-800 gap-[1px]">
                        {Array.from({ length: 50 }).map((_, i) => {
                          const bucketMin = i / 50; const bucketMax = (i + 1) / 50;
                          const count = mcResults.hist.filter(v => v >= bucketMin && v < bucketMax).length;
                          return <div key={i} className="flex-1 transition-all hover:opacity-80 cursor-help" style={{ height: `${(count / 1500) * 100}%`, backgroundColor: getColor(bucketMin) }} title={`P=${(bucketMin * 100).toFixed(0)}%: ${count} samples`} />;
                        })}
                      </div>
                      <div className="font-mono text-[11px] md:text-sm space-y-2 bg-black/60 p-4 rounded-lg border border-gray-800 shadow-xl w-full md:w-72">
                        <div className="flex justify-between"><span className="text-gray-500">P05 (Optimistic):</span> <span className="text-green-500 font-bold">{(mcResults.p5 * 100).toFixed(1)}%</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Mean Estimate:</span> <span className="text-amber-500 font-bold">{(mcResults.mean * 100).toFixed(1)}%</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">P95 (Pessimistic):</span> <span className="text-red-500 font-bold">{(mcResults.p95 * 100).toFixed(1)}%</span></div>
                        <div className="text-[9px] md:text-[10px] text-gray-400 mt-2 pt-2 border-t border-gray-800 leading-tight">
                          Range: {getWEP(mcResults.p5)} to {getWEP(mcResults.p95)} — Distributed variance.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* OVERLAY SIDEBAR - INSPECTOR (Slides in from right over canvas) */}
        {selectedNode && (
          <div className="absolute top-0 right-0 h-full w-full sm:w-[360px] bg-[#080B10]/95 backdrop-blur-xl border-l border-cyan-900/50 flex flex-col z-30 shadow-[-20px_0_40px_rgba(0,0,0,0.8)] animate-in slide-in-from-right-8 duration-300">
            <div className="p-4 border-b border-cyan-900/50 flex justify-between items-center bg-black/40 shrink-0">
              <span className="font-bold text-cyan-400 tracking-wider text-sm">NODE INSPECTOR</span>
              <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-white transition bg-gray-900 px-3 py-1 rounded text-xs">✕ CLOSE</button>
            </div>
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 pb-24">
              <div className="flex justify-between items-start mb-2">
                 <div className="font-mono text-xs font-bold px-2 py-1 bg-cyan-950 text-cyan-400 border border-cyan-900 rounded">{selectedNode}</div>
                 <div className="font-mono text-[10px] uppercase text-gray-500 tracking-widest text-right">{DATA[selectedNode].t === 'R' ? 'Root Node' : DATA[selectedNode].t === 'T' ? 'Terminal Node' : DATA[selectedNode].t === 'E' ? 'Escalation Node' : 'Intermediate Node'}</div>
              </div>
              <h2 className="text-lg md:text-xl font-bold leading-tight mb-5 text-gray-100">{DATA[selectedNode].n}</h2>
              <div className="text-4xl md:text-5xl font-mono font-bold mb-6 border-b border-gray-800/80 pb-5 drop-shadow-md" style={{ color: getColor(computed[selectedNode]) }}>
                {(computed[selectedNode] * 100).toFixed(1)}%
              </div>
              <div className="text-[11px] md:text-xs text-gray-300 mb-6 leading-relaxed bg-black/50 p-4 rounded-lg border border-gray-800 shadow-inner">
                {DATA[selectedNode].txt}
              </div>
              {DATA[selectedNode].deps && (
                <div className="mb-4">
                  <div className="text-[10px] uppercase font-bold text-cyan-700 tracking-widest mb-3">Causal Parents</div>
                  <div className="space-y-2">
                    {Object.entries(DATA[selectedNode].deps).map(([pId, ciw]) => (
                      <div key={pId} className="flex justify-between items-center bg-black/40 p-2.5 rounded border border-gray-800 hover:border-gray-600 transition cursor-pointer" onClick={() => setSelectedNode(pId)}>
                        <span className="font-mono text-cyan-600 font-bold w-8">{pId}</span>
                        <span className="text-[10px] md:text-[11px] text-gray-400 truncate flex-1 mx-2" title={DATA[pId].n}>{DATA[pId].n}</span>
                        <div className="text-right">
                          <div className="font-mono text-sm font-bold" style={{ color: getColor(computed[pId]) }}>{(computed[pId] * 100).toFixed(0)}%</div>
                          <div className="text-[8px] md:text-[9px] font-mono text-amber-500/80">CIW {ciw.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* RESPONSIVE INTERVENTION MODAL / SCENARIOS */}
        {showInterventions && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex justify-center items-center p-3 sm:p-8">
            <div className="bg-[#080B10] border border-cyan-800 rounded-xl shadow-[0_0_50px_rgba(0,212,255,0.15)] w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-4 md:p-5 border-b border-cyan-900/60 flex justify-between items-center bg-[#0A0E14] shrink-0">
                <h2 className="text-sm md:text-xl font-bold text-cyan-400 tracking-widest uppercase">DO-CALCULUS & SCENARIOS</h2>
                <button onClick={() => setShowInterventions(false)} className="text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 px-3 py-1 rounded transition text-xs md:text-sm">✕ CLOSE</button>
              </div>
              <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-gray-800 p-4 md:p-6 overflow-y-auto custom-scrollbar bg-black/20">
                  <h3 className="text-[10px] md:text-[11px] font-mono text-cyan-700 font-bold tracking-widest mb-4">PRESET SCENARIOS</h3>
                  <div className="space-y-2 md:space-y-3 pb-4">
                    {Object.keys(SCENARIOS).map(s => (
                      <button key={s} onClick={() => { applyScenario(s); if(window.innerWidth < 768) setShowInterventions(false); }}
                        className={`w-full text-left p-3 md:p-4 rounded-lg border text-xs md:text-sm transition-all shadow-sm ${activeScenario === s ? 'bg-cyan-950/60 border-cyan-500 text-cyan-100' : 'bg-[#0A0E14] border-gray-800 text-gray-400 hover:border-gray-600 hover:bg-gray-900/50'}`}>
                        <div className="font-bold mb-1">{s}</div>
                        <div className="text-[9px] md:text-[10px] font-mono text-gray-500 opacity-80">
                          {SCENARIOS[s].type === 'intervene' ? 'do() Override Profile' : 'Root Baseline Shift'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="w-full md:w-1/2 p-4 md:p-6 overflow-y-auto custom-scrollbar">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-[10px] md:text-[11px] font-mono text-cyan-700 font-bold tracking-widest">ACTIVE do(X = p)</h3>
                    <button onClick={() => setInterventions({})} className="text-[9px] md:text-[10px] font-mono font-bold bg-red-950/60 text-red-400 px-2 md:px-3 py-1 md:py-1.5 rounded border border-red-900 hover:bg-red-900 transition">CLEAR ALL</button>
                  </div>
                  {Object.keys(interventions).length === 0 ? (
                    <div className="text-xs md:text-sm text-gray-600 italic bg-black/30 p-4 rounded border border-gray-800/50 text-center mb-6">No nodes locked. Model is propagating organically.</div>
                  ) : (
                    <div className="space-y-2 mb-8">
                      {Object.entries(interventions).map(([id, val]) => (
                        <div key={id} className="flex justify-between items-center bg-cyan-950/20 border border-cyan-900/50 p-2 md:p-3 rounded-lg shadow-sm">
                          <span className="font-mono text-cyan-300 text-[10px] md:text-xs font-bold tracking-widest">do({id} = {(val * 100).toFixed(0)}%)</span>
                          <span className="text-[9px] md:text-[10px] text-gray-400 ml-2 md:ml-4 flex-1 truncate">{DATA[id].n}</span>
                          <button onClick={() => { const copy = { ...interventions }; delete copy[id]; setInterventions(copy); }} className="text-red-500 hover:text-red-400 bg-red-950/40 w-5 h-5 md:w-6 md:h-6 rounded flex justify-center items-center ml-2 md:ml-4">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="bg-[#0A0E14] p-4 md:p-5 rounded-lg border border-gray-800 shadow-inner">
                    <h4 className="text-[10px] md:text-[11px] font-mono text-gray-500 font-bold tracking-widest mb-4">MANUAL OVERRIDE</h4>
                    <select id="nodeSelect" className="w-full bg-[#06090D] border border-gray-700 text-gray-200 text-[10px] md:text-xs p-2.5 md:p-3 rounded-md mb-4 font-mono outline-none focus:border-cyan-500 transition">
                      <option value="">-- Select specific node --</option>
                      {Object.keys(DATA).map(k => <option key={k} value={k}>[{k}] {DATA[k].n}</option>)}
                    </select>
                    <div className="flex items-center space-x-4 mb-5">
                      <input type="range" id="nodeVal" min="0" max="1" step="0.01" defaultValue="0.5" className="flex-1 accent-cyan-500 h-1.5 bg-gray-900 rounded-lg cursor-pointer" />
                      <span className="text-[10px] md:text-xs font-mono w-10 md:w-12 text-right text-gray-400" id="valDisplay">50%</span>
                    </div>
                    <button onClick={() => {
                      const id = document.getElementById('nodeSelect').value;
                      if (id) {
                        setInterventions(p => ({ ...p, [id]: parseFloat(document.getElementById('nodeVal').value) }));
                        setActiveScenario("Custom");
                      }
                    }} className="w-full bg-cyan-900/80 hover:bg-cyan-800 text-cyan-100 text-[10px] md:text-xs font-mono font-bold py-2.5 md:py-3 rounded-md transition tracking-wider shadow-md">APPLY do() OPERATOR</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}