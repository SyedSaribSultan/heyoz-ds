/**
 * The shape of a component's written guidance.
 *
 * Twelve sections, and the set is closed. It came out of reading how Material,
 * Apple HIG, Polaris, Carbon, Primer, Wise, Atlassian and Spectrum structure their
 * component pages, then cutting everything that turned out to be filler when the
 * house style was written against this repo's voice.
 *
 * WHY THIS IS DATA AND NOT MDX. Same argument as the recipe layer, applied to prose:
 * the showcase renders one shape for every component, so a page cannot quietly grow
 * a section that another page lacks, and a missing section is a type error rather
 * than an absence nobody notices. The first draft of this content shipped eight of
 * twelve sections on all nine pages and it took an adversarial reviewer to count.
 *
 * WHAT IS DELIBERATELY ABSENT. No anatomy list, no props table, no specs table, no
 * keyboard table. All four are generated from `ComponentRecipe` already — the live
 * row, the state matrix, the token strip, the usage snippet — and a hand-written
 * second copy is the exact drift this folder exists to make impossible. Guidance
 * carries the reason the generated block cannot.
 */

/** One rule with its consequence. The house form: state it as a fact, then say what
 *  breaks. A rule whose reverse also sounds reasonable is not a rule. */
export type Guidance = { rule: string; why: string };

export type ComponentContent = {
  id: string;

  /** One or two sentences. What it is, then the one fact that distinguishes it from
   *  everything else in the system. This is the search result and the Figma
   *  description, so it has to survive being read alone. */
  definition: string;

  /** The eligibility gate, before any execution rule. Phrased from the user's
   *  situation rather than from the component. */
  reachForItWhen: string[];

  /** The other half of the gate. Every entry names what to use instead — a
   *  prohibition without a replacement is a dead end. */
  reachForSomethingElseWhen: Array<{ situation: string; instead: string }>;

  /** One per variant, in emphasis order, using the recipe's exact names. */
  variants: Array<{ variant: string; useWhen: string; avoidWhen: string }>;

  /** One per size. A single-size component says so and says why there is no second —
   *  that sentence is what stops the next contributor adding an `sm`. */
  sizes: {
    guidance: Array<{ size: string; useWhen: string }>;
    note: string;
  };

  /** How to write the text inside the component. */
  copy: string[];

  /** Prose. What the motion is FOR, in a reader's terms — not a restatement of
   *  `recipe.motion`, which the showcase already renders beside it. */
  motion: string;

  /** Long text, zero items, overflow, translation, a container narrower than the
   *  content. Component-specific: the generic container-query argument belongs in
   *  DECISIONS B17 and is cited, never re-argued. */
  behaviourUnderPressure: Array<{ case: string; behaviour: string }>;

  /** The auditability record, and the most valuable section on the page.
   *
   *  `mark` reuses DECISIONS.md's vocabulary: `E` mechanically enforced, `S`
   *  structural, `D` a documented convention. An `E` must name the assertion that
   *  backs it — if you cannot name one, it is a `D`. `notEnforced` is what a reader
   *  might reasonably assume is checked and is not. */
  whatTheBuildEnforces: {
    enforced: Array<{ claim: string; mark: string; assertion: string }>;
    notEnforced: string[];
  };

  /** Component-specific only. An empty array is a real answer and the page says so
   *  rather than hiding the heading — a silent gap is indistinguishable from an
   *  oversight. */
  looksLikeABugButIsNot: Array<{ observation: string; why: string }>;

  /** Discriminators, not restated eligibility gates. `reachForSomethingElseWhen`
   *  answers "I am about to use this and should not"; this answers "I am comparing
   *  these two". An earlier revision collapsed the second into the first on five
   *  pages and a reviewer caught it. */
  related: Array<{ component: string; difference: string }>;

  /** Changes a consumer has to act on. */
  changed: Array<{ what: string; why: string }>;
};
