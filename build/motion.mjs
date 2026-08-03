/**
 * motion.mjs — spring engine.
 *
 * The motion counterpart to palette.mjs, and it exists for the same reason. Every
 * easing curve in this system is COMPUTED from physical spring parameters. No
 * cubic-bezier is hand-tuned and no `linear()` stop list is pasted in from a
 * generator, because a pasted curve is a magic number: nobody can say why the
 * fourth stop is 1.0837, so nobody can change it, so it never gets changed.
 *
 * A designer declares what they want in terms they can reason about —
 *
 *     { settle: 150, bounce: 0 }     // 150ms, no overshoot
 *
 * — and this file returns the curve and how far it overshoots. Move `bounce` and
 * the curve recomputes. That is the same bargain palette.mjs makes: authored in a
 * perceptual space, emitted in a technical one.
 *
 * WHY `settle` AND NOT SwiftUI'S `duration`. SwiftUI parameterises a spring by the
 * period of one oscillation, which is the physicist's handle but not the
 * designer's: a spring declared at "250ms" in that scheme is still visibly moving
 * at 368ms, because settling takes roughly 1.5x the period even with no bounce and
 * far longer with it. Declaring the period means the number in the spec is not the
 * number on the screen, and every calibration argument then happens in the wrong
 * units. So this file inverts it — you state the time you want it to be over, and
 * the frequency is solved for. That also means the gates can assert against the
 * quantity a person would actually complain about.
 *
 * WHY SPRINGS AT ALL. A cubic-bezier is a shape someone drew. A spring is a
 * physical system, and interfaces animated with springs read as objects with mass
 * rather than as values being interpolated — which is the whole difference between
 * motion that feels designed and motion that feels applied. Material 3 Expressive
 * replaced its duration-and-curve system with springs for this reason, and Apple's
 * SwiftUI has been spring-first for years.
 *
 * WHY `linear()` AND NOT A JS ANIMATION LIBRARY. CSS `linear()` takes a list of
 * sampled progress values and straight-lines between them, and — critically —
 * accepts values outside 0..1, which is what makes overshoot expressible. So a
 * real simulated spring can be baked into a CSS custom property. This design
 * system has no runtime dependencies and this keeps it that way: the output is a
 * string in a stylesheet, and a consumer needs no JavaScript to get spring motion.
 * Supported in every major browser since December 2023.
 *
 * THE ONE HONEST LIMITATION. A real spring has no duration — it settles when the
 * physics say so, and if you interrupt it mid-flight it carries its velocity into
 * the new target. A baked `linear()` curve cannot do that: CSS transitions need an
 * explicit duration, and an interrupted CSS transition reverses along the curve
 * rather than preserving momentum. For hover, press, focus, enter and exit — every
 * transition in this system — that is invisible. For a drag or a swipe that the
 * user redirects mid-gesture, it is not, and that case wants a real spring solver
 * in JS. There is no such interaction in this system today. When there is, it
 * should read its stiffness and damping from the same declaration here rather than
 * inventing a second set.
 */

/* ------------------------------------------------------------------ *
 * 1. Parameterisation
 * ------------------------------------------------------------------ */

/**
 * bounce → damping ratio.
 *
 * This half is SwiftUI's mapping, adopted rather than invented because it is the
 * one spring API a large number of designers have already built intuition for, and
 * because the alternative — asking for stiffness in N/m and damping in N·s/m — is
 * a request nobody can answer from taste.
 *
 *   bounce  0    critically damped. Approaches the target and stops dead.
 *           > 0  underdamped. Overshoots and springs back. 0.15 is a nudge you
 *                feel but do not see, 0.4 is unmistakable, above ~0.5 reads as
 *                a toy.
 *           < 0  overdamped. Crawls in. Almost always the wrong answer; it
 *                exists so the range is honest, not because it is useful.
 */
function toZeta(bounce) {
  if (bounce <= -1 || bounce >= 1) {
    throw new Error(`spring bounce must be in (-1, 1), got ${bounce}`);
  }
  return bounce >= 0 ? 1 - bounce : 1 / (1 + bounce);
}

/* ------------------------------------------------------------------ *
 * 2. The step response
 * ------------------------------------------------------------------ */

/**
 * Unit step response of a damped harmonic oscillator: position at time t of a
 * mass released at 0 and pulled toward 1, with x(0) = 0 and x'(0) = 0.
 *
 * Three regimes, and all three are needed — a critically damped spring is not a
 * special case of the underdamped formula, it is the point where the trig term
 * degenerates and the closed form has to change.
 */
/* The response depends on omega0 and t only through their product, in all three
 * regimes — check each branch below and every appearance of `t` is multiplied by
 * omega0. That is not a coincidence, it is what makes a spring scale-free in time,
 * and it is the lever this file turns: work in normalised time tau = omega0 * t,
 * find where the spring settles there once, and the frequency needed to hit any
 * requested wall-clock settle time follows by division. No search, no iteration to
 * converge, exact to the resolution of the walk. */
function position(tau, zeta) {
  const t = tau;
  const omega0 = 1;
  if (t <= 0) return 0;

  if (zeta < 1) {
    /* Underdamped: oscillates inside a decaying envelope. This is the only
     * regime that overshoots, and therefore the only one worth using for
     * anything spatial. */
    const wd = omega0 * Math.sqrt(1 - zeta * zeta);
    const decay = Math.exp(-zeta * omega0 * t);
    return 1 - decay * (Math.cos(wd * t) + ((zeta * omega0) / wd) * Math.sin(wd * t));
  }

  if (zeta === 1) {
    /* Critically damped: the fastest approach that never crosses the target.
     * This is what every colour and opacity transition should use. */
    return 1 - Math.exp(-omega0 * t) * (1 + omega0 * t);
  }

  /* Overdamped: two real exponentials, no crossing, slower than critical. */
  const s = omega0 * Math.sqrt(zeta * zeta - 1);
  const r1 = -omega0 * zeta + s;
  const r2 = -omega0 * zeta - s;
  return 1 + (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r1 - r2);
}

/* ------------------------------------------------------------------ *
 * 3. Settle time
 * ------------------------------------------------------------------ */

/** Progress within this of 1.0 is indistinguishable on screen. A 400px move
 *  still has 0.4px to travel at this threshold. */
const SETTLE_EPSILON = 0.001;

/** Ceiling on normalised settle time. A spring this underdamped rings for tens of
 *  oscillations and has no business in an interface, so exceeding it throws rather
 *  than clamps — a clamp would silently ship the ringing. */
const MAX_TAU = 200;

/**
 * Normalised settle time: how many radians of natural frequency this spring needs
 * before it is visibly done. A function of damping ratio alone.
 *
 * Found by walking forward and remembering the last moment the spring was still
 * away from the target — not the first moment it arrives, because an underdamped
 * spring crosses 1.0 several times on its way to staying there, and stopping at
 * the first crossing would cut the animation off mid-bounce.
 */
function normalisedSettle(zeta) {
  const dTau = 0.002;
  const maxSteps = Math.ceil(MAX_TAU / dTau);
  let last = 0;

  for (let i = 1; i <= maxSteps; i++) {
    const tau = i * dTau;
    if (Math.abs(position(tau, zeta) - 1) >= SETTLE_EPSILON) last = tau;
  }

  if (last >= MAX_TAU - dTau) {
    throw new Error(`spring rings past tau=${MAX_TAU} (zeta=${zeta.toFixed(4)}) — bounce is too high`);
  }
  return last + dTau;
}

/* ------------------------------------------------------------------ *
 * 4. Emission
 * ------------------------------------------------------------------ */

/**
 * How many samples go into a `linear()`.
 *
 * `linear()` straight-lines between stops, so too few turns a curve into a
 * visible polygon — and a spring is the worst case for this, because its
 * interesting part is a turnaround. Eleven stops, which reads as plenty, produces
 * a spring with a flat spot exactly where the bounce should be. Forty is enough
 * that the segments fall below a pixel of error on a full-viewport move, and
 * costs about 250 bytes per curve.
 */
const SAMPLES = 40;

/** Trim a float to the shortest form that still round-trips at 4dp. `0.5000`
 *  and `0.5` are the same curve; one of them is noise in a diff. */
const trim = (n) => String(Number(n.toFixed(4)));

/**
 * Build one spring.
 *
 * Returns everything a caller might gate on, not just the curve — the whole point
 * of computing these is that the properties become assertable. `peak` in
 * particular is what lets build.mjs prove that a spring declared for colour never
 * overshoots, which is not a claim about the declaration but a measurement of the
 * curve that ships.
 */
export function spring({ settle, bounce = 0 }) {
  if (!(settle > 0)) {
    throw new Error(`spring settle must be > 0 ms, got ${settle}`);
  }
  const zeta = toZeta(bounce);

  /* Solve for the frequency that lands the settle where it was asked to. */
  const tauSettle = normalisedSettle(zeta);
  const omega0 = tauSettle / (settle / 1000);

  const samples = [];
  for (let i = 0; i < SAMPLES; i++) {
    samples.push(position((i / (SAMPLES - 1)) * tauSettle, zeta));
  }

  /* Pin the ends. The simulation lands within SETTLE_EPSILON of 1, but a curve
   * that ends at 0.9997 leaves the property 0.03% short of its target forever,
   * and on a colour that is a different hex than the token says. */
  samples[0] = 0;
  samples[samples.length - 1] = 1;

  const peak = Math.max(0, Math.max(...samples) - 1);

  return {
    /** Natural angular frequency, rad/s. For a future JS spring solver, and the
     *  reason this returns physical parameters at all rather than just a string. */
    omega0,
    /** Damping ratio. 1 is critical; below 1 overshoots. */
    zeta,
    /** Stiffness and damping for unit mass, which is the form every JS spring
     *  library takes. Derived, so a JS solver and this curve cannot disagree. */
    stiffness: omega0 * omega0,
    damping: 2 * zeta * omega0,
    /** The requested settle time. Exact by construction — omega0 was solved for
     *  it — so this is a restatement of the declaration rather than a measurement.
     *  Kept on the object so consumers do not have to hold the declaration too. */
    settleMs: Math.round(settle),
    /** Peak overshoot as a fraction of the distance travelled. 0 when the
     *  spring never crosses its target. */
    peak,
    /** Whether this curve crosses its target at all. */
    overshoots: peak > 0,
    /** The CSS easing function. */
    css: `linear(${samples.map(trim).join(', ')})`,
    /** Raw samples, for the showcase to plot without re-parsing the string. */
    samples,
  };
}

/**
 * Resolve a whole declaration set at once, keyed by name.
 *
 * spec.mjs declares springs as data; this turns them into curves. Kept here
 * rather than in build.mjs so that the showcase and any future consumer compute
 * them the same way, from the same code, instead of reading the emitted strings
 * and hoping.
 */
export function resolveSprings(declarations) {
  const out = {};
  for (const [name, params] of Object.entries(declarations)) {
    try {
      out[name] = { ...spring(params), params };
    } catch (e) {
      throw new Error(`spring "${name}": ${e.message}`);
    }
  }
  return out;
}
