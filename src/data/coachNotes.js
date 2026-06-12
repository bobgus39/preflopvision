export const coachNotes = {
  cash: {
    UTG: [
      {
        tip: "UTG is the toughest spot in 6-max. Open only ~14–16% of hands. Any wider and you'll be punished by positional disadvantage across 5 players.",
        source: "— GTO Wizard, 6-max NLHE Solutions",
      },
      {
        tip: "Suited wheel aces (A5s–A4s) have hidden EV from the nut flush + straight potential. They're profitable UTG raises despite their raw strength.",
        source: "— Phil Galfond, Run It Once",
      },
      {
        tip: "KQo is a mixed open UTG in GTO solutions. The offsuit nature and multi-way unfavorability keeps it below a pure raise.",
        source: "— GTO+ Solver Output, 6-max 100bb",
      },
      {
        tip: "Avoid turning medium pairs (77–66) into pure open-raises from UTG. The flat/fold mix respects the cold-calling ranges behind you.",
        source: "— Doug Polk, Upswing Lab",
      },
    ],
    HJ: [
      {
        tip: "HJ can open around 20–22%. Add suited broadway hands and medium aces compared to UTG. Position improves marginally.",
        source: "— GTO Wizard, 6-max NLHE",
      },
      {
        tip: "Suited connectors like 98s, 87s gain playability from HJ due to fewer players left to act with strong ranges.",
        source: "— Run It Once Poker Training",
      },
      {
        tip: "AJo becomes a default open from HJ. The offsuit penalty is overcome by the stronger average holding from this position.",
        source: "— Upswing Poker Lab",
      },
    ],
    CO: [
      {
        tip: "CO opens approximately 26–28% in 6-max. You have position on the majority of postflop streets against most callers.",
        source: "— GTO Wizard, CO Strategy",
      },
      {
        tip: "Suited aces become pure opens from CO. The nut-flush potential and deceptive strength make them profitable at this position.",
        source: "— Fedor Holz, Pokercode",
      },
      {
        tip: "Small pocket pairs (33–44) enter the raising range from CO due to set-mining equity and the fold equity from C-bets.",
        source: "— PioSOLVER 6-max Solution",
      },
      {
        tip: "KJo, QJo become opens from CO. The positional advantage and playable postflop texture justify the weaker offsuit value.",
        source: "— Jonathan Little, Poker Coaching",
      },
    ],
    BTN: [
      {
        tip: "BTN is the most profitable seat in poker. Open 45–50% of hands in 6-max. You have position on every street vs the most players.",
        source: "— GTO Wizard, BTN Solutions",
      },
      {
        tip: "From BTN you can profitably open many suited hands down to one-gappers. The position premium outweighs the hand quality discount.",
        source: "— Tom Dwan, High Stakes Strategy",
      },
      {
        tip: "BTN can attack weak BB defenses aggressively. Track your opponent's defend frequency and adjust your opening range accordingly.",
        source: "— Upswing Poker Lab",
      },
      {
        tip: "Even weak suited hands (J6s, T5s) have opening value on BTN due to equity realization in position and steal opportunity vs tight blinds.",
        source: "— PioSOLVER BTN Analysis",
      },
    ],
    SB: [
      {
        tip: "SB is a unique position — wide range against BB only, but always OOP postflop. Raise/fold is preferred over limp in most GTO solutions.",
        source: "— GTO Wizard, SB Strategy",
      },
      {
        tip: "SB can open ~38–42% in 6-max with a raise/fold strategy. Limping is suboptimal in GTO solutions but can work exploitatively.",
        source: "— Phil Galfond, Run It Once",
      },
      {
        tip: "When BB is passive/tight, widen your SB opening range significantly. When BB is aggressive (3-bets a lot), tighten up and use more fold equity hands.",
        source: "— Upswing Poker Lab",
      },
    ],
    BB: [
      {
        tip: "BB gets the best pot odds to call. You should defend ~50–55% vs BTN opens to deny excessive fold equity.",
        source: "— GTO Wizard, BB Defense",
      },
      {
        tip: "BB 3-bet range should include both value (JJ+, AKs) and bluffs (A5s–A2s, small suited connectors) for balance.",
        source: "— GTO Wizard, BB 3-bet Solutions",
      },
      {
        tip: "Position doesn't change in BB. Your preflop calling range should account for playing OOP on all streets after calling.",
        source: "— PioSOLVER BB Analysis",
      },
      {
        tip: "BB vs SB: you can defend wider because SB's range is often polarized (wide raise/fold). Many marginal hands become profitable calls.",
        source: "— Run It Once Poker Training",
      },
    ],
  },
  mtt: {
    UTG: [
      {
        tip: "MTT UTG at 100bb plays very similar to cash game. ICM pressure starts mattering more in the final third of the tournament.",
        source: "— ICMizer, MTT Strategy",
      },
      {
        tip: "At 50bb, consider pot-committing yourself before opening. Many hands become shove/fold at this stack depth.",
        source: "— Jonathan Little, Tournament Poker",
      },
    ],
    CO: [
      {
        tip: "At 25bb stack depth, many opens are effectively all-in commitments. Simplify to a push/fold strategy from CO+.",
        source: "— ICMIZER Push/Fold Charts",
      },
    ],
    BTN: [
      {
        tip: "BTN at 25bb: shove with a wide range. ICM pressure reduces slightly because you're less likely to double through the entire field.",
        source: "— Holdem Resources Calculator",
      },
    ],
    SB: [
      {
        tip: "SB vs BB at short stacks: pure shove/fold. The mathematical edge of going all-in vs min-raise-fold is minimal, but push/fold is simpler to execute correctly.",
        source: "— GTO Wizard, MTT Short Stack",
      },
    ],
    BB: [
      {
        tip: "BB in MTT must account for ICM. Calling off a significant portion of your stack can be a tournament-ending error even with equity.",
        source: "— Jonathan Little, MTT Theory",
      },
    ],
  },
}

export const generalTips = [
  {
    tip: "Position is the single most important factor preflop. The later you act, the wider you can open and the more profitably you can defend.",
    source: "— GTO Wizard",
  },
  {
    tip: "Suited hands are worth approximately 2–3% more equity than offsuit equivalents when they connect with the board.",
    source: "— PioSOLVER Analysis",
  },
  {
    tip: "These ranges are GTO approximations. Against weaker players, exploit tendencies: fold more vs tight players, call less vs aggressive 3-bettors.",
    source: "— Phil Galfond, RIO Poker",
  },
  {
    tip: "Blockers matter in polarized spots. Hands with an Ace block the opponent's AA/AK combos, increasing the profitability of 3-bet bluffs.",
    source: "— GTO Wizard, Advanced Concepts",
  },
]
