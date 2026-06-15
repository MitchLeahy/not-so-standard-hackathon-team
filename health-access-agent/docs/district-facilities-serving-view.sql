CREATE OR REPLACE VIEW workspace.default.hackathon_district_facilities_serving AS
WITH health_base AS (
  SELECT
    district_key,
    trim(district_name) AS district_name,
    trim(state_ut) AS state_ut
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
    MAX(p.longitude_num) AS max_longitude
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
    trim(regexp_replace(regexp_replace(regexp_replace(lower(coalesce(name, '')), '&', ' and '), '[^a-z0-9]+', ' '), '\\b(and|the|hospital|clinic|medical|centre|center|multi|speciality|multispeciality|healthcare|care|nursing|home|dr|doctor|shri|sri|sree)\\b', ' ')) AS normalized_name_core,
    trim(regexp_replace(regexp_replace(lower(concat_ws(' ', coalesce(address_line1, ''), coalesce(address_line2, ''), coalesce(address_line3, ''), coalesce(address_city, ''), coalesce(address_stateOrRegion, ''), coalesce(address_zipOrPostcode, ''))), '&', ' and '), '[^a-z0-9]+', ' ')) AS normalized_address,
    facilityTypeId,
    operatorTypeId,
    address_line1,
    address_line2,
    address_line3,
    address_city,
    address_stateOrRegion,
    regexp_extract(coalesce(address_zipOrPostcode, ''), '([0-9]{6})', 1) AS pincode_text,
    specialties,
    description,
    procedure,
    equipment,
    capability,
    numberDoctors,
    capacity,
    officialPhone,
    officialWebsite,
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
    g.state_key,
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
  SELECT unique_id, district_key, state_key
  FROM facility_geography_candidates
  WHERE geography_rank = 1
),
facility_to_district AS (
  SELECT
    f.*,
    CASE
      WHEN length(regexp_replace(f.normalized_name_core, '\\s+', '')) >= 8 AND f.pincode_text <> ''
        THEN sha2(concat_ws('|', 'fuzzy_name_pincode', regexp_replace(f.normalized_name_core, '\\s+', ''), f.pincode_text), 256)
      WHEN length(regexp_replace(f.normalized_name_core, '\\s+', '')) >= 8 AND f.has_valid_india_coordinates = 1
        THEN sha2(concat_ws('|', 'fuzzy_name_geo', regexp_replace(f.normalized_name_core, '\\s+', ''), CAST(round(f.latitude, 3) AS STRING), CAST(round(f.longitude, 3) AS STRING)), 256)
      WHEN f.normalized_name <> '' AND f.pincode_text <> ''
        THEN sha2(concat_ws('|', 'exact_name_pincode', f.normalized_name, f.pincode_text), 256)
      WHEN f.normalized_name <> '' AND f.normalized_address <> ''
        THEN sha2(concat_ws('|', 'name_address', f.normalized_name, f.normalized_address), 256)
      ELSE coalesce(nullif(trim(f.cluster_id), ''), f.unique_id)
    END AS facility_dedupe_key,
    CASE
      WHEN length(regexp_replace(f.normalized_name_core, '\\s+', '')) >= 8 AND f.pincode_text <> '' THEN 'fuzzy_name_pincode'
      WHEN length(regexp_replace(f.normalized_name_core, '\\s+', '')) >= 8 AND f.has_valid_india_coordinates = 1 THEN 'fuzzy_name_geo'
      WHEN f.normalized_name <> '' AND f.pincode_text <> '' THEN 'exact_name_pincode'
      WHEN f.normalized_name <> '' AND f.normalized_address <> '' THEN 'name_address'
      WHEN nullif(trim(f.cluster_id), '') IS NOT NULL THEN 'cluster_id'
      ELSE 'unique_id'
    END AS dedupe_method,
    coalesce(h_pincode.district_key, h_city.district_key, h_geo.district_key) AS district_key,
    coalesce(h_pincode.state_key, h_city.state_key, h_geo.state_key, f.address_state_key) AS district_state_key,
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
facility_ranked AS (
  SELECT
    f.*,
    h.district_name,
    h.state_ut,
    g.centroid_latitude,
    g.centroid_longitude,
    COUNT(*) OVER (PARTITION BY f.district_key, f.facility_dedupe_key) AS duplicate_group_size,
    ROW_NUMBER() OVER (
      PARTITION BY f.district_key, f.facility_dedupe_key
      ORDER BY f.is_service_ready DESC, f.facility_quality_signal_count DESC, f.unique_id
    ) AS duplicate_record_rank,
    ROW_NUMBER() OVER (
      PARTITION BY f.unique_id
      ORDER BY f.district_key, f.match_method, f.name, f.pincode_text
    ) AS unique_id_row_rank
  FROM facility_to_district f
  INNER JOIN health_norm h
    ON f.district_key = h.district_key
  LEFT JOIN district_geo_index g
    ON f.district_key = g.district_key
  WHERE f.district_key IS NOT NULL
)
SELECT
  sha2(concat_ws('|', unique_id, CAST(unique_id_row_rank AS STRING), district_key), 256) AS facility_row_id,
  district_key,
  replace(district_name, chr(0), '') AS district_name,
  replace(state_ut, chr(0), '') AS state_ut,
  unique_id,
  facility_dedupe_key,
  dedupe_method,
  duplicate_group_size,
  duplicate_record_rank,
  replace(name, chr(0), '') AS name,
  replace(facilityTypeId, chr(0), '') AS facility_type_id,
  replace(operatorTypeId, chr(0), '') AS operator_type_id,
  replace(concat_ws(', ', address_line1, address_line2, address_line3), chr(0), '') AS address_line,
  replace(address_city, chr(0), '') AS address_city,
  replace(address_stateOrRegion, chr(0), '') AS address_state_or_region,
  pincode_text,
  latitude,
  longitude,
  has_valid_india_coordinates,
  match_method,
  is_service_ready,
  has_emergency_signal,
  has_maternal_child_signal,
  facility_quality_signal_count,
  facility_quality_warning_count + CASE WHEN duplicate_group_size > 1 THEN duplicate_group_size - 1 ELSE 0 END AS facility_quality_warning_count,
  concat_ws(
    ', ',
    CASE WHEN has_valid_india_coordinates = 0 THEN 'invalid_or_missing_coordinates' END,
    CASE WHEN duplicate_group_size > 1 THEN 'duplicate_facility_claim' END,
    CASE WHEN trim(coalesce(facilityTypeId, '')) = '' THEN 'missing_facility_type' END,
    CASE WHEN trim(coalesce(operatorTypeId, '')) = '' THEN 'missing_operator_type' END,
    CASE WHEN trim(coalesce(officialPhone, '')) = '' AND trim(coalesce(officialWebsite, '')) = '' THEN 'missing_contact_or_website' END,
    CASE WHEN trim(coalesce(specialties, '')) = '' AND trim(coalesce(procedure, '')) = '' AND trim(coalesce(equipment, '')) = '' AND trim(coalesce(capability, '')) = '' THEN 'missing_service_evidence' END
  ) AS quality_warnings,
  replace(officialPhone, chr(0), '') AS official_phone,
  replace(officialWebsite, chr(0), '') AS official_website,
  replace(numberDoctors, chr(0), '') AS number_doctors,
  replace(capacity, chr(0), '') AS capacity,
  replace(specialties, chr(0), '') AS specialties,
  replace(procedure, chr(0), '') AS procedure,
  replace(equipment, chr(0), '') AS equipment,
  replace(capability, chr(0), '') AS capability,
  CASE
    WHEN has_valid_india_coordinates = 1 AND centroid_latitude IS NOT NULL AND centroid_longitude IS NOT NULL THEN round(
      111.32 * sqrt(
        power(centroid_latitude - latitude, 2)
        + power((centroid_longitude - longitude) * cos(radians(centroid_latitude)), 2)
      ),
      2
    )
  END AS distance_to_district_centroid_km,
  CASE
    WHEN has_valid_india_coordinates = 1 AND centroid_latitude IS NOT NULL AND centroid_longitude IS NOT NULL THEN CAST(round(
      20 + (
        111.32 * sqrt(
          power(centroid_latitude - latitude, 2)
          + power((centroid_longitude - longitude) * cos(radians(centroid_latitude)), 2)
        )
      ) * 1.8
    ) AS BIGINT)
  END AS estimated_travel_minutes_to_district_centroid
FROM facility_ranked
