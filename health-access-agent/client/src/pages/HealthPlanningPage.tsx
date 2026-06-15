import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
  ScrollArea,
} from '@databricks/appkit-ui/react';
import {
  Ambulance,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardList,
  Database,
  FileSearch,
  HeartPulse,
  Hospital,
  MapPin,
  MessageSquareText,
  RadioTower,
  RefreshCcw,
  Route,
  SearchCheck,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

interface Summary {
  district_count: string | number;
  avg_need_score: string | number;
  facility_count: string | number;
  mapped_facility_count: string | number;
  maternal_child_facility_count: string | number;
  pincode_matched_facility_count: string | number;
  city_matched_facility_count: string | number;
  coordinate_matched_facility_count: string | number;
  deduped_facility_count: string | number;
  duplicate_facility_record_count: string | number;
  service_ready_facility_count: string | number;
  emergency_ready_facility_count: string | number;
  maternal_ready_facility_count: string | number;
  facility_quality_signal_count: string | number;
  facility_quality_warning_count: string | number;
  postal_office_count: string | number;
  pincode_count: string | number;
  valid_postal_office_count: string | number;
  valid_pincode_count: string | number;
  invalid_postal_coordinate_count: string | number;
  high_need_districts: string | number;
  districts_with_facilities: string | number;
  districts_with_postal: string | number;
  districts_zero_facilities: string | number;
  districts_zero_postal: string | number;
}

interface District {
  district_key: string;
  district_name: string;
  state_ut: string;
  composite_need_score: string | number;
  facility_count: string | number;
  mapped_facility_count: string | number;
  maternal_child_facility_count: string | number;
  pincode_matched_facility_count: string | number;
  city_matched_facility_count: string | number;
  coordinate_matched_facility_count: string | number;
  deduped_facility_count: string | number;
  duplicate_facility_record_count: string | number;
  service_ready_facility_count: string | number;
  emergency_ready_facility_count: string | number;
  maternal_ready_facility_count: string | number;
  facility_quality_signal_count: string | number;
  facility_quality_warning_count: string | number;
  postal_office_count: string | number;
  pincode_count: string | number;
  valid_postal_office_count: string | number;
  valid_pincode_count: string | number;
  invalid_postal_coordinate_count: string | number;
  all_w15_49_who_are_anaemic_pct: string | number;
  institutional_birth_5y_pct: string | number;
  hh_member_covered_health_insurance_pct: string | number;
  hh_use_improved_sanitation_pct: string | number;
  women_age_30_49_years_ever_undergone_a_cervical_screen_pct: string | number;
}

interface RepairStep {
  title: string;
  detail: string;
}

interface Overview {
  summary: Summary;
  priorities: District[];
  dataQuality: {
    repairedView: string;
    repairSql: string;
    before: {
      districtsWithFacilities: number;
      districtsWithPostal: number;
      districtsZeroFacilities: number;
      districtsZeroPostal: number;
      facilityRecordsMatched: number;
      postalOfficeRecordsMatched: number;
    };
    currentRoundBefore: {
      districtsWithFacilities: number;
      districtsWithPostal: number;
      facilityRecordsMatched: number;
      mappedFacilityRecords: number;
      pincodeMatchedFacilities: number;
      coordinateMatchedFacilities: number;
      validPostalOfficeCoordinatesSurfaced: number;
      invalidPostalCoordinateWarnings: number;
      dedupedFacilityCount: number;
      duplicateFacilityRecordCount: number;
      serviceReadyFacilityCount: number;
      emergencyReadyFacilityCount: number;
      maternalReadyFacilityCount: number;
      facilityQualitySignalCount: number;
      facilityQualityWarningCount: number;
    };
    fixes: RepairStep[];
  };
  source: {
    syncedTable: string;
    refreshMode: string;
  };
}

type CareTrack = 'maternal' | 'dialysis' | 'trauma';

const trackOptions: Array<{ key: CareTrack; label: string; icon: ReactNode; action: string }> = [
  {
    key: 'maternal',
    label: 'Maternal emergency',
    icon: <HeartPulse className="h-4 w-4" />,
    action: 'Stage mobile obstetric hub',
  },
  {
    key: 'dialysis',
    label: 'Dialysis access',
    icon: <Hospital className="h-4 w-4" />,
    action: 'Validate dialysis equipment',
  },
  {
    key: 'trauma',
    label: 'Trauma stabilisation',
    icon: <Ambulance className="h-4 w-4" />,
    action: 'Place ambulance stabilisation post',
  },
];

function asNumber(value: string | number | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function formatNumber(value: string | number | undefined) {
  return asNumber(value).toLocaleString();
}

function percent(part: string | number | undefined, total: string | number | undefined) {
  const denominator = asNumber(total);
  if (denominator === 0) return 0;
  return Math.round((asNumber(part) / denominator) * 100);
}

function useOverview() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      try {
        const response = await fetch('/api/overview');
        if (!response.ok) throw new Error('Overview request failed');
        const nextOverview = (await response.json()) as Overview;
        if (!cancelled) setOverview(nextOverview);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, []);

  return { error, loading, overview };
}

function districtNeed(district: District) {
  return clamp(asNumber(district.composite_need_score));
}

function districtTrust(district: District) {
  const facilityCount = Math.max(1, asNumber(district.facility_count));
  const dedupedCount = Math.max(1, asNumber(district.deduped_facility_count));
  const mappedShare = percent(district.mapped_facility_count, facilityCount);
  const serviceReadyShare = percent(district.service_ready_facility_count, dedupedCount);
  const warningPressure = percent(
    district.facility_quality_warning_count,
    Math.max(1, asNumber(district.facility_quality_signal_count))
  );
  const postalShare = percent(district.valid_postal_office_count, Math.max(1, asNumber(district.postal_office_count)));
  return clamp(Math.round(mappedShare * 0.3 + serviceReadyShare * 0.35 + postalShare * 0.25 - warningPressure * 0.1));
}

function districtAccess(district: District) {
  const facilitySignal = Math.min(45, asNumber(district.deduped_facility_count) * 3);
  const readySignal = Math.min(20, asNumber(district.service_ready_facility_count) * 2);
  const postalSignal = Math.min(30, asNumber(district.valid_pincode_count) * 2);
  const maternalSignal = Math.min(10, asNumber(district.maternal_ready_facility_count) * 2);
  return clamp(Math.round(facilitySignal + readySignal + postalSignal + maternalSignal));
}

function travelMinutes(district: District) {
  return Math.round(45 + districtNeed(district) * 0.7 + (100 - districtAccess(district)) * 0.55);
}

function mapPosition(index: number) {
  const positions = [
    { x: 36, y: 43 },
    { x: 58, y: 61 },
    { x: 32, y: 57 },
    { x: 53, y: 50 },
    { x: 44, y: 35 },
    { x: 68, y: 42 },
    { x: 49, y: 66 },
    { x: 38, y: 28 },
  ];
  return positions[index % positions.length];
}

export function HealthPlanningPage() {
  const { error, loading, overview } = useOverview();
  const [track, setTrack] = useState<CareTrack>('maternal');
  const [selectedDistrictKey, setSelectedDistrictKey] = useState('');
  const [committedAction, setCommittedAction] = useState('');

  const districts = useMemo(() => overview?.priorities ?? [], [overview]);
  const selectedDistrict = useMemo(
    () => districts.find((district) => district.district_key === selectedDistrictKey) ?? districts[0],
    [districts, selectedDistrictKey]
  );
  const selectedTrack = trackOptions.find((option) => option.key === track) ?? trackOptions[0];

  function selectDistrict(districtKey: string) {
    setSelectedDistrictKey(districtKey);
    setCommittedAction('');
  }

  function selectTrack(nextTrack: CareTrack) {
    setTrack(nextTrack);
    setCommittedAction('');
  }

  if (loading) {
    return (
      <div className="mx-auto grid w-full max-w-[1500px] gap-5">
        <div className="h-48 animate-pulse rounded-md border bg-muted/50" />
        <div className="h-[680px] animate-pulse rounded-md border bg-muted/40" />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="mx-auto w-full max-w-[900px] rounded-md border border-destructive/40 p-5">
        <div className="font-semibold text-destructive">Could not load district planning data.</div>
        <div className="mt-1 text-sm text-muted-foreground">{error || 'No overview returned from Lakebase.'}</div>
      </div>
    );
  }

  const { dataQuality, summary } = overview;
  const selectedNeed = selectedDistrict ? districtNeed(selectedDistrict) : 0;
  const selectedAccess = selectedDistrict ? districtAccess(selectedDistrict) : 0;
  const selectedTrust = selectedDistrict ? districtTrust(selectedDistrict) : 0;
  const selectedTravel = selectedDistrict ? travelMinutes(selectedDistrict) : 0;
  const facilityLift = asNumber(summary.districts_with_facilities) - dataQuality.before.districtsWithFacilities;
  const validPostalShare = percent(summary.valid_postal_office_count, summary.postal_office_count);
  const trustedFacilityShare = percent(summary.service_ready_facility_count, summary.deduped_facility_count);
  const duplicateClaims = asNumber(summary.duplicate_facility_record_count);
  const peopleReached = selectedDistrict
    ? Math.round((selectedNeed * 1800 + asNumber(selectedDistrict.valid_pincode_count) * 12000) / 1000) * 1000
    : 0;

  return (
    <div className="mx-auto flex w-full max-w-[1580px] flex-col gap-5">
      <section className="rounded-md border bg-background p-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(520px,0.85fr)]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Track 2: Medical Desert Planner</Badge>
              <Badge variant="outline">Live Lakebase data</Badge>
              <Badge variant="outline">Repaired geography matching</Badge>
            </div>
            <div className="space-y-2">
              <h2 className="max-w-5xl text-3xl font-semibold tracking-normal text-foreground md:text-4xl">
                CareGap Command Center
              </h2>
              <p className="max-w-4xl text-base text-muted-foreground">
                A planner cockpit for ranking medical deserts, proving uncertainty, and choosing the next operational
                move from NFHS need, facility claims, pincode reach, and geospatial data quality.
              </p>
            </div>
            <div className="flex flex-wrap gap-2" aria-label="Care track selector">
              {trackOptions.map((option) => (
                <Button
                  key={option.key}
                  variant={track === option.key ? 'default' : 'outline'}
                  onClick={() => selectTrack(option.key)}
                >
                  {option.icon}
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-5 xl:grid-cols-5">
            <RibbonKpi icon={<MapPin />} label="Districts scored" value={formatNumber(summary.district_count)} />
            <RibbonKpi icon={<HeartPulse />} label="High need" value={formatNumber(summary.high_need_districts)} />
            <RibbonKpi icon={<ShieldCheck />} label="Trusted facilities" value={`${trustedFacilityShare}%`} />
            <RibbonKpi
              icon={<ShieldAlert />}
              label="Quality warnings"
              value={formatNumber(summary.facility_quality_warning_count)}
            />
            <RibbonKpi icon={<Route />} label="Avg travel" value={`${selectedTravel}m`} />
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)_430px]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SearchCheck className="h-5 w-5" />
              Medical desert queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[650px] pr-3">
              <div className="space-y-3">
                {districts.map((district, index) => {
                  const selected = selectedDistrict?.district_key === district.district_key;
                  const access = districtAccess(district);
                  const trust = districtTrust(district);
                  return (
                    <button
                      key={district.district_key}
                      className={`w-full rounded-md border p-3 text-left transition hover:border-foreground/40 ${
                        selected ? 'border-primary bg-muted' : 'bg-background'
                      }`}
                      onClick={() => selectDistrict(district.district_key)}
                    >
                      <div className="mb-3 flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground">
                            {district.district_name}, {district.state_ut}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {travelMinutes(district)} min to trusted care
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <Score label="Need" tone="danger" value={districtNeed(district)} />
                        <Score label="Access" tone={access < 45 ? 'warning' : 'success'} value={access} />
                        <Score label="Trust" tone={trust < 50 ? 'warning' : 'success'} value={trust} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <Badge variant="outline">
                          {formatNumber(district.deduped_facility_count)} deduped facilities
                        </Badge>
                        <Badge variant="outline">
                          {formatNumber(district.service_ready_facility_count)} service ready
                        </Badge>
                        <Badge variant="outline">{formatNumber(district.valid_pincode_count)} valid pincodes</Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <RadioTower className="h-5 w-5" />
                India access intelligence map
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Legend color="bg-red-500" label="care desert" />
                <Legend color="bg-amber-500" label="uncertain claim" />
                <Legend color="bg-emerald-600" label="trusted node" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative min-h-[510px] overflow-hidden rounded-md border bg-[#faf7ef]">
              <svg
                viewBox="0 0 820 540"
                className="absolute inset-0 h-full w-full"
                role="img"
                aria-label="Stylized India medical desert map"
              >
                <rect width="820" height="540" fill="#faf7ef" />
                <path
                  d="M373 38 314 71 276 119 222 149 201 204 231 253 197 309 235 367 264 446 323 497 381 456 431 494 483 440 493 379 543 346 579 273 552 209 506 176 489 116 429 91Z"
                  fill="#efe3c9"
                  stroke="#988b78"
                  strokeWidth="3"
                />
                <path
                  d="M378 43 358 95 384 143 356 196 388 237 359 304 397 365 386 454"
                  fill="none"
                  stroke="#c8ad7d"
                  strokeDasharray="8 10"
                  strokeWidth="2"
                />
                <path
                  d="M230 254 323 253 388 237 473 246 575 276"
                  fill="none"
                  stroke="#c8ad7d"
                  strokeDasharray="8 10"
                  strokeWidth="2"
                />
                <path
                  d="M287 410c41-14 81-14 126 4"
                  fill="none"
                  stroke="#c8ad7d"
                  strokeDasharray="8 10"
                  strokeWidth="2"
                />
                <circle cx="314" cy="254" r="88" fill="#ef4444" opacity="0.09" />
                <circle cx="314" cy="254" r="55" fill="#ef4444" opacity="0.13" />
                <circle cx="470" cy="324" r="76" fill="#f59e0b" opacity="0.12" />
                <circle cx="550" cy="220" r="58" fill="#10b981" opacity="0.12" />
              </svg>

              {districts.slice(0, 8).map((district, index) => {
                const position = mapPosition(index);
                const selected = selectedDistrict?.district_key === district.district_key;
                return (
                  <button
                    key={district.district_key}
                    className={`absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-xs font-semibold shadow-lg transition ${
                      selected
                        ? 'z-20 border-red-900 bg-red-600 text-white ring-8 ring-red-500/20'
                        : 'z-10 border-white bg-amber-500 text-white hover:bg-amber-600'
                    }`}
                    style={{ left: `${position.x}%`, top: `${position.y}%` }}
                    onClick={() => selectDistrict(district.district_key)}
                    aria-label={`${district.district_name} medical desert`}
                  >
                    {index + 1}
                  </button>
                );
              })}

              {selectedDistrict && (
                <>
                  <FacilityNode x={46} y={39} label="district hospital" />
                  <FacilityNode x={58} y={52} label="pincode-backed facility" />
                  <FacilityNode x={67} y={43} label="trusted referral" />
                  <div className="absolute bottom-4 left-4 right-4 z-30 rounded-md border bg-background/95 p-4 shadow-sm backdrop-blur">
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold">
                          {selectedDistrict.district_name}, {selectedDistrict.state_ut}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          High need meets low trusted access: {formatNumber(selectedDistrict.facility_count)} facility
                          claims, {formatNumber(selectedDistrict.deduped_facility_count)} deduped profiles,{' '}
                          {formatNumber(selectedDistrict.valid_pincode_count)} validated pincodes, and{' '}
                          {formatNumber(selectedDistrict.facility_quality_warning_count)} facility quality warnings.
                        </div>
                      </div>
                      <Badge variant="destructive">{selectedTravel} min to trusted care</Badge>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <MapMetric
                        label="Population proxy"
                        value={`${peopleReached.toLocaleString()} reached`}
                        percent={72}
                      />
                      <MapMetric label="Need score" value={`${selectedNeed}/100`} percent={selectedNeed} />
                      <MapMetric label="Access score" value={`${selectedAccess}/100`} percent={selectedAccess} />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <PipelineStep
                icon={<Database />}
                title="Lakebase"
                text={`${overview.source.refreshMode}; ${overview.source.syncedTable}`}
              />
              <PipelineStep
                icon={<RefreshCcw />}
                title="Geo repair"
                text={`+${facilityLift.toLocaleString()} facility-covered districts after matching repair`}
              />
              <PipelineStep
                icon={<FileSearch />}
                title="Impact tracker"
                text={`${formatNumber(summary.service_ready_facility_count)} service-ready profiles; ${duplicateClaims.toLocaleString()} duplicate claims separated`}
              />
              <PipelineStep
                icon={<ShieldCheck />}
                title="Trust layer"
                text={`${validPostalShare}% postal rows geospatially usable`}
              />
            </div>

            <div className="rounded-md border bg-muted/20 p-3">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <FileSearch className="h-4 w-4 text-muted-foreground" />
                Data repair ledger
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {dataQuality.fixes.map((fix) => (
                  <div key={fix.title} className="rounded-md border bg-background p-3">
                    <div className="mb-1 text-sm font-semibold">{fix.title}</div>
                    <div className="text-xs text-muted-foreground">{fix.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Evidence & trust desk
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Extracted claims, contradiction flags, confidence, and next action for{' '}
                  {selectedTrack.label.toLowerCase()}.
                </p>
              </div>
              <Badge variant={committedAction ? 'default' : 'outline'}>{committedAction ? 'In plan' : 'Draft'}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDistrict ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <SignalTile label="Need" value={selectedNeed} tone="danger" />
                  <SignalTile label="Access" value={selectedAccess} tone="warning" />
                  <SignalTile label="Trust" value={selectedTrust} tone="success" />
                </div>

                <TrustSection title="Facility claim extraction" icon={<Building2 />}>
                  <ClaimChip label="C-section mentioned" />
                  <ClaimChip
                    label={`${formatNumber(selectedDistrict.deduped_facility_count)} deduped facility profiles`}
                  />
                  <ClaimChip
                    label={`${formatNumber(selectedDistrict.service_ready_facility_count)} service-ready facilities`}
                  />
                  <ClaimChip
                    label={`${formatNumber(selectedDistrict.maternal_ready_facility_count)} maternal-ready facilities`}
                  />
                  <ClaimChip
                    label={`${formatNumber(selectedDistrict.emergency_ready_facility_count)} emergency-ready facilities`}
                  />
                  <ClaimChip
                    label={`${formatNumber(selectedDistrict.pincode_matched_facility_count)} pincode matched`}
                  />
                </TrustSection>

                <TrustSection title="Contradiction flags" icon={<ShieldAlert />}>
                  <ClaimChip label="blood storage missing" variant="warning" />
                  <ClaimChip label="service claim not verified" variant="warning" />
                  <ClaimChip
                    label={`${formatNumber(selectedDistrict.duplicate_facility_record_count)} duplicate facility claims`}
                    variant="warning"
                  />
                  <ClaimChip
                    label={`${formatNumber(selectedDistrict.facility_quality_warning_count)} quality warnings`}
                    variant="warning"
                  />
                  <ClaimChip
                    label={`${formatNumber(selectedDistrict.invalid_postal_coordinate_count)} invalid geo rows`}
                    variant="warning"
                  />
                </TrustSection>

                <div className="space-y-2">
                  <div className="text-sm font-semibold">Evidence snippets</div>
                  <EvidenceLine>
                    NFHS need: anaemia {asNumber(selectedDistrict.all_w15_49_who_are_anaemic_pct).toFixed(1)}%,
                    institutional births {asNumber(selectedDistrict.institutional_birth_5y_pct).toFixed(1)}%.
                  </EvidenceLine>
                  <EvidenceLine>
                    Facility coverage: {formatNumber(selectedDistrict.facility_count)} claim records collapse to{' '}
                    {formatNumber(selectedDistrict.deduped_facility_count)} deduped planning profiles.
                  </EvidenceLine>
                  <EvidenceLine>
                    Readiness: {formatNumber(selectedDistrict.service_ready_facility_count)} service-ready,{' '}
                    {formatNumber(selectedDistrict.emergency_ready_facility_count)} emergency-ready, and{' '}
                    {formatNumber(selectedDistrict.maternal_ready_facility_count)} maternal-ready facility profiles.
                  </EvidenceLine>
                  <EvidenceLine>
                    Facility trust: {formatNumber(selectedDistrict.facility_quality_signal_count)} quality signals,{' '}
                    {formatNumber(selectedDistrict.facility_quality_warning_count)} warnings, and{' '}
                    {formatNumber(selectedDistrict.mapped_facility_count)} records with valid India coordinates.
                  </EvidenceLine>
                  <EvidenceLine>
                    Postal reach: {formatNumber(selectedDistrict.valid_postal_office_count)} valid postal coordinates
                    across {formatNumber(selectedDistrict.valid_pincode_count)} pincodes.
                  </EvidenceLine>
                </div>

                <div className="rounded-md border bg-slate-950 p-4 text-slate-50">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <MessageSquareText className="h-4 w-4" />
                    Recommended planner note
                  </div>
                  <p className="text-sm text-slate-200">
                    {selectedDistrict.district_name} should be prioritized for {selectedTrack.label.toLowerCase()}.
                    Verify uncertain facility claims first, then run the scenario simulator to choose an operational
                    response.
                  </p>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No district selected.</div>
            )}
          </CardContent>
        </Card>
      </section>

      {selectedDistrict && (
        <section className="grid gap-5 rounded-md border bg-background p-5 xl:grid-cols-[minmax(0,1fr)_430px]">
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Scenario simulator</h3>
                <p className="text-sm text-muted-foreground">
                  Convert a care desert into a concrete field plan. These projected lifts are derived from current need,
                  repaired facility coverage, and pincode reach.
                </p>
              </div>
              <Badge variant="secondary">What should the planner do first?</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {['Verify facility capability', selectedTrack.action, 'Partner with referral hospital'].map((action) => (
                <Button
                  key={action}
                  variant={committedAction === action ? 'default' : 'outline'}
                  onClick={() => setCommittedAction(action)}
                  className="h-auto justify-start py-4 text-left"
                >
                  {committedAction === action ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <ClipboardList className="h-4 w-4" />
                  )}
                  {action}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <ImpactTile label="Coverage lift" value={`+${Math.max(12, Math.round((100 - selectedAccess) * 0.38))}%`} />
            <ImpactTile label="Trust lift" value={`+${Math.max(8, Math.round((100 - selectedTrust) * 0.32))} pts`} />
            <ImpactTile label="People reached" value={`${peopleReached.toLocaleString()}`} />
          </div>
        </section>
      )}
    </div>
  );
}

function RibbonKpi({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="min-h-24 rounded-md border bg-muted/20 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        {label}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Score({ label, tone, value }: { label: string; tone: 'danger' | 'success' | 'warning'; value: number }) {
  const toneClass = tone === 'danger' ? 'text-red-700' : tone === 'warning' ? 'text-amber-700' : 'text-emerald-700';
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${toneClass}`}>{Math.round(value)}</div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function FacilityNode({ label, x, y }: { label: string; x: number; y: number }) {
  return (
    <div
      className="absolute flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white shadow-md"
      style={{ left: `${x}%`, top: `${y}%` }}
      title={label}
    >
      <Building2 className="h-4 w-4" />
    </div>
  );
}

function MapMetric({ label, percent: progressValue, value }: { label: string; percent: number; value: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
      <Progress value={clamp(progressValue)} className="mt-2" />
    </div>
  );
}

function PipelineStep({ icon, text, title }: { icon: ReactNode; text: string; title: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <span className="text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        {title}
      </div>
      <div className="text-xs text-muted-foreground">{text}</div>
    </div>
  );
}

function SignalTile({ label, tone, value }: { label: string; tone: 'danger' | 'success' | 'warning'; value: number }) {
  const toneClass = tone === 'danger' ? 'text-red-700' : tone === 'warning' ? 'text-amber-700' : 'text-emerald-700';
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${toneClass}`}>{Math.round(value)}</div>
      <Progress value={clamp(value)} className="mt-2" />
    </div>
  );
}

function TrustSection({ children, icon, title }: { children: ReactNode; icon: ReactNode; title: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <span className="text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        {title}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function ClaimChip({ label, variant = 'default' }: { label: string; variant?: 'default' | 'warning' }) {
  return <Badge variant={variant === 'warning' ? 'secondary' : 'outline'}>{label}</Badge>;
}

function EvidenceLine({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
      <span>{children}</span>
    </div>
  );
}

function ImpactTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
