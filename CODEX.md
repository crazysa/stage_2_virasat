# How Codex built Virasat

Codex built this. Every layer of it — the domain model, the rulebook and the research
behind every rule, the sequencing engine, the citizen journey, the design system, the
accessibility behaviour and the tests. It also corrected the specification it was given,
three times, against current law. This is the record.

## The domain model and the rulebook

Codex defined the typed domain: the citizen `Profile`, the `Task` shape with its
eligibility predicates, dependencies, deadline metadata, state and bank variance flags,
verification flags, and `RuleSource` records — all still in `src/types.ts` and
`src/rules/`.

It then encoded the rules themselves, and the coverage was its own research: death
registration and certificates; legal-heir and succession certificates; EPFO Forms 20,
10D and 5IF; EPS-95 pension; bank accounts, lockers and UDGAM; property mutation;
Central and State pension and Jeevan Pramaan; vehicle RC; electricity, water and LPG;
insurance; gratuity; Aadhaar; PAN; voter roll; ration card; securities and demat;
mobile SIM; and the deceased person's income-tax obligations.

Variants are separate rules wherever eligibility or dependencies genuinely differ —
bank nominee versus survivorship versus no-nomination claims, demat nomination paths,
Form 14 versus the joint-account and PPO exemption, Form J versus Form K gratuity.

## The sequencing engine

Codex wrote the engine that turns those rules into an ordered plan: a stable Kahn
topological sort with deterministic tie-breaking, duplicate and missing-dependency
validation, an explicit cycle guard, predicate-based eligibility filtering, the longest
dependency chain, task readiness and named blockers, and date-of-death deadline
evaluation with risk sorting and escalation consequences. That code is what still
produces every plan the demo shows.

## The interface and the design system

Codex built the citizen journey — one question per screen with an explicit "I do not
know" route on every meaningful question, the phased plan with authority, documents,
forms, cost, common failure and cited source per step, and the per-asset certificate
decisions. It defined the visual system once — the warm-paper palette, the type scale,
the `Virasat / विरासत` lockup — and the accessibility behaviour: heading focus on route
change, a modal focus trap with Escape and opener restoration, and measured contrast on
the final tokens.

## Research corrections it made to the specification

These are the ones worth reading, because Codex corrected the brief it was given.

- The specification said a death registered more than a year late needs a First Class
  Magistrate's order. That is the pre-amendment rule. Section 13 of the Registration of
  Births and Deaths Act changed with effect from 1 October 2023, and the current
  authorities are the District Magistrate, Sub-Divisional Magistrate, or an Executive
  Magistrate authorised by the District Magistrate. The rulebook uses the current law.
- The specification said a missing EPF nomination generally requires a succession or
  legal-heir certificate. Paragraph 70 of the EPF Scheme pays eligible family members
  first even without a nomination, so no blanket dependency was encoded.
- The specification asked for a one-year forfeiture warning on EPS-95 arrears. Codex
  could not verify a universal forfeiture rule in current official material, so it
  encoded a flagged caution that deliberately does not claim automatic forfeiture.
- EPFO's Composite Claim Form covers the former Forms 20, 10D and 5IF, while current
  guidance still names the individual forms. Both routes are recorded rather than one
  being guessed.
- A succession certificate covers specified debts and securities. Locker contents are
  handled through the inventory and access process instead, rather than being treated
  as securities.

## Verification

Codex wrote the first test suite — valid ordering, cycle detection, critical path,
structurally different profiles, deadline warnings, unique identifiers and
dependency-reference integrity. The suite has grown since; it currently stands at 233
passing tests, alongside a build-time check that every cited source resolves and that
each rule is attributed to an authority-owned domain.

Everything described above is Codex's.
