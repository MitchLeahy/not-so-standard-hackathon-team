import type { Application } from 'express';

interface AppKitWithLakebase {
  lakebase: {
    query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
  };
  server: {
    extend(fn: (app: Application) => void): void;
  };
}

const DISTRICT_COLUMNS = `
  district_key,
  trim(district_name) AS district_name,
  trim(state_ut) AS state_ut,
  composite_need_score,
  facility_count,
  mapped_facility_count,
  maternal_child_facility_count,
  pincode_matched_facility_count,
  city_matched_facility_count,
  coordinate_matched_facility_count,
  deduped_facility_count,
  duplicate_facility_record_count,
  service_ready_facility_count,
  emergency_ready_facility_count,
  maternal_ready_facility_count,
  facility_quality_signal_count,
  facility_quality_warning_count,
  postal_office_count,
  pincode_count,
  valid_postal_office_count,
  valid_pincode_count,
  invalid_postal_coordinate_count,
  households_surveyed,
  women_15_49_interviewed,
  hh_improved_water_pct,
  hh_use_improved_sanitation_pct,
  households_using_clean_fuel_for_cooking_pct,
  hh_member_covered_health_insurance_pct,
  women_age_15_49_who_are_literate_pct,
  women_age_15_49_with_10_or_more_years_of_schooling_pct,
  institutional_birth_5y_pct,
  institutional_birth_in_public_facility_5y_pct,
  births_attended_by_skilled_hp_5y_10_pct,
  prev_diarrhoea_2wk_child_u5_pct,
  children_prev_symptoms_of_acute_respiratory_infection_ari_2_pct,
  women_age_15_49_years_whose_bmi_bmi_is_underweight_bmi_lt_1_pct,
  all_w15_49_who_are_anaemic_pct,
  w15_plus_with_high_bp_sys_gte_140_mmhg_and_or_dia_gte_90_mm_pct,
  m15_plus_with_high_bp_sys_gte_140_mmhg_and_or_dia_gte_90_mm_pct,
  women_age_30_49_years_ever_undergone_a_cervical_screen_pct,
  w15_plus_who_use_any_kind_of_tobacco_pct,
  m15_plus_who_use_any_kind_of_tobacco_pct
`;

function asNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function interventionPlan(row: Record<string, unknown>) {
  const score = asNumber(row.composite_need_score);
  const anemia = asNumber(row.all_w15_49_who_are_anaemic_pct);
  const institutionalBirth = asNumber(row.institutional_birth_5y_pct);
  const insurance = asNumber(row.hh_member_covered_health_insurance_pct);
  const sanitation = asNumber(row.hh_use_improved_sanitation_pct);
  const water = asNumber(row.hh_improved_water_pct);
  const screening = asNumber(row.women_age_30_49_years_ever_undergone_a_cervical_screen_pct);
  const facilities = asNumber(row.facility_count);
  const dedupedFacilities = asNumber(row.deduped_facility_count);
  const serviceReadyFacilities = asNumber(row.service_ready_facility_count);
  const emergencyReadyFacilities = asNumber(row.emergency_ready_facility_count);
  const maternalReadyFacilities = asNumber(row.maternal_ready_facility_count);
  const mappedFacilities = asNumber(row.mapped_facility_count);
  const postalOffices = asNumber(row.postal_office_count);

  const focusAreas: string[] = [];
  if (anemia >= 55) focusAreas.push('anaemia outreach for women 15-49');
  if (institutionalBirth < 75) focusAreas.push('safe-delivery and referral coverage');
  if (insurance < 35) focusAreas.push('health insurance enrollment');
  if (sanitation < 70 || water < 85) focusAreas.push('WASH risk reduction');
  if (screening < 15) focusAreas.push('cervical and breast screening activation');

  const deliveryAssets: string[] = [];
  if (facilities > 0) deliveryAssets.push(`${facilities} known facility record${facilities === 1 ? '' : 's'}`);
  if (dedupedFacilities > 0) {
    deliveryAssets.push(
      `${dedupedFacilities} deduped facility profile${dedupedFacilities === 1 ? '' : 's'} for planning`
    );
  }
  if (serviceReadyFacilities > 0) {
    deliveryAssets.push(
      `${serviceReadyFacilities} service-ready facility profile${serviceReadyFacilities === 1 ? '' : 's'}`
    );
  }
  if (emergencyReadyFacilities > 0) {
    deliveryAssets.push(
      `${emergencyReadyFacilities} emergency-readiness signal${emergencyReadyFacilities === 1 ? '' : 's'}`
    );
  }
  if (maternalReadyFacilities > 0) {
    deliveryAssets.push(
      `${maternalReadyFacilities} maternal or child-health readiness signal${maternalReadyFacilities === 1 ? '' : 's'}`
    );
  }
  if (mappedFacilities > 0) {
    deliveryAssets.push(
      `${mappedFacilities} facility record${mappedFacilities === 1 ? '' : 's'} with valid India coordinates`
    );
  }
  if (postalOffices > 0) {
    deliveryAssets.push(`${postalOffices} postal office record${postalOffices === 1 ? '' : 's'} for last-mile routing`);
  }
  if (deliveryAssets.length === 0)
    deliveryAssets.push('limited local facility/geography coverage in the supplied data');

  const urgency = score >= 50 ? 'High' : score >= 42 ? 'Elevated' : 'Watch';

  return {
    urgency,
    headline: `${urgency} need: prioritize ${focusAreas[0] ?? 'basic service access'} in ${text(row.district_name)}, ${text(row.state_ut)}.`,
    focusAreas,
    deliveryAssets,
    evidence: [
      `Composite need score ${score.toFixed(1)} from NFHS-5 district indicators.`,
      `Anaemia among women 15-49: ${anemia.toFixed(1)}%.`,
      `Institutional births: ${institutionalBirth.toFixed(1)}%.`,
      `Households with a member covered by health insurance: ${insurance.toFixed(1)}%.`,
      `Facility and postal counts use the repaired geography crosswalk and pincode-assisted matching view.`,
      `Deduped and readiness counts are derived from cluster IDs, normalized facility identity, service fields, contact fields, staffing/capacity, and trust signals.`,
    ],
    caveat:
      'Remaining zero counts are still coverage warnings, not proof that a district has no facilities or postal offices.',
  };
}

export async function setupHealthPlanningRoutes(appkit: AppKitWithLakebase) {
  try {
    const result = await appkit.lakebase.query('SELECT COUNT(*) AS row_count FROM public.district_planning');
    const rowCount = result.rows[0]?.row_count;
    const rowCountText =
      typeof rowCount === 'string' || typeof rowCount === 'number' || typeof rowCount === 'boolean'
        ? String(rowCount)
        : 'unknown';
    console.log(`[health-planning] public.district_planning rows: ${rowCountText}`);
  } catch (err) {
    console.warn('[health-planning] Lakebase district_planning check failed:', (err as Error).message);
    console.warn('[health-planning] The synced table may still be provisioning or the app SP may need SELECT grants.');
  }

  appkit.server.extend((app) => {
    app.get('/api/overview', async (_req, res) => {
      try {
        const [summary, states, priorities] = await Promise.all([
          appkit.lakebase.query(`
            SELECT
              COUNT(*) AS district_count,
              ROUND(AVG(composite_need_score)::numeric, 2) AS avg_need_score,
              SUM(facility_count) AS facility_count,
              SUM(mapped_facility_count) AS mapped_facility_count,
              SUM(maternal_child_facility_count) AS maternal_child_facility_count,
              SUM(pincode_matched_facility_count) AS pincode_matched_facility_count,
              SUM(city_matched_facility_count) AS city_matched_facility_count,
              SUM(coordinate_matched_facility_count) AS coordinate_matched_facility_count,
              SUM(deduped_facility_count) AS deduped_facility_count,
              SUM(duplicate_facility_record_count) AS duplicate_facility_record_count,
              SUM(service_ready_facility_count) AS service_ready_facility_count,
              SUM(emergency_ready_facility_count) AS emergency_ready_facility_count,
              SUM(maternal_ready_facility_count) AS maternal_ready_facility_count,
              SUM(facility_quality_signal_count) AS facility_quality_signal_count,
              SUM(facility_quality_warning_count) AS facility_quality_warning_count,
              SUM(postal_office_count) AS postal_office_count,
              SUM(pincode_count) AS pincode_count,
              SUM(valid_postal_office_count) AS valid_postal_office_count,
              SUM(valid_pincode_count) AS valid_pincode_count,
              SUM(invalid_postal_coordinate_count) AS invalid_postal_coordinate_count,
              SUM(CASE WHEN composite_need_score >= 50 THEN 1 ELSE 0 END) AS high_need_districts,
              SUM(CASE WHEN facility_count > 0 THEN 1 ELSE 0 END) AS districts_with_facilities,
              SUM(CASE WHEN postal_office_count > 0 THEN 1 ELSE 0 END) AS districts_with_postal,
              SUM(CASE WHEN facility_count = 0 THEN 1 ELSE 0 END) AS districts_zero_facilities,
              SUM(CASE WHEN postal_office_count = 0 THEN 1 ELSE 0 END) AS districts_zero_postal
            FROM public.district_planning
          `),
          appkit.lakebase.query(`
            SELECT trim(state_ut) AS state_ut, COUNT(*) AS district_count
            FROM public.district_planning
            GROUP BY trim(state_ut)
            ORDER BY trim(state_ut)
          `),
          appkit.lakebase.query(`
            SELECT ${DISTRICT_COLUMNS}
            FROM public.district_planning
            ORDER BY composite_need_score DESC
            LIMIT 8
          `),
        ]);

        res.json({
          summary: summary.rows[0],
          states: states.rows,
          priorities: priorities.rows,
          dataQuality: {
            repairedView: 'workspace.default.hackathon_district_planning_serving',
            repairSql: 'docs/district-planning-repaired-view.sql',
            before: {
              districtsWithFacilities: 326,
              districtsWithPostal: 542,
              districtsZeroFacilities: 380,
              districtsZeroPostal: 164,
              facilityRecordsMatched: 4890,
              postalOfficeRecordsMatched: 119527,
            },
            currentRoundBefore: {
              districtsWithFacilities: 482,
              districtsWithPostal: 624,
              facilityRecordsMatched: 9038,
              mappedFacilityRecords: 9005,
              pincodeMatchedFacilities: 0,
              coordinateMatchedFacilities: 0,
              validPostalOfficeCoordinatesSurfaced: 0,
              invalidPostalCoordinateWarnings: 0,
              dedupedFacilityCount: 9925,
              duplicateFacilityRecordCount: 0,
              serviceReadyFacilityCount: 0,
              emergencyReadyFacilityCount: 0,
              maternalReadyFacilityCount: 0,
              facilityQualitySignalCount: 0,
              facilityQualityWarningCount: 0,
            },
            fixes: [
              {
                title: 'Official boundary limitation',
                detail:
                  'No accessible district boundary, polygon, or administrative shape table was found in the workspace, so the demo keeps the pincode-derived district envelope as an explicit proxy.',
              },
              {
                title: 'Geography crosswalk',
                detail:
                  'State and district aliases are canonicalized before joins, including Maharashtra, Delhi, Ahmedabad, Belagavi, and West Bengal district variants.',
              },
              {
                title: 'Pincode-assisted facility matching',
                detail:
                  'Facilities with a usable pincode are assigned through the India Post district mapping before falling back to city/district text.',
              },
              {
                title: 'Facility coordinate quality guard',
                detail:
                  'Mapped facility counts now include only records with coordinates inside a coarse India bounding box.',
              },
              {
                title: 'District geo index',
                detail:
                  'Valid India Post pincode coordinates now form a district centroid and envelope index; unresolved facilities can fall back to the nearest district envelope in the same canonical state.',
              },
              {
                title: 'Pincode coordinate validation',
                detail:
                  'Postal and pincode counts now separate total coverage from rows with valid coordinates and rows flagged as unparseable or outside India bounds.',
              },
              {
                title: 'Facility dedupe and readiness',
                detail:
                  'Facility claims are now grouped by cluster ID or normalized identity, with duplicate records separated from service-ready, emergency-ready, maternal-ready, and quality-signal counts.',
              },
            ],
          },
          source: {
            catalog: 'databricks_virtue_foundation_dataset_dais_2026',
            syncedTable: 'hackathon_health_lakebase.public.district_planning',
            refreshMode: 'Lakebase snapshot sync',
          },
        });
      } catch (err) {
        console.error('Failed to load overview:', err);
        res.status(500).json({ error: 'Failed to load overview from Lakebase' });
      }
    });

    app.get('/api/districts', async (req, res) => {
      try {
        const state = typeof req.query.state === 'string' ? req.query.state.trim() : '';
        const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
        const sort = req.query.sort === 'facilities' ? 'facility_count DESC' : 'composite_need_score DESC';
        const result = await appkit.lakebase.query(
          `
            SELECT ${DISTRICT_COLUMNS}
            FROM public.district_planning
            WHERE ($1 = '' OR trim(state_ut) = $1)
              AND ($2 = '' OR district_name ILIKE '%' || $2 || '%')
            ORDER BY ${sort}, district_name
            LIMIT 80
          `,
          [state, q]
        );
        res.json(result.rows);
      } catch (err) {
        console.error('Failed to search districts:', err);
        res.status(500).json({ error: 'Failed to search districts' });
      }
    });

    app.get('/api/districts/:districtKey/recommendation', async (req, res) => {
      try {
        const result = await appkit.lakebase.query(
          `SELECT ${DISTRICT_COLUMNS} FROM public.district_planning WHERE district_key = $1 LIMIT 1`,
          [req.params.districtKey]
        );
        if (result.rows.length === 0) {
          res.status(404).json({ error: 'District not found' });
          return;
        }
        const district = result.rows[0];
        res.json({ district, plan: interventionPlan(district) });
      } catch (err) {
        console.error('Failed to build recommendation:', err);
        res.status(500).json({ error: 'Failed to build recommendation' });
      }
    });
  });
}
