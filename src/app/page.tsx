"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { Network, WalletCheckResponse } from "@/lib/metacomp";
import { truncateAddress, RISK_CONFIG } from "@/lib/metacomp";

import { NetworkSelector } from "@/components/dashboard/NetworkSelector";
import { WalletSearch } from "@/components/dashboard/WalletSearch";
import { RiskGauge } from "@/components/dashboard/RiskGauge";
import { ExposureChart } from "@/components/dashboard/ExposureChart";
import { FlowSummary } from "@/components/dashboard/FlowSummary";
import { VendorComparison } from "@/components/dashboard/VendorComparison";
import { RiskVerdict } from "@/components/dashboard/RiskVerdict";
import { ComplianceReport } from "@/components/dashboard/ComplianceReport";
import { TransactionTimeline } from "@/components/dashboard/TransactionTimeline";
import { TransactionSearch } from "@/components/dashboard/TransactionSearch";

import {
  Shield,
  ShieldAlert,
  Copy,
  Check,
  ChevronRight,
  Globe,
  Lock,
  Activity,
  BarChart3,
  Building2,
  FileSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [network, setNetwork] = useState<Network>("Ethereum");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<WalletCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const handleWalletSearch = useCallback(async (address: string) => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch("/api/metacomp/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ network, address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Wallet check failed");
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [network]);

  const handleCopyAddress = () => {
    if (results?.data?.address) {
      navigator.clipboard.writeText(results.data.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const riskConfig = results?.data?.level ? RISK_CONFIG[results.data.level] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 bg-grid">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/70 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Shield className="h-6 w-6 text-emerald-400" />
              <div className="absolute -inset-1 bg-emerald-400/10 rounded-full blur-md" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">
                MetaComp <span className="text-emerald-400">Vision X</span>
              </h1>
              <p className="text-[10px] text-slate-500 -mt-0.5">AML/KYT Compliance Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-500">
              <Lock className="h-3 w-3" />
              End-to-End Encrypted
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <Globe className="h-3 w-3" />
              Multi-Vendor Intel
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        {/* Search Section */}
        <div className="pt-8 pb-6">
          <div className="text-center mb-8">
            {!results && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Hero Shield */}
                <div className="relative inline-block mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-emerald-500/20 border border-emerald-500/20 flex items-center justify-center mx-auto">
                      <ShieldAlert className="h-10 w-10 text-emerald-400" />
                    </div>
                    <div className="absolute inset-0 bg-emerald-400/5 rounded-2xl blur-xl" />
                    {/* Orbiting dots */}
                    <motion.div
                      className="absolute w-2 h-2 bg-emerald-400/60 rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      style={{ top: -4, left: "50%", transformOrigin: "0 52px" }}
                    />
                    <motion.div
                      className="absolute w-1.5 h-1.5 bg-cyan-400/40 rounded-full"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                      style={{ top: -4, left: "50%", transformOrigin: "0 52px" }}
                    />
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                  Crypto Compliance <span className="text-emerald-400">Screening</span>
                </h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Multi-vendor AML/KYT risk assessment powered by Chainalysis, Beosin, Elliptic & Merkle Science
                </p>
              </motion.div>
            )}
          </div>

          {/* Search Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <NetworkSelector selected={network} onSelect={setNetwork} />
            <WalletSearch
              network={network}
              onSearch={handleWalletSearch}
              isLoading={isLoading}
            />
          </div>

          {/* Sample wallets */}
          {!results && !isLoading && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <span className="text-[10px] text-slate-600">Quick test:</span>
              {[
                { addr: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", label: "Uniswap V2", net: "Ethereum" as Network },
                { addr: "0x28C6c06298d514Db089934071355E5743bf21d60", label: "Low Risk", net: "Ethereum" as Network },
                { addr: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", label: "Bitcoin Severe", net: "Bitcoin" as Network },
              ].map((sample) => (
                <button
                  key={sample.addr}
                  onClick={() => {
                    setNetwork(sample.net);
                    handleWalletSearch(sample.addr);
                  }}
                  className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-800/50 border border-slate-700/50 text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Activity className="h-5 w-5 text-emerald-400" />
              </motion.div>
              <span className="text-sm text-slate-400">
                Screening wallet across 4 intelligence vendors...
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Skeleton className="h-64 bg-slate-800/50 rounded-xl" />
              <Skeleton className="h-64 bg-slate-800/50 rounded-xl" />
              <Skeleton className="h-64 bg-slate-800/50 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Skeleton className="h-48 bg-slate-800/50 rounded-xl" />
              <Skeleton className="h-48 bg-slate-800/50 rounded-xl" />
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center max-w-lg mx-auto"
          >
            <ShieldAlert className="h-8 w-8 text-red-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-red-400 mb-1">Screening Failed</h3>
            <p className="text-xs text-red-300/70">{error}</p>
          </motion.div>
        )}

        {/* Results Dashboard */}
        <AnimatePresence>
          {results?.data && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Result Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg border",
                    riskConfig?.bg, riskConfig?.border
                  )}>
                    {results.data.level === "Severe" || results.data.level === "High" ? (
                      <ShieldAlert className={cn("h-5 w-5", riskConfig?.text)} />
                    ) : (
                      <Shield className={cn("h-5 w-5", riskConfig?.text)} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-slate-300">
                        {truncateAddress(results.data.address, 10)}
                      </span>
                      <button
                        onClick={handleCopyAddress}
                        className="p-1 rounded hover:bg-slate-800 transition-colors"
                      >
                        {copied ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-slate-500" />
                        )}
                      </button>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px]", riskConfig?.bg, riskConfig?.border, riskConfig?.text)}
                      >
                        {results.data.level} Risk
                      </Badge>
                    </div>
                    <span className="text-[10px] text-slate-600">{results.data.network} Network</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setResults(null);
                    setError(null);
                  }}
                  className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                >
                  New Search
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1 h-auto">
                  <TabsTrigger
                    value="overview"
                    className="text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 gap-1.5"
                  >
                    <Activity className="h-3.5 w-3.5" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="exposure"
                    className="text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 gap-1.5"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    Exposure
                  </TabsTrigger>
                  <TabsTrigger
                    value="vendors"
                    className="text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 gap-1.5"
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    Vendors
                  </TabsTrigger>
                  <TabsTrigger
                    value="transactions"
                    className="text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 gap-1.5"
                  >
                    <FileSearch className="h-3.5 w-3.5" />
                    Transactions
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Overview */}
                <TabsContent value="overview" className="tab-enter mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Risk Gauge */}
                    <div className="lg:col-span-4">
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                        <RiskGauge level={results.data.level} />
                      </div>
                    </div>

                    {/* Flow Summary */}
                    <div className="lg:col-span-4">
                      <FlowSummary extra={results.data.extra} />
                    </div>

                    {/* Risk Verdict */}
                    <div className="lg:col-span-4 space-y-4">
                      <RiskVerdict level={results.data.level} />
                      <ComplianceReport data={results.data} />
                    </div>
                  </div>

                  {/* Transaction Timeline (if available) */}
                  {results.data.extra.tx && results.data.extra.tx.length > 0 && (
                    <div className="mt-4">
                      <TransactionTimeline transactions={results.data.extra.tx} />
                    </div>
                  )}
                </TabsContent>

                {/* Tab 2: Exposure */}
                <TabsContent value="exposure" className="tab-enter mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <ExposureChart
                      title="Direct Incoming Exposure"
                      items={results.data.extra.directIncoming}
                    />
                    <ExposureChart
                      title="Direct Outgoing Exposure"
                      items={results.data.extra.directOutgoing}
                    />
                    <ExposureChart
                      title="Indirect Incoming Exposure"
                      items={results.data.extra.incomingDirectExposure}
                    />
                    <ExposureChart
                      title="Indirect Outgoing Exposure"
                      items={results.data.extra.outgoingDirectExposure}
                    />
                  </div>

                  {/* Risk Breakdown Summary */}
                  <div className="mt-4 bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">Risk Exposure Summary</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <RiskBreakdownCard
                        label="Incoming Total"
                        total={results.data.extra.incomingRiskExposureBreakdown.totalAmount}
                        highRisk={results.data.extra.incomingRiskExposureBreakdown.highRiskAmount}
                        lowRisk={results.data.extra.incomingRiskExposureBreakdown.lowRiskAmount}
                      />
                      <RiskBreakdownCard
                        label="Outgoing Total"
                        total={results.data.extra.outgoingRiskExposureBreakdown.totalAmount}
                        highRisk={results.data.extra.outgoingRiskExposureBreakdown.highRiskAmount}
                        lowRisk={results.data.extra.outgoingRiskExposureBreakdown.lowRiskAmount}
                      />
                    </div>
                  </div>

                  {/* High Risk Categories */}
                  {results.data.extra.highRiskCategories.length > 0 && (
                    <div className="mt-4 bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                      <h3 className="text-sm font-semibold text-slate-300 mb-4">
                        High-Risk Categories ({results.data.extra.highRiskCategories.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {results.data.extra.highRiskCategories.map((cat, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-400"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Tab 3: Vendors */}
                <TabsContent value="vendors" className="tab-enter mt-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-slate-300 mb-1">
                      Cross-Vendor Intelligence Comparison
                    </h3>
                    <p className="text-xs text-slate-500">
                      Side-by-side risk assessment from 4 leading blockchain analytics platforms
                    </p>
                  </div>
                  <VendorComparison
                    vendors={[
                      results.data.extra.chainalysis,
                      results.data.extra.vendor1,
                      results.data.extra.vendor2,
                      results.data.extra.vendor3,
                    ]}
                  />
                </TabsContent>

                {/* Tab 4: Transaction Check */}
                <TabsContent value="transactions" className="tab-enter mt-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-slate-300 mb-1">
                      Transaction Risk Screening
                    </h3>
                    <p className="text-xs text-slate-500">
                      Screen individual transactions for risk indicators and compliance violations
                    </p>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <TransactionSearch network={network} />
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="text-[10px] text-slate-600">
            MetaComp Vision X — Enterprise Crypto Compliance Platform
          </div>
          <div className="text-[10px] text-slate-700">
            Powered by Chainalysis · Beosin · Elliptic · Merkle Science
          </div>
        </div>
      </footer>
    </div>
  );
}

function RiskBreakdownCard({
  label,
  total,
  highRisk,
  lowRisk,
}: {
  label: string;
  total: number;
  highRisk: number;
  lowRisk: number;
}) {
  const pct = total > 0 ? (highRisk / total) * 100 : 0;

  return (
    <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-4">
      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">{label}</div>
      <div className="text-lg font-mono font-bold text-slate-200 mb-3">
        ${total >= 1e6 ? `${(total / 1e6).toFixed(2)}M` : total >= 1e3 ? `${(total / 1e3).toFixed(1)}K` : total.toFixed(2)}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-emerald-400">Low Risk</span>
          <span className="text-emerald-400 font-mono">
            ${lowRisk >= 1e6 ? `${(lowRisk / 1e6).toFixed(2)}M` : lowRisk >= 1e3 ? `${(lowRisk / 1e3).toFixed(1)}K` : lowRisk.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-red-400">High Risk</span>
          <span className="text-red-400 font-mono">
            ${highRisk >= 1e6 ? `${(highRisk / 1e6).toFixed(2)}M` : highRisk >= 1e3 ? `${(highRisk / 1e3).toFixed(1)}K` : highRisk.toFixed(2)}
          </span>
        </div>
      </div>
      <div className="mt-3 h-2 bg-slate-700/30 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-700"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="text-[10px] text-slate-600 mt-1 text-right">{pct.toFixed(1)}% high-risk</div>
    </div>
  );
}
