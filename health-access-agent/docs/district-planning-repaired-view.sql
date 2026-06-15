CREATE OR REPLACE VIEW workspace.default.hackathon_district_planning_serving AS
WITH health_base AS (
  SELECT
    district_key,
    trim(district_name) AS district_name,
    trim(state_ut) AS state_ut,
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
  FROM workspace.default.hackathon_health_indicators_serving
),
health_norm AS (
  SELECT
    *,
    CASE state_key_raw
      WHEN 'maharastra' THEN 'maharashtra'
      WHEN 'nct of delhi' THEN 'delhi'
      ELSE state_key_raw
    END AS state_key,
    CASE district_key_raw
      WHEN 'ahmadabad' THEN 'ahmedabad'
      WHEN 'ahmadnagar' THEN 'ahmednagar'
      WHEN 'banas kantha' THEN 'banaskantha'
      WHEN 'belgaum' THEN 'belagavi'
      WHEN 'bangalore' THEN 'bengaluru'
      WHEN 'bellary' THEN 'ballari'
      WHEN 'bijapur' THEN 'vijayapura'
      WHEN 'bid' THEN 'beed'
      WHEN 'dohad' THEN 'dahod'
      WHEN 'gondiya' THEN 'gondia'
      WHEN 'gulbarga' THEN 'kalaburagi'
      WHEN 'hugli' THEN 'hooghly'
      WHEN 'haora' THEN 'howrah'
      WHEN 'koch bihar' THEN 'cooch behar'
      WHEN 'mahesana' THEN 'mehsana'
      WHEN 'maldah' THEN 'malda'
      WHEN 'mysore' THEN 'mysuru'
      WHEN 'north twenty four pargana' THEN 'north 24 parganas'
      WHEN 'paschim barddhaman' THEN 'paschim bardhaman'
      WHEN 'paschim medinipur' THEN 'medinipur west'
      WHEN 'purba medinipur' THEN 'medinipur east'
      WHEN 'puruliya' THEN 'purulia'
      WHEN 'shimoga' THEN 'shivamogga'
      WHEN 'south twenty four pargana' THEN 'south 24 parganas'
      WHEN 'tumkur' THEN 'tumakuru'
      WHEN 'leh ladakh' THEN 'leh'
      ELSE district_key_raw
    END AS district_key_name
  FROM (
    SELECT
      *,
      trim(regexp_replace(regexp_replace(lower(state_ut), '&', ' and '), '[^a-z0-9]+', ' ')) AS state_key_raw,
      trim(regexp_replace(regexp_replace(lower(district_name), '&', ' and '), '[^a-z0-9]+', ' ')) AS district_key_raw
    FROM health_base
  )
),
pincode_norm AS (
  SELECT
    CAST(pincode AS STRING) AS pincode_text,
    CASE state_key_raw
      WHEN 'maharastra' THEN 'maharashtra'
      WHEN 'nct of delhi' THEN 'delhi'
      ELSE state_key_raw
    END AS state_key,
    CASE district_key_raw
      WHEN '24 paraganas north' THEN 'north 24 parganas'
      WHEN '24 parganas north' THEN 'north 24 parganas'
      WHEN 'north 24 parganas' THEN 'north 24 parganas'
      WHEN '24 paraganas south' THEN 'south 24 parganas'
      WHEN '24 parganas south' THEN 'south 24 parganas'
      WHEN 'south 24 parganas' THEN 'south 24 parganas'
      WHEN 'ahmadabad' THEN 'ahmedabad'
      WHEN 'ahmadnagar' THEN 'ahmednagar'
      WHEN 'banas kantha' THEN 'banaskantha'
      WHEN 'belgaum' THEN 'belagavi'
      WHEN 'bangalore' THEN 'bengaluru'
      WHEN 'bellary' THEN 'ballari'
      WHEN 'bijapur' THEN 'vijayapura'
      WHEN 'bid' THEN 'beed'
      WHEN 'dohad' THEN 'dahod'
      WHEN 'gondiya' THEN 'gondia'
      WHEN 'gulbarga' THEN 'kalaburagi'
      WHEN 'hooghly' THEN 'hooghly'
      WHEN 'howrah' THEN 'howrah'
      WHEN 'koch bihar' THEN 'cooch behar'
      WHEN 'mahesana' THEN 'mehsana'
      WHEN 'maldah' THEN 'malda'
      WHEN 'medinipur east' THEN 'medinipur east'
      WHEN 'medinipur west' THEN 'medinipur west'
      WHEN 'mysore' THEN 'mysuru'
      WHEN 'purba bardhaman' THEN 'purba bardhaman'
      WHEN 'paschim bardhaman' THEN 'paschim bardhaman'
      WHEN 'purulia' THEN 'purulia'
      WHEN 'spsr nellore' THEN 'sri potti sriramulu nellore'
      WHEN 'shimoga' THEN 'shivamogga'
      WHEN 'tumkur' THEN 'tumakuru'
      ELSE district_key_raw
    END AS district_key_name,
    officename,
    TRY_CAST(latitude AS DOUBLE) AS latitude_num,
    TRY_CAST(longitude AS DOUBLE) AS longitude_num
  FROM (
    SELECT
      *,
      trim(regexp_replace(regexp_replace(lower(statename), '&', ' and '), '[^a-z0-9]+', ' ')) AS state_key_raw,
      trim(regexp_replace(regexp_replace(lower(district), '&', ' and '), '[^a-z0-9]+', ' ')) AS district_key_raw
    FROM databricks_virtue_foundation_dataset_dais_2026.virtue_foundation_dataset.india_post_pincode_directory
  )
),
pincode_counts AS (
  SELECT
    h.district_key,
    COUNT(*) AS postal_office_count,
    COUNT(DISTINCT p.pincode_text) AS pincode_count
  FROM pincode_norm p
  INNER JOIN health_norm h
    ON p.state_key = h.state_key
   AND p.district_key_name = h.district_key_name
  GROUP BY h.district_key
),
pincode_single_district AS (
  SELECT
    pincode_text,
    max(state_key) AS state_key,
    max(district_key_name) AS district_key_name
  FROM (
    SELECT DISTINCT pincode_text, state_key, district_key_name
    FROM pincode_norm
    WHERE pincode_text IS NOT NULL AND pincode_text <> ''
  )
  GROUP BY pincode_text
  HAVING COUNT(*) = 1
),
facility_norm AS (
  SELECT
    unique_id,
    name,
    specialties,
    description,
    procedure,
    equipment,
    capability,
    latitude,
    longitude,
    CASE state_key_raw
      WHEN 'maharastra' THEN 'maharashtra'
      WHEN 'nct of delhi' THEN 'delhi'
      ELSE state_key_raw
    END AS address_state_key,
    CASE city_key_raw
      WHEN 'ahmadabad' THEN 'ahmedabad'
      WHEN 'ahmadnagar' THEN 'ahmednagar'
      WHEN 'banas kantha' THEN 'banaskantha'
      WHEN 'belgaum' THEN 'belagavi'
      WHEN 'bangalore' THEN 'bengaluru'
      WHEN 'bengaluru' THEN 'bengaluru'
      WHEN 'bellary' THEN 'ballari'
      WHEN 'bijapur' THEN 'vijayapura'
      WHEN 'bid' THEN 'beed'
      WHEN 'dohad' THEN 'dahod'
      WHEN 'gondiya' THEN 'gondia'
      WHEN 'gulbarga' THEN 'kalaburagi'
      WHEN 'hugli' THEN 'hooghly'
      WHEN 'haora' THEN 'howrah'
      WHEN 'koch bihar' THEN 'cooch behar'
      WHEN 'mahesana' THEN 'mehsana'
      WHEN 'maldah' THEN 'malda'
      WHEN 'mysore' THEN 'mysuru'
      WHEN 'shimoga' THEN 'shivamogga'
      WHEN 'tumkur' THEN 'tumakuru'
      ELSE city_key_raw
    END AS address_city_key,
    regexp_extract(coalesce(address_zipOrPostcode, ''), '([0-9]{6})', 1) AS pincode_text,
    CASE
      WHEN latitude BETWEEN 6 AND 38 AND longitude BETWEEN 68 AND 98 THEN 1
      ELSE 0
    END AS has_valid_india_coordinates,
    CASE
      WHEN lower(coalesce(specialties, '')) LIKE '%mater%'
        OR lower(coalesce(specialties, '')) LIKE '%child%'
        OR lower(coalesce(name, '')) LIKE '%mother%'
        OR lower(coalesce(name, '')) LIKE '%child%'
        OR lower(coalesce(description, '')) LIKE '%mater%'
        OR lower(coalesce(description, '')) LIKE '%child%'
        OR lower(coalesce(capability, '')) LIKE '%mater%'
        OR lower(coalesce(capability, '')) LIKE '%child%'
      THEN 1
      ELSE 0
    END AS has_maternal_child_signal
  FROM (
    SELECT
      *,
      trim(regexp_replace(regexp_replace(lower(coalesce(address_stateOrRegion, '')), '&', ' and '), '[^a-z0-9]+', ' ')) AS state_key_raw,
      trim(regexp_replace(regexp_replace(lower(coalesce(address_city, '')), '&', ' and '), '[^a-z0-9]+', ' ')) AS city_key_raw
    FROM databricks_virtue_foundation_dataset_dais_2026.virtue_foundation_dataset.facilities
    WHERE address_country = 'India'
      AND unique_id IS NOT NULL
      AND trim(coalesce(name, '')) <> ''
  )
),
facility_to_district AS (
  SELECT
    f.unique_id,
    f.has_valid_india_coordinates,
    f.has_maternal_child_signal,
    coalesce(h_pincode.district_key, h_city.district_key) AS district_key
  FROM facility_norm f
  LEFT JOIN pincode_single_district p
    ON f.pincode_text = p.pincode_text
  LEFT JOIN health_norm h_pincode
    ON p.state_key = h_pincode.state_key
   AND p.district_key_name = h_pincode.district_key_name
  LEFT JOIN health_norm h_city
    ON f.address_state_key = h_city.state_key
   AND f.address_city_key = h_city.district_key_name
),
facility_counts AS (
  SELECT
    district_key,
    COUNT(DISTINCT unique_id) AS facility_count,
    COUNT(DISTINCT CASE WHEN has_valid_india_coordinates = 1 THEN unique_id END) AS mapped_facility_count,
    COUNT(DISTINCT CASE WHEN has_maternal_child_signal = 1 THEN unique_id END) AS maternal_child_facility_count
  FROM facility_to_district
  WHERE district_key IS NOT NULL
  GROUP BY district_key
)
SELECT
  h.district_key,
  h.district_name,
  h.state_ut,
  h.households_surveyed,
  h.women_15_49_interviewed,
  h.hh_improved_water_pct,
  h.hh_use_improved_sanitation_pct,
  h.households_using_clean_fuel_for_cooking_pct,
  h.hh_member_covered_health_insurance_pct,
  h.women_age_15_49_who_are_literate_pct,
  h.women_age_15_49_with_10_or_more_years_of_schooling_pct,
  h.institutional_birth_5y_pct,
  h.institutional_birth_in_public_facility_5y_pct,
  h.births_attended_by_skilled_hp_5y_10_pct,
  h.prev_diarrhoea_2wk_child_u5_pct,
  h.children_prev_symptoms_of_acute_respiratory_infection_ari_2_pct,
  h.women_age_15_49_years_whose_bmi_bmi_is_underweight_bmi_lt_1_pct,
  h.all_w15_49_who_are_anaemic_pct,
  h.w15_plus_with_high_bp_sys_gte_140_mmhg_and_or_dia_gte_90_mm_pct,
  h.m15_plus_with_high_bp_sys_gte_140_mmhg_and_or_dia_gte_90_mm_pct,
  h.women_age_30_49_years_ever_undergone_a_cervical_screen_pct,
  h.w15_plus_who_use_any_kind_of_tobacco_pct,
  h.m15_plus_who_use_any_kind_of_tobacco_pct,
  coalesce(f.facility_count, 0) AS facility_count,
  coalesce(f.mapped_facility_count, 0) AS mapped_facility_count,
  coalesce(f.maternal_child_facility_count, 0) AS maternal_child_facility_count,
  coalesce(p.postal_office_count, 0) AS postal_office_count,
  coalesce(p.pincode_count, 0) AS pincode_count,
  round(
    (coalesce(h.all_w15_49_who_are_anaemic_pct, 0) * 0.22)
    + ((100 - coalesce(h.institutional_birth_5y_pct, 0)) * 0.18)
    + ((100 - coalesce(h.hh_member_covered_health_insurance_pct, 0)) * 0.16)
    + ((100 - coalesce(h.hh_use_improved_sanitation_pct, 0)) * 0.14)
    + ((100 - coalesce(h.hh_improved_water_pct, 0)) * 0.12)
    + (coalesce(h.prev_diarrhoea_2wk_child_u5_pct, 0) * 0.10)
    + ((100 - coalesce(h.women_age_30_49_years_ever_undergone_a_cervical_screen_pct, 0)) * 0.08),
    2
  ) AS composite_need_score
FROM health_norm h
LEFT JOIN facility_counts f
  ON h.district_key = f.district_key
LEFT JOIN pincode_counts p
  ON h.district_key = p.district_key
