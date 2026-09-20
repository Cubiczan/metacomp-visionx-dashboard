// ============================================================
// Row 20 — evidence-carrying deterministic confidence scoring.
// Capped factors + band; every factor names the evidence it was
// derived from. Pure function: no I/O, no model, no randomness.
// Reversal condition (matrix row 20) does NOT fire here: the
// compliance report renders detailed evidence to a human, so the
// scaffolding pays off.
// ============================================================

export interface ConfidenceFactor {
  /** Human-readable factor name. */
  name: string;
  /** Points awarded (already capped at `cap`). */
  points: number;
  /** Maximum points this factor can contribute. */
  cap: number;
  /** Verbatim evidence the points were derived from. */
  evidence: string;
}

export type ConfidenceBand = "CLEAR" | "PARTIAL" | "LOW";

export interface ReportConfidence {
  score: number;
  band: ConfidenceBand;
  factors: ConfidenceFactor[];
}

export interface ReportEvidenceInput {
  /** Upstream risk level, e.g. "Low" | "Medium" | "High" | "Severe". */
  level: string | undefined;
  /** How many of the 4 vendor platforms report a platform alert, 0..4. */
  vendorAlertCoverage: number;
  /** Incoming and outgoing risk-exposure breakdowns are present. */
  hasFlowBreakdown: boolean;
  /** Number of transactions in the analysis sample. */
  transactionSampleSize: number;
  /** Earliest/latest transaction timestamps are present. */
  timeCoveragePresent: boolean;
}

const LEVEL_CAP = 30;
const VENDOR_ALERT_CAP = 25;
const FLOW_BREAKDOWN_CAP = 20;
const TX_SAMPLE_CAP = 15;
const TIME_COVERAGE_CAP = 10;

export function scoreReportConfidence(input: ReportEvidenceInput): ReportConfidence {
  const factors: ConfidenceFactor[] = [
    {
      name: "Risk level",
      cap: LEVEL_CAP,
      points: input.level ? LEVEL_CAP : 0,
      evidence: input.level ? `level=${input.level}` : "level absent from upstream response",
    },
    {
      name: "Vendor alert coverage",
      cap: VENDOR_ALERT_CAP,
      points: Math.round((input.vendorAlertCoverage / 4) * VENDOR_ALERT_CAP),
      evidence: `${input.vendorAlertCoverage}/4 vendor platforms report alerts`,
    },
    {
      name: "Risk-flow breakdown",
      cap: FLOW_BREAKDOWN_CAP,
      points: input.hasFlowBreakdown ? FLOW_BREAKDOWN_CAP : 0,
      evidence: input.hasFlowBreakdown
        ? "incoming/outgoing exposure breakdowns present"
        : "exposure breakdown absent",
    },
    {
      name: "Transaction sample",
      cap: TX_SAMPLE_CAP,
      points: input.transactionSampleSize > 0 ? TX_SAMPLE_CAP : 0,
      evidence: `${input.transactionSampleSize} transactions in analysis sample`,
    },
    {
      name: "Time coverage",
      cap: TIME_COVERAGE_CAP,
      points: input.timeCoveragePresent ? TIME_COVERAGE_CAP : 0,
      evidence: input.timeCoveragePresent
        ? "earliest/latest transaction times present"
        : "transaction time coverage absent",
    },
  ];

  const score = factors.reduce((sum, f) => sum + f.points, 0);
  const band: ConfidenceBand = score >= 80 ? "CLEAR" : score >= 50 ? "PARTIAL" : "LOW";
  return { score, band, factors };
}

/** Count vendor platforms that report any platform-level alert. */
export function vendorAlertCoverage(
  platforms: Array<{ platformWalletAlert?: { hasAlert?: boolean; hasDirectAlert?: boolean } }>,
): number {
  return platforms.filter(
    (p) => p.platformWalletAlert?.hasAlert || p.platformWalletAlert?.hasDirectAlert,
  ).length;
}
