import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Badge, Card, CardContent, CardHeader, CardTitle, Progress } from '@databricks/appkit-ui/react';
import {
  BadgeCheck,
  Building2,
  Database,
  HeartPulse,
  MapPin,
  RefreshCcw,
  Route,
  SearchCheck,
  ShieldCheck,
  Sparkles,
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
    };
    fixes: RepairStep[];
  };
  source: {
    syncedTable: string;
    refreshMode: string;
  };
}

function asNumber(value: string | number | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

export function HealthPlanningPage() {
  const { error, loading, overview } = useOverview();
  const [selectedDistrictKey, setSelectedDistrictKey] = useState('');

  const districts = useMemo(() => overview?.priorities ?? [], [overview]);
  const selectedDistrict = useMemo(
    () => districts.find((district) => district.district_key === selectedDistrictKey) ?? districts[0],
    [districts, selectedDistrictKey]
  );

  if (loading) {
    return (
      <div className="mx-auto grid w-full max-w-[1500px] gap-5">
        <div className="h-48 animate-pulse rounded-md border bg-muted/50" />
        <div className="h-96 animate-pulse rounded-md border bg-muted/40" />
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
  const districtCount = asNumber(summary.district_count);
  const facilityLift = asNumber(summary.districts_with_facilities) - dataQuality.before.districtsWithFacilities;
  const postalLift = asNumber(summary.districts_with_postal) - dataQuality.before.districtsWithPostal;
  const currentFacilityLift =
    asNumber(summary.districts_with_facilities) - dataQuality.currentRoundBefore.districtsWithFacilities;
  const currentFacilityRecordLift =
    asNumber(summary.facility_count) - dataQuality.currentRoundBefore.facilityRecordsMatched;

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5">
      <section className="grid gap-5 border-b pb-5 xl:grid-cols-[minmax(0,1fr)_520px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Live Lakebase demo</Badge>
            <Badge variant="outline">Data repair applied</Badge>
          </div>
          <div className="space-y-2">
            <h2 className="max-w-5xl text-3xl font-semibold tracking-normal text-foreground md:text-4xl">
              CareGap Planner
            </h2>
            <p className="max-w-4xl text-base text-muted-foreground">
              District health priorities with repaired geography matching, pincode-backed asset counts, and visible data
              coverage warnings.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Kpi icon={<MapPin />} label="Districts" value={formatNumber(summary.district_count)} />
            <Kpi icon={<HeartPulse />} label="High need" value={formatNumber(summary.high_need_districts)} />
            <Kpi icon={<Database />} label="Avg need" value={asNumber(summary.avg_need_score).toFixed(1)} />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCcw className="h-5 w-5" />
              Coverage after repair
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <RepairProgress
              after={asNumber(summary.districts_with_facilities)}
              before={dataQuality.before.districtsWithFacilities}
              icon={<Building2 />}
              label="Districts with facility coverage"
              lift={facilityLift}
              total={districtCount}
            />
            <RepairProgress
              after={asNumber(summary.districts_with_postal)}
              before={dataQuality.before.districtsWithPostal}
              icon={<Route />}
              label="Districts with postal coverage"
              lift={postalLift}
              total={districtCount}
            />
            <div className="grid grid-cols-3 gap-3">
              <MiniKpi label="Facilities matched" value={formatNumber(summary.facility_count)} />
              <MiniKpi label="Valid mapped" value={formatNumber(summary.mapped_facility_count)} />
              <MiniKpi label="Pincodes" value={formatNumber(summary.pincode_count)} />
            </div>
            <div className="grid gap-3 rounded-md border bg-muted/30 p-3 sm:grid-cols-2">
              <DeltaKpi
                label="This round: facility districts"
                value={formatNumber(summary.districts_with_facilities)}
                delta={`+${currentFacilityLift.toLocaleString()}`}
              />
              <DeltaKpi
                label="This round: facility records"
                value={formatNumber(summary.facility_count)}
                delta={`+${currentFacilityRecordLift.toLocaleString()}`}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)_430px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Data repair ledger
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dataQuality.fixes.map((fix, index) => (
              <div key={fix.title} className="rounded-md border bg-muted/30 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Badge variant="secondary">{index + 1}</Badge>
                  {fix.title}
                </div>
                <div className="text-sm text-muted-foreground">{fix.detail}</div>
              </div>
            ))}
            <div className="rounded-md border p-3 text-xs text-muted-foreground">
              <div className="mb-1 font-medium text-foreground">Applied view</div>
              <div className="break-words">{dataQuality.repairedView}</div>
              <div className="mt-2 font-medium text-foreground">Repo SQL</div>
              <div>{dataQuality.repairSql}</div>
            </div>
            <div className="rounded-md border bg-background p-3">
              <div className="mb-3 text-sm font-semibold">Current round before and after</div>
              <div className="grid gap-2 text-xs text-muted-foreground">
                <LedgerLine
                  after={formatNumber(summary.facility_count)}
                  before={dataQuality.currentRoundBefore.facilityRecordsMatched.toLocaleString()}
                  label="Matched facility records"
                />
                <LedgerLine
                  after={formatNumber(summary.coordinate_matched_facility_count)}
                  before={dataQuality.currentRoundBefore.coordinateMatchedFacilities.toLocaleString()}
                  label="Coordinate fallback matches"
                />
                <LedgerLine
                  after={formatNumber(summary.valid_postal_office_count)}
                  before={dataQuality.currentRoundBefore.validPostalOfficeCoordinatesSurfaced.toLocaleString()}
                  label="Valid postal coordinates surfaced"
                />
                <LedgerLine
                  after={formatNumber(summary.invalid_postal_coordinate_count)}
                  before={dataQuality.currentRoundBefore.invalidPostalCoordinateWarnings.toLocaleString()}
                  label="Invalid postal coordinates flagged"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <SearchCheck className="h-5 w-5" />
                District queue
              </CardTitle>
              <Badge variant="outline">{overview.source.refreshMode}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {districts.map((district, index) => {
                const selected = selectedDistrict?.district_key === district.district_key;
                return (
                  <button
                    key={district.district_key}
                    className={`grid grid-cols-[40px_minmax(0,1fr)] gap-3 rounded-md border p-3 text-left transition ${
                      selected ? 'border-primary bg-muted' : 'bg-background hover:border-foreground/40'
                    }`}
                    onClick={() => setSelectedDistrictKey(district.district_key)}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground">
                        {district.district_name}, {district.state_ut}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Need score {asNumber(district.composite_need_score).toFixed(1)} with{' '}
                        {formatNumber(district.facility_count)} facility records and{' '}
                        {formatNumber(district.valid_postal_office_count)} geocoded postal offices.
                      </div>
                    </div>
                    <div className="col-span-2 grid grid-cols-3 gap-2 text-xs sm:col-start-2 sm:col-span-1">
                      <MiniStat label="Need" value={asNumber(district.composite_need_score)} />
                      <MiniStat label="Facilities" value={asNumber(district.facility_count)} />
                      <MiniStat label="Geo postal" value={asNumber(district.valid_postal_office_count)} />
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Evidence brief
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDistrict ? (
              <>
                <div>
                  <div className="text-lg font-semibold">
                    {selectedDistrict.district_name}, {selectedDistrict.state_ut}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Priority driven by NFHS-5 need indicators plus repaired local asset coverage.
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <SignalTile label="Anaemia" value={asNumber(selectedDistrict.all_w15_49_who_are_anaemic_pct)} />
                  <SignalTile
                    label="Institutional births"
                    value={asNumber(selectedDistrict.institutional_birth_5y_pct)}
                  />
                  <SignalTile
                    label="Insurance"
                    value={asNumber(selectedDistrict.hh_member_covered_health_insurance_pct)}
                  />
                  <SignalTile
                    label="Screening"
                    value={asNumber(selectedDistrict.women_age_30_49_years_ever_undergone_a_cervical_screen_pct)}
                  />
                </div>
                <div className="space-y-2">
                  <EvidenceLine>
                    {formatNumber(selectedDistrict.facility_count)} facility records matched after geography repair.
                  </EvidenceLine>
                  <EvidenceLine>
                    {formatNumber(selectedDistrict.mapped_facility_count)} matched facility records have valid India
                    coordinates.
                  </EvidenceLine>
                  <EvidenceLine>
                    {formatNumber(selectedDistrict.coordinate_matched_facility_count)} facility records were assigned
                    through the pincode-derived district geography fallback.
                  </EvidenceLine>
                  <EvidenceLine>
                    {formatNumber(selectedDistrict.valid_postal_office_count)} of{' '}
                    {formatNumber(selectedDistrict.postal_office_count)} postal offices have valid coordinates across{' '}
                    {formatNumber(selectedDistrict.valid_pincode_count)} validated pincodes.
                  </EvidenceLine>
                  <EvidenceLine>
                    {formatNumber(selectedDistrict.invalid_postal_coordinate_count)} postal rows are retained for counts
                    but flagged out of geospatial planning.
                  </EvidenceLine>
                </div>
                <div className="rounded-md border bg-amber-950/10 p-3 text-sm text-muted-foreground">
                  Remaining zeroes are shown as coverage warnings, not as proof that services do not exist.
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No district selected.</div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        {label}
      </div>
      <div className="text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

function MiniKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}

function DeltaKpi({ delta, label, value }: { delta: string; label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-lg font-semibold text-foreground">{value}</span>
        <Badge variant="secondary">{delta}</Badge>
      </div>
    </div>
  );
}

function LedgerLine({ after, before, label }: { after: string; before: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2">
      <span>{label}</span>
      <span className="shrink-0 font-medium text-foreground">{`${before} -> ${after}`}</span>
    </div>
  );
}

function RepairProgress({
  after,
  before,
  icon,
  label,
  lift,
  total,
}: {
  after: number;
  before: number;
  icon: ReactNode;
  label: string;
  lift: number;
  total: number;
}) {
  return (
    <div className="rounded-md border p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
          {label}
        </div>
        <Badge variant="secondary">+{lift.toLocaleString()} districts</Badge>
      </div>
      <div className="mb-2 flex items-end gap-2">
        <div className="text-2xl font-semibold">{after.toLocaleString()}</div>
        <div className="pb-1 text-sm text-muted-foreground">was {before.toLocaleString()}</div>
      </div>
      <Progress value={percent(after, total)} />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 text-muted-foreground">{label}</div>
      <div className="font-semibold text-foreground">{Math.round(value).toLocaleString()}</div>
    </div>
  );
}

function SignalTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value.toFixed(1)}%</div>
      <Progress value={value} className="mt-2" />
    </div>
  );
}

function EvidenceLine({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
      <span>{children}</span>
    </div>
  );
}
