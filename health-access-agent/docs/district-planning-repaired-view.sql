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
    TRY_CAST(longitude AS DOUBLE) AS longitude_num,
    CASE
      WHEN TRY_CAST(latitude AS DOUBLE) BETWEEN 6 AND 38
        AND TRY_CAST(longitude AS DOUBLE) BETWEEN 68 AND 98
      THEN 1
      ELSE 0
    END AS has_valid_india_coordinates
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
    COUNT(DISTINCT p.pincode_text) AS pincode_count,
    SUM(p.has_valid_india_coordinates) AS valid_postal_office_count,
    COUNT(DISTINCT CASE WHEN p.has_valid_india_coordinates = 1 THEN p.pincode_text END) AS valid_pincode_count,
    SUM(CASE WHEN p.has_valid_india_coordinates = 0 THEN 1 ELSE 0 END) AS invalid_postal_coordinate_count
  FROM pincode_norm p
  INNER JOIN health_norm h
    ON p.state_key = h.state_key
   AND p.district_key_name = h.district_key_name
  GROUP BY h.district_key
),
pincode_district_candidates AS (
  SELECT
    pincode_text,
    state_key,
    district_key_name,
    COUNT(*) AS office_count,
    SUM(has_valid_india_coordinates) AS valid_office_count,
    ROW_NUMBER() OVER (
      PARTITION BY pincode_text
      ORDER BY COUNT(*) DESC, SUM(has_valid_india_coordinates) DESC, state_key, district_key_name
    ) AS pincode_rank
  FROM pincode_norm
  WHERE pincode_text IS NOT NULL
    AND pincode_text <> ''
    AND state_key <> ''
    AND district_key_name <> ''
  GROUP BY pincode_text, state_key, district_key_name
),
pincode_single_district AS (
  SELECT pincode_text, state_key, district_key_name
  FROM pincode_district_candidates
  WHERE pincode_rank = 1
),
district_geo_index AS (
  SELECT
    h.district_key,
    h.state_key,
    AVG(p.latitude_num) AS centroid_latitude,
    AVG(p.longitude_num) AS centroid_longitude,
    MIN(p.latitude_num) AS min_latitude,
    MAX(p.latitude_num) AS max_latitude,
    MIN(p.longitude_num) AS min_longitude,
    MAX(p.longitude_num) AS max_longitude,
    COUNT(*) AS valid_postal_points
  FROM pincode_norm p
  INNER JOIN health_norm h
    ON p.state_key = h.state_key
   AND p.district_key_name = h.district_key_name
  WHERE p.has_valid_india_coordinates = 1
  GROUP BY h.district_key, h.state_key
),
facility_norm AS (
  SELECT
    unique_id,
    cluster_id,
    name,
    trim(regexp_replace(regexp_replace(lower(coalesce(name, '')), '&', ' and '), '[^a-z0-9]+', ' ')) AS normalized_name,
    trim(regexp_replace(regexp_replace(lower(concat_ws(' ', coalesce(address_line1, ''), coalesce(address_line2, ''), coalesce(address_line3, ''), coalesce(address_city, ''), coalesce(address_stateOrRegion, ''), coalesce(address_zipOrPostcode, ''))), '&', ' and '), '[^a-z0-9]+', ' ')) AS normalized_address,
    facilityTypeId,
    operatorTypeId,
    specialties,
    description,
    procedure,
    equipment,
    capability,
    numberDoctors,
    capacity,
    officialPhone,
    officialWebsite,
    distinct_social_media_presence_count,
    affiliated_staff_presence,
    custom_logo_presence,
    post_metrics_post_count,
    engagement_metrics_n_followers,
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
        OR lower(coalesce(specialties, '')) LIKE '%gyn%'
        OR lower(coalesce(specialties, '')) LIKE '%obstetric%'
        OR lower(coalesce(specialties, '')) LIKE '%neonat%'
        OR lower(coalesce(specialties, '')) LIKE '%pediatric%'
        OR lower(coalesce(name, '')) LIKE '%mother%'
        OR lower(coalesce(name, '')) LIKE '%child%'
        OR lower(coalesce(description, '')) LIKE '%mater%'
        OR lower(coalesce(description, '')) LIKE '%child%'
        OR lower(coalesce(procedure, '')) LIKE '%delivery%'
        OR lower(coalesce(procedure, '')) LIKE '%obstetric%'
        OR lower(coalesce(procedure, '')) LIKE '%neonat%'
        OR lower(coalesce(capability, '')) LIKE '%mater%'
        OR lower(coalesce(capability, '')) LIKE '%child%'
        OR lower(coalesce(capability, '')) LIKE '%gyn%'
        OR lower(coalesce(capability, '')) LIKE '%obstetric%'
        OR lower(coalesce(capability, '')) LIKE '%neonat%'
        OR lower(coalesce(capability, '')) LIKE '%pediatric%'
      THEN 1
      ELSE 0
    END AS has_maternal_child_signal,
    CASE
      WHEN lower(concat_ws(' ', coalesce(name, ''), coalesce(facilityTypeId, ''), coalesce(specialties, ''), coalesce(procedure, ''), coalesce(equipment, ''), coalesce(capability, ''))) RLIKE 'emergency|trauma|ambulance|critical|icu|casualty|24/7|24 hour|24hr|24 hrs'
      THEN 1
      ELSE 0
    END AS has_emergency_signal,
    CASE
      WHEN coalesce(nullif(trim(facilityTypeId), ''), nullif(trim(operatorTypeId), '')) IS NOT NULL
        AND (
          trim(coalesce(specialties, '')) <> ''
          OR trim(coalesce(procedure, '')) <> ''
          OR trim(coalesce(equipment, '')) <> ''
          OR trim(coalesce(capability, '')) <> ''
        )
        AND (
          trim(coalesce(officialPhone, '')) <> ''
          OR trim(coalesce(officialWebsite, '')) <> ''
          OR TRY_CAST(numberDoctors AS DOUBLE) > 0
          OR TRY_CAST(capacity AS DOUBLE) > 0
        )
      THEN 1
      ELSE 0
    END AS is_service_ready,
    (
      CASE WHEN latitude BETWEEN 6 AND 38 AND longitude BETWEEN 68 AND 98 THEN 1 ELSE 0 END
      + CASE WHEN trim(coalesce(facilityTypeId, '')) <> '' THEN 1 ELSE 0 END
      + CASE WHEN trim(coalesce(operatorTypeId, '')) <> '' THEN 1 ELSE 0 END
      + CASE WHEN trim(coalesce(specialties, '')) <> '' THEN 1 ELSE 0 END
      + CASE WHEN trim(coalesce(procedure, '')) <> '' THEN 1 ELSE 0 END
      + CASE WHEN trim(coalesce(equipment, '')) <> '' THEN 1 ELSE 0 END
      + CASE WHEN trim(coalesce(capability, '')) <> '' THEN 1 ELSE 0 END
      + CASE WHEN TRY_CAST(numberDoctors AS DOUBLE) > 0 THEN 1 ELSE 0 END
      + CASE WHEN TRY_CAST(capacity AS DOUBLE) > 0 THEN 1 ELSE 0 END
      + CASE WHEN trim(coalesce(officialPhone, '')) <> '' THEN 1 ELSE 0 END
      + CASE WHEN trim(coalesce(officialWebsite, '')) <> '' THEN 1 ELSE 0 END
      + CASE WHEN TRY_CAST(distinct_social_media_presence_count AS DOUBLE) > 0 THEN 1 ELSE 0 END
      + CASE WHEN lower(coalesce(affiliated_staff_presence, '')) = 'true' THEN 1 ELSE 0 END
      + CASE WHEN lower(coalesce(custom_logo_presence, '')) = 'true' THEN 1 ELSE 0 END
      + CASE WHEN TRY_CAST(post_metrics_post_count AS DOUBLE) > 0 THEN 1 ELSE 0 END
      + CASE WHEN TRY_CAST(engagement_metrics_n_followers AS DOUBLE) > 0 THEN 1 ELSE 0 END
    ) AS facility_quality_signal_count,
    (
      CASE WHEN NOT (latitude BETWEEN 6 AND 38 AND longitude BETWEEN 68 AND 98) THEN 1 ELSE 0 END
      + CASE WHEN trim(coalesce(facilityTypeId, '')) = '' THEN 1 ELSE 0 END
      + CASE WHEN trim(coalesce(operatorTypeId, '')) = '' THEN 1 ELSE 0 END
      + CASE WHEN trim(coalesce(officialPhone, '')) = '' AND trim(coalesce(officialWebsite, '')) = '' THEN 1 ELSE 0 END
      + CASE WHEN trim(coalesce(specialties, '')) = '' AND trim(coalesce(procedure, '')) = '' AND trim(coalesce(equipment, '')) = '' AND trim(coalesce(capability, '')) = '' THEN 1 ELSE 0 END
      + CASE WHEN TRY_CAST(numberDoctors AS DOUBLE) IS NULL AND TRY_CAST(capacity AS DOUBLE) IS NULL THEN 1 ELSE 0 END
    ) AS facility_quality_warning_count
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
facility_geography_candidates AS (
  SELECT
    f.unique_id,
    g.district_key,
    POWER(f.latitude - g.centroid_latitude, 2) + POWER(f.longitude - g.centroid_longitude, 2) AS distance_score,
    ROW_NUMBER() OVER (
      PARTITION BY f.unique_id
      ORDER BY POWER(f.latitude - g.centroid_latitude, 2) + POWER(f.longitude - g.centroid_longitude, 2)
    ) AS geography_rank
  FROM facility_norm f
  INNER JOIN district_geo_index g
    ON f.has_valid_india_coordinates = 1
   AND f.address_state_key = g.state_key
   AND f.latitude BETWEEN g.min_latitude - 0.35 AND g.max_latitude + 0.35
   AND f.longitude BETWEEN g.min_longitude - 0.35 AND g.max_longitude + 0.35
),
facility_geography_match AS (
  SELECT unique_id, district_key
  FROM facility_geography_candidates
  WHERE geography_rank = 1
),
facility_to_district AS (
  SELECT
    f.unique_id,
    CASE
      WHEN f.normalized_name <> '' AND f.pincode_text <> ''
        THEN sha2(concat_ws('|', 'name_pincode', f.normalized_name, f.pincode_text), 256)
      WHEN f.normalized_name <> '' AND f.has_valid_india_coordinates = 1
        THEN sha2(concat_ws('|', 'name_geo', f.normalized_name, CAST(round(f.latitude, 3) AS STRING), CAST(round(f.longitude, 3) AS STRING)), 256)
      WHEN f.normalized_name <> '' AND f.normalized_address <> ''
        THEN sha2(concat_ws('|', 'name_address', f.normalized_name, f.normalized_address), 256)
      ELSE coalesce(nullif(trim(f.cluster_id), ''), f.unique_id)
    END AS facility_dedupe_key,
    f.has_valid_india_coordinates,
    f.has_maternal_child_signal,
    f.has_emergency_signal,
    f.is_service_ready,
    f.facility_quality_signal_count,
    f.facility_quality_warning_count,
    coalesce(h_pincode.district_key, h_city.district_key, h_geo.district_key) AS district_key,
    CASE
      WHEN h_pincode.district_key IS NOT NULL THEN 'pincode'
      WHEN h_city.district_key IS NOT NULL THEN 'city'
      WHEN h_geo.district_key IS NOT NULL THEN 'coordinate'
      ELSE 'unmatched'
    END AS match_method
  FROM facility_norm f
  LEFT JOIN pincode_single_district p
    ON f.pincode_text = p.pincode_text
  LEFT JOIN health_norm h_pincode
    ON p.state_key = h_pincode.state_key
   AND p.district_key_name = h_pincode.district_key_name
  LEFT JOIN health_norm h_city
    ON f.address_state_key = h_city.state_key
   AND f.address_city_key = h_city.district_key_name
  LEFT JOIN facility_geography_match h_geo
    ON f.unique_id = h_geo.unique_id
),
facility_deduped AS (
  SELECT
    district_key,
    facility_dedupe_key,
    COUNT(DISTINCT unique_id) AS facility_record_count,
    MAX(has_valid_india_coordinates) AS has_valid_india_coordinates,
    MAX(has_maternal_child_signal) AS has_maternal_child_signal,
    MAX(has_emergency_signal) AS has_emergency_signal,
    MAX(is_service_ready) AS is_service_ready,
    MAX(facility_quality_signal_count) AS facility_quality_signal_count,
    MAX(facility_quality_warning_count)
      + CASE WHEN COUNT(DISTINCT unique_id) > 1 THEN COUNT(DISTINCT unique_id) - 1 ELSE 0 END AS facility_quality_warning_count
  FROM facility_to_district
  WHERE district_key IS NOT NULL
  GROUP BY district_key, facility_dedupe_key
),
facility_counts AS (
  SELECT
    f.district_key,
    COUNT(DISTINCT f.unique_id) AS facility_count,
    COUNT(DISTINCT CASE WHEN f.has_valid_india_coordinates = 1 THEN f.unique_id END) AS mapped_facility_count,
    COUNT(DISTINCT CASE WHEN f.has_maternal_child_signal = 1 THEN f.unique_id END) AS maternal_child_facility_count,
    COUNT(DISTINCT CASE WHEN f.match_method = 'pincode' THEN f.unique_id END) AS pincode_matched_facility_count,
    COUNT(DISTINCT CASE WHEN f.match_method = 'city' THEN f.unique_id END) AS city_matched_facility_count,
    COUNT(DISTINCT CASE WHEN f.match_method = 'coordinate' THEN f.unique_id END) AS coordinate_matched_facility_count,
    COUNT(DISTINCT d.facility_dedupe_key) AS deduped_facility_count,
    COUNT(DISTINCT f.unique_id) - COUNT(DISTINCT d.facility_dedupe_key) AS duplicate_facility_record_count,
    COUNT(DISTINCT CASE WHEN d.is_service_ready = 1 THEN d.facility_dedupe_key END) AS service_ready_facility_count,
    COUNT(DISTINCT CASE WHEN d.has_emergency_signal = 1 THEN d.facility_dedupe_key END) AS emergency_ready_facility_count,
    COUNT(DISTINCT CASE WHEN d.has_maternal_child_signal = 1 THEN d.facility_dedupe_key END) AS maternal_ready_facility_count,
    SUM(d.facility_quality_signal_count) AS facility_quality_signal_count,
    SUM(d.facility_quality_warning_count) AS facility_quality_warning_count
  FROM facility_to_district f
  INNER JOIN facility_deduped d
    ON f.district_key = d.district_key
   AND f.facility_dedupe_key = d.facility_dedupe_key
  WHERE f.district_key IS NOT NULL
  GROUP BY f.district_key
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
  coalesce(f.pincode_matched_facility_count, 0) AS pincode_matched_facility_count,
  coalesce(f.city_matched_facility_count, 0) AS city_matched_facility_count,
  coalesce(f.coordinate_matched_facility_count, 0) AS coordinate_matched_facility_count,
  coalesce(f.deduped_facility_count, 0) AS deduped_facility_count,
  coalesce(f.duplicate_facility_record_count, 0) AS duplicate_facility_record_count,
  coalesce(f.service_ready_facility_count, 0) AS service_ready_facility_count,
  coalesce(f.emergency_ready_facility_count, 0) AS emergency_ready_facility_count,
  coalesce(f.maternal_ready_facility_count, 0) AS maternal_ready_facility_count,
  coalesce(f.facility_quality_signal_count, 0) AS facility_quality_signal_count,
  coalesce(f.facility_quality_warning_count, 0) AS facility_quality_warning_count,
  coalesce(p.postal_office_count, 0) AS postal_office_count,
  coalesce(p.pincode_count, 0) AS pincode_count,
  coalesce(p.valid_postal_office_count, 0) AS valid_postal_office_count,
  coalesce(p.valid_pincode_count, 0) AS valid_pincode_count,
  coalesce(p.invalid_postal_coordinate_count, 0) AS invalid_postal_coordinate_count,
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
