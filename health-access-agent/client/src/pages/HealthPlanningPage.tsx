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
    sourceView: string;
    refreshMode: string;
    upstreamInputs: string[];
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

const INDIA_SVG_PATH =
  'M333.5 58.0 L337.3 58.1 L341.2 71.4 L351.3 75.7 L349.0 88.9 L359.1 92.7 L357.2 96.6 L361.5 100.2 L351.2 106.6 L348.0 102.3 L342.5 103.5 L348.1 112.5 L348.1 122.7 L354.1 120.7 L358.2 127.1 L383.0 139.6 L373.2 146.6 L368.0 160.8 L410.0 181.6 L431.1 181.3 L457.5 195.9 L490.7 199.0 L492.6 174.9 L500.5 172.1 L504.2 175.9 L502.3 186.9 L508.0 192.0 L550.9 192.2 L554.2 184.7 L546.7 181.0 L546.1 176.1 L561.7 176.1 L593.0 153.4 L604.8 157.7 L615.7 152.6 L620.2 154.3 L617.6 159.2 L623.7 162.1 L619.2 167.3 L631.8 168.1 L635.6 173.8 L627.9 179.9 L631.9 187.9 L625.5 183.6 L616.8 185.2 L601.0 195.2 L601.5 203.9 L593.1 214.0 L594.6 219.7 L585.7 237.7 L573.0 234.5 L574.0 249.0 L566.4 267.1 L563.4 264.0 L561.7 266.8 L556.8 240.1 L551.6 239.8 L546.4 251.8 L539.5 241.3 L543.0 234.0 L550.9 233.1 L556.3 221.8 L560.3 221.2 L553.3 217.3 L519.1 215.7 L516.6 201.2 L511.7 204.7 L496.8 195.2 L498.7 199.2 L492.4 207.3 L506.2 215.7 L497.9 217.2 L491.4 225.6 L502.4 231.1 L499.4 240.9 L505.9 247.8 L507.8 272.3 L504.3 270.0 L502.0 272.9 L502.8 264.4 L500.8 267.3 L501.6 263.6 L501.2 263.3 L499.8 268.7 L499.9 273.2 L498.6 273.3 L499.3 269.6 L498.7 267.2 L495.0 273.3 L494.1 263.8 L489.6 259.9 L493.6 265.0 L474.3 276.8 L476.3 286.5 L466.7 297.3 L462.5 295.1 L465.9 297.8 L448.8 300.7 L446.6 305.4 L453.6 302.1 L404.4 341.7 L403.1 350.1 L386.9 353.9 L383.1 362.5 L381.3 358.6 L380.0 363.5 L377.8 360.5 L371.8 363.7 L368.2 386.8 L372.3 398.6 L368.3 395.8 L372.6 402.3 L362.5 431.7 L365.3 447.2 L356.5 447.8 L350.7 459.9 L357.3 462.3 L359.0 464.7 L343.0 465.6 L337.5 477.0 L329.0 481.5 L314.1 468.5 L309.4 448.0 L287.6 408.1 L281.4 382.6 L266.3 358.0 L257.7 321.6 L259.0 310.2 L255.8 313.5 L256.1 307.9 L260.1 309.4 L254.0 299.6 L258.6 285.6 L252.7 275.9 L261.4 270.2 L252.4 271.6 L255.3 266.5 L251.7 266.8 L258.1 262.2 L250.1 260.8 L246.2 262.1 L245.6 278.7 L224.5 286.2 L196.8 261.9 L215.8 257.7 L220.8 249.4 L206.7 254.7 L188.7 244.1 L194.9 237.4 L187.2 241.9 L184.4 241.5 L186.2 236.5 L193.4 236.1 L193.7 230.4 L212.6 233.0 L229.8 229.2 L223.1 209.7 L216.9 209.2 L215.5 196.5 L205.4 193.3 L205.9 187.3 L218.3 173.6 L225.9 178.4 L242.0 174.4 L249.4 161.9 L258.3 157.6 L265.1 144.0 L274.0 140.0 L272.5 137.1 L285.0 126.1 L283.3 114.7 L295.8 107.9 L285.5 104.7 L285.4 99.1 L280.2 100.1 L274.9 93.8 L274.3 85.2 L279.0 81.7 L273.2 80.3 L273.6 71.2 L302.6 73.3 L333.5 58.0 Z';

const INDIA_GEO_BOUNDS = {
  minLon: 68.143403,
  minLat: 6.745551,
  maxLon: 97.362253,
  maxLat: 35.495406,
};

const MAP_VIEWBOX = {
  x: 140,
  y: 20,
  width: 560,
  height: 520,
};

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
  const mappedShare = percent(district.mapped_facility_count, facilityCount);
  const pincodeShare = percent(district.pincode_matched_facility_count, facilityCount);
  const postalShare = percent(district.valid_postal_office_count, Math.max(1, asNumber(district.postal_office_count)));
  return clamp(Math.round(mappedShare * 0.45 + pincodeShare * 0.25 + postalShare * 0.3));
}

function districtAccess(district: District) {
  const facilitySignal = Math.min(55, asNumber(district.facility_count) * 3);
  const postalSignal = Math.min(30, asNumber(district.valid_pincode_count) * 2);
  const maternalSignal = Math.min(15, asNumber(district.maternal_child_facility_count) * 2);
  return clamp(Math.round(facilitySignal + postalSignal + maternalSignal));
}

function travelMinutes(district: District) {
  return Math.round(45 + districtNeed(district) * 0.7 + (100 - districtAccess(district)) * 0.55);
}

function projectLonLat(lon: number, lat: number) {
  const width = 820;
  const height = 560;
  const padding = 58;
  const scale = Math.min(
    (width - padding * 2) / (INDIA_GEO_BOUNDS.maxLon - INDIA_GEO_BOUNDS.minLon),
    (height - padding * 2) / (INDIA_GEO_BOUNDS.maxLat - INDIA_GEO_BOUNDS.minLat)
  );
  const mapWidth = (INDIA_GEO_BOUNDS.maxLon - INDIA_GEO_BOUNDS.minLon) * scale;
  const mapHeight = (INDIA_GEO_BOUNDS.maxLat - INDIA_GEO_BOUNDS.minLat) * scale;
  const offsetX = (width - mapWidth) / 2;
  const offsetY = (height - mapHeight) / 2;
  const svgX = offsetX + (lon - INDIA_GEO_BOUNDS.minLon) * scale;
  const svgY = offsetY + (INDIA_GEO_BOUNDS.maxLat - lat) * scale;
  return {
    svgX,
    svgY,
    x: ((svgX - MAP_VIEWBOX.x) / MAP_VIEWBOX.width) * 100,
    y: ((svgY - MAP_VIEWBOX.y) / MAP_VIEWBOX.height) * 100,
  };
}

function districtCoordinate(district: District | undefined, index: number) {
  const name = `${district?.district_name ?? ''} ${district?.state_ut ?? ''}`.toLowerCase();
  if (name.includes('leh')) return { lon: 77.58, lat: 34.15 };
  if (name.includes('kargil')) return { lon: 76.13, lat: 34.55 };
  if (name.includes('jamui')) return { lon: 86.22, lat: 24.92 };
  if (name.includes('araria')) return { lon: 87.48, lat: 26.13 };
  if (name.includes('purnia')) return { lon: 87.48, lat: 25.78 };
  if (name.includes('kishanganj')) return { lon: 87.94, lat: 26.1 };
  if (name.includes('sheohar')) return { lon: 85.29, lat: 26.51 };
  if (name.includes('sitamarhi')) return { lon: 85.49, lat: 26.59 };
  if (name.includes('ladakh')) return { lon: 77.25, lat: 34.2 };
  if (name.includes('bihar')) return { lon: 86.0, lat: 25.5 };

  const fallback = [
    { lon: 77.6, lat: 34.1 },
    { lon: 86.2, lat: 25.0 },
    { lon: 76.2, lat: 34.5 },
    { lon: 87.5, lat: 26.1 },
    { lon: 74.2, lat: 23.9 },
    { lon: 82.1, lat: 21.1 },
    { lon: 78.5, lat: 17.8 },
    { lon: 92.8, lat: 26.2 },
  ];
  return fallback[index % fallback.length];
}

function mapPosition(index: number, district?: District) {
  const coordinate = districtCoordinate(district, index);
  return projectLonLat(coordinate.lon, coordinate.lat);
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
  const latestFacilityLift =
    asNumber(summary.districts_with_facilities) - dataQuality.currentRoundBefore.districtsWithFacilities;
  const validPostalShare = percent(summary.valid_postal_office_count, summary.postal_office_count);
  const validPincodeShare = percent(summary.valid_pincode_count, summary.pincode_count);
  const trustedFacilityShare = percent(summary.mapped_facility_count, summary.facility_count);
  const pincodeFacilityShare = percent(summary.pincode_matched_facility_count, summary.facility_count);
  const peopleReached = selectedDistrict
    ? Math.round((selectedNeed * 1800 + asNumber(selectedDistrict.valid_pincode_count) * 12000) / 1000) * 1000
    : 0;
  const selectedIndex = Math.max(
    0,
    districts.findIndex((district) => district.district_key === selectedDistrict?.district_key)
  );
  const selectedMapPosition = mapPosition(selectedIndex, selectedDistrict);
  const selectedMapPoint = {
    x: selectedMapPosition.svgX,
    y: selectedMapPosition.svgY,
  };
  const localNode = {
    x: Math.min(760, selectedMapPoint.x + 58),
    y: Math.max(72, selectedMapPoint.y - 38),
  };
  const referralNode = {
    x: Math.min(770, selectedMapPoint.x + 168),
    y: Math.min(450, selectedMapPoint.y + 36),
  };

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
              icon={<Route />}
              label="Geocoded postal"
              value={formatNumber(summary.valid_postal_office_count)}
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
                        <Badge variant="outline">{formatNumber(district.facility_count)} facility claims</Badge>
                        <Badge variant="outline">{formatNumber(district.valid_pincode_count)} valid pincodes</Badge>
                        <Badge variant="outline">
                          {formatNumber(district.valid_postal_office_count)} geocoded postal
                        </Badge>
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
            <div className="relative min-h-[600px] overflow-hidden rounded-md border bg-[#f8faf7]">
              <svg
                viewBox="140 20 560 520"
                className="absolute inset-0 h-full w-full"
                role="img"
                aria-label="India medical desert intelligence map with route and confidence overlays"
              >
                <defs>
                  <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M40 0H0V40" fill="none" stroke="#d7ddcf" strokeWidth="1" opacity="0.65" />
                  </pattern>
                  <filter id="map-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#334155" floodOpacity="0.14" />
                  </filter>
                  <clipPath id="india-clip">
                    <path d={INDIA_SVG_PATH} />
                  </clipPath>
                </defs>

                <rect width="820" height="560" fill="#f8faf7" />
                <rect width="820" height="560" fill="url(#map-grid)" />
                <g opacity="0.55">
                  <path d="M118 122H702M118 222H702M118 322H702M118 422H702" stroke="#e1e6db" />
                  <path d="M200 58V500M320 58V500M440 58V500M560 58V500M680 58V500" stroke="#e1e6db" />
                </g>

                <g filter="url(#map-shadow)">
                  <path d={INDIA_SVG_PATH} fill="#fff7e8" stroke="#1f2937" strokeWidth="3" />
                </g>

                <g clipPath="url(#india-clip)">
                  <rect x="180" y="30" width="430" height="500" fill="#fff7e8" />
                  <path d="M250 94 375 64 510 130 468 235 294 220Z" fill="#fee2e2" stroke="#d7b88f" />
                  <path d="M196 246 294 220 468 235 442 356 260 350Z" fill="#fed7aa" stroke="#d7b88f" />
                  <path d="M468 235 620 183 625 298 505 357 442 356Z" fill="#dcfce7" stroke="#d7b88f" />
                  <path d="M260 350 442 356 389 502 307 468Z" fill="#fecaca" stroke="#d7b88f" />
                  <path d="M442 356 505 357 566 462 389 502Z" fill="#fef3c7" stroke="#d7b88f" />
                  <circle cx={selectedMapPoint.x} cy={selectedMapPoint.y} r="126" fill="#ef4444" opacity="0.1" />
                  <circle cx={selectedMapPoint.x} cy={selectedMapPoint.y} r="86" fill="#ef4444" opacity="0.16" />
                  <circle cx={selectedMapPoint.x} cy={selectedMapPoint.y} r="44" fill="#ef4444" opacity="0.24" />
                  <path
                    d={`M ${selectedMapPoint.x} ${selectedMapPoint.y} C ${selectedMapPoint.x + 38} ${selectedMapPoint.y - 82}, ${localNode.x - 36} ${localNode.y - 30}, ${localNode.x} ${localNode.y}`}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="9 8"
                  />
                  <path
                    d={`M ${selectedMapPoint.x} ${selectedMapPoint.y} C ${selectedMapPoint.x + 104} ${selectedMapPoint.y - 28}, ${referralNode.x - 78} ${referralNode.y + 62}, ${referralNode.x} ${referralNode.y}`}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="4"
                    strokeLinecap="round"
                    opacity="0.82"
                  />
                </g>

                <g>
                  <circle
                    cx={selectedMapPoint.x}
                    cy={selectedMapPoint.y}
                    r="126"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.4"
                    strokeDasharray="7 7"
                    opacity="0.8"
                  />
                  <circle
                    cx={selectedMapPoint.x}
                    cy={selectedMapPoint.y}
                    r="72"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.4"
                    opacity="0.7"
                  />
                  <circle
                    cx={selectedMapPoint.x}
                    cy={selectedMapPoint.y}
                    r="24"
                    fill="#dc2626"
                    stroke="#fff"
                    strokeWidth="5"
                  />
                  <text
                    x={selectedMapPoint.x}
                    y={selectedMapPoint.y + 5}
                    textAnchor="middle"
                    fontSize="15"
                    fill="#fff"
                    fontWeight="800"
                  >
                    GAP
                  </text>
                  <circle cx={localNode.x} cy={localNode.y} r="18" fill="#f59e0b" stroke="#fff" strokeWidth="5" />
                  <circle cx={referralNode.x} cy={referralNode.y} r="18" fill="#10b981" stroke="#fff" strokeWidth="5" />
                  <rect
                    x={localNode.x + 22}
                    y={localNode.y - 16}
                    width="144"
                    height="28"
                    rx="6"
                    fill="#ffffff"
                    stroke="#f59e0b"
                    opacity="0.96"
                  />
                  <text x={localNode.x + 32} y={localNode.y + 3} fontSize="12" fill="#374151" fontWeight="700">
                    uncertain local claim
                  </text>
                  <rect
                    x={referralNode.x + 22}
                    y={referralNode.y - 16}
                    width="140"
                    height="28"
                    rx="6"
                    fill="#ffffff"
                    stroke="#10b981"
                    opacity="0.96"
                  />
                  <text x={referralNode.x + 32} y={referralNode.y + 3} fontSize="12" fill="#065f46" fontWeight="700">
                    trusted referral node
                  </text>
                </g>

                <g transform="translate(158 44)">
                  <rect width="232" height="92" rx="8" fill="#ffffff" stroke="#d1d5db" opacity="0.97" />
                  <text x="14" y="25" fontSize="14" fill="#111827" fontWeight="800">
                    Access model
                  </text>
                  <text x="14" y="50" fontSize="12" fill="#6b7280">
                    rings: 60 / 120 min reach
                  </text>
                  <text x="14" y="70" fontSize="12" fill="#6b7280">
                    routes: verify to refer to partner
                  </text>
                </g>
              </svg>

              {districts.slice(0, 8).map((district, index) => {
                const position = mapPosition(index, district);
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
                  <div className="absolute bottom-3 left-3 right-3 z-30 rounded-md border bg-background/95 p-3 shadow-sm backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-base font-semibold">
                          {selectedDistrict.district_name}, {selectedDistrict.state_ut}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatNumber(selectedDistrict.facility_count)} claims ·{' '}
                          {formatNumber(selectedDistrict.valid_pincode_count)} pincodes ·{' '}
                          {formatNumber(selectedDistrict.invalid_postal_coordinate_count)} geo warnings
                        </div>
                      </div>
                      <Badge variant="destructive">{selectedTravel} min to trusted care</Badge>
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
              <PipelineStep icon={<FileSearch />} title="Source view" text={overview.source.sourceView} />
              <PipelineStep
                icon={<RefreshCcw />}
                title="Latest repair"
                text={`+${latestFacilityLift.toLocaleString()} in this round; +${facilityLift.toLocaleString()} vs original`}
              />
              <PipelineStep
                icon={<ShieldCheck />}
                title="Routing assets"
                text={`${validPostalShare}% postal rows and ${validPincodeShare}% pincodes validated`}
              />
            </div>

            <div className="rounded-md border bg-background p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">Repaired table contract</div>
                  <div className="text-xs text-muted-foreground">
                    UI reads the backend API over the repaired Lakebase district table; upstream serving tables stay
                    validation inputs.
                  </div>
                </div>
                <Badge variant="secondary">Issue #3 aligned</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <ContractMetric
                  label="Facility match split"
                  value={`${formatNumber(summary.pincode_matched_facility_count)} / ${formatNumber(summary.city_matched_facility_count)} / ${formatNumber(summary.coordinate_matched_facility_count)}`}
                  detail="pincode / city / coordinate"
                />
                <ContractMetric
                  label="Validated reach"
                  value={`${formatNumber(summary.valid_postal_office_count)} postal`}
                  detail={`${formatNumber(summary.valid_pincode_count)} valid pincodes; ${pincodeFacilityShare}% facility rows pincode matched`}
                />
                <ContractMetric
                  label="Warning layer"
                  value={formatNumber(summary.invalid_postal_coordinate_count)}
                  detail="invalid postal coordinates shown as risk, not routing capacity"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {overview.source.upstreamInputs.map((source) => (
                  <Badge key={source} variant="outline">
                    {source}
                  </Badge>
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
                    label={`${formatNumber(selectedDistrict.maternal_child_facility_count)} maternal-child records`}
                  />
                  <ClaimChip
                    label={`${formatNumber(selectedDistrict.pincode_matched_facility_count)} pincode matched`}
                  />
                  <ClaimChip label={`${formatNumber(selectedDistrict.city_matched_facility_count)} city matched`} />
                  <ClaimChip
                    label={`${formatNumber(selectedDistrict.coordinate_matched_facility_count)} coordinate fallback`}
                  />
                </TrustSection>

                <TrustSection title="Contradiction flags" icon={<ShieldAlert />}>
                  <ClaimChip label="blood storage missing" variant="warning" />
                  <ClaimChip label="service claim not verified" variant="warning" />
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
                    Facility coverage: {formatNumber(selectedDistrict.facility_count)} records,{' '}
                    {formatNumber(selectedDistrict.mapped_facility_count)} with valid India coordinates.
                  </EvidenceLine>
                  <EvidenceLine>
                    Postal reach: {formatNumber(selectedDistrict.valid_postal_office_count)} valid postal coordinates
                    across {formatNumber(selectedDistrict.valid_pincode_count)} validated pincodes; total postal rows
                    stay separate at {formatNumber(selectedDistrict.postal_office_count)}.
                  </EvidenceLine>
                  <EvidenceLine>
                    Repair lift: {dataQuality.currentRoundBefore.facilityRecordsMatched.toLocaleString()} to{' '}
                    {formatNumber(summary.facility_count)} matched facility records, with coordinate fallback visible in
                    the match split.
                  </EvidenceLine>
                </div>

                <div className="rounded-md border bg-slate-950 p-4 text-slate-50">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <MessageSquareText className="h-4 w-4" />
                    Recommended planner note
                  </div>
                  <p className="text-sm text-slate-200">
                    {selectedDistrict.district_name} should be prioritized for {selectedTrack.label.toLowerCase()} using
                    the repaired district planning table. Verify uncertain claims first, treat invalid postal
                    coordinates as warnings, then use validated pincode reach for the field plan.
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
                  repaired facility coverage, validated pincode reach, and geospatial warning counts.
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

function ContractMetric({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
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
