import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "../_shared/rateLimiter.ts";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";
import { fetchRideData, buildApiHeaders, fetchDriverDetails } from "../_shared/fetchRideData.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-api-secret",
};

const logger = createEdgeLogger("machine-webhook");

const STATUS_MAP: Record<string, string> = {
  P: "PENDING",
  A: "ACCEPTED",
  S: "IN_PROGRESS",
  F: "FINALIZED",
  C: "CANCELLED",
  N: "DENIED",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function logAudit(
  sb: ReturnType<typeof createClient>,
  action: string,
  opts: { brandId?: string; entityId?: string; ip?: string | null; details?: Record<string, unknown>; changes?: Record<string, unknown> } = {}
) {
  const details = { ...opts.details };
  if (opts.entityId) {
    details.machine_ride_id = opts.entityId;
  }
  sb.from("audit_logs")
    .insert({
      action,
      entity_type: "MACHINE_WEBHOOK",
      entity_id: null,
      scope_type: opts.brandId ? "BRAND" : null,
      scope_id: opts.brandId || null,
      ip_address: opts.ip || null,
      details_json: details,
      changes_json: opts.changes || {},
    })
    .then(({ error }) => {
      if (error) logger.error("audit_log insert error", { error });
    });
}

async function findIntegration(sb: ReturnType<typeof createClient>, req: Request, body: Record<string, unknown>) {
  const apiSecret = req.headers.get("x-api-secret") || req.headers.get("x-api-key");
  const url = new URL(req.url);
  const queryBrandId = url.searchParams.get("brand_id");
  const queryBranchId = url.searchParams.get("branch_id");
  const bodyBrandId = typeof body.brand_id === "string" ? body.brand_id : null;
  const bodyBranchId = typeof body.branch_id === "string" ? body.branch_id : null;

  // 1. Try by api_key first
  if (apiSecret) {
    const { data } = await sb
      .from("machine_integrations")
      .select("*")
      .eq("api_key", apiSecret)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (data) return data;
  }

  // 2. Try by brand_id + branch_id
  const brandId = bodyBrandId || queryBrandId;
  const branchId = bodyBranchId || queryBranchId;

  if (brandId && branchId) {
    const { data } = await sb
      .from("machine_integrations")
      .select("*")
      .eq("brand_id", brandId)
      .eq("branch_id", branchId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (data) return data;
  }

  // 3. Fallback: brand_id only — pick first active integration for this brand
  if (brandId) {
    const { data } = await sb
      .from("machine_integrations")
      .select("*")
      .eq("brand_id", brandId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (data) return data;
  }

  // 4. Legacy: single active integration across all brands
  const { data: activeIntegrations } = await sb
    .from("machine_integrations")
    .select("*")
    .eq("is_active", true)
    .limit(2);

  if (activeIntegrations && activeIntegrations.length === 1) {
    return activeIntegrations[0];
  }

  return null;
}

const TIER_THRESHOLDS = [
  { key: "GALATICO", min: 501 },
  { key: "LENDARIO", min: 101 },
  { key: "DIAMANTE", min: 51 },
  { key: "OURO", min: 31 },
  { key: "PRATA", min: 11 },
  { key: "BRONZE", min: 1 },
  { key: "INICIANTE", min: 0 },
] as const;

function getTierFromRideCount(rideCount: number): string {
  for (const t of TIER_THRESHOLDS) {
    if (rideCount >= t.min) return t.key;
  }
  return "INICIANTE";
}

const CUSTOMER_SELECT = "id, branch_id, points_balance, name, phone, customer_tier, ride_count";

async function findCustomerCascade(
  sb: ReturnType<typeof createClient>,
  brandId: string,
  cpf: string | null,
  phone: string | null,
  name: string | null
) {
  // 1. By CPF
  if (cpf) {
    const { data } = await sb
      .from("customers")
      .select(CUSTOMER_SELECT)
      .eq("brand_id", brandId)
      .eq("cpf", cpf)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (data) return { customer: data, matchedBy: "cpf" };
  }

  // 2. By phone
  if (phone) {
    const { data } = await sb
      .from("customers")
      .select(CUSTOMER_SELECT)
      .eq("brand_id", brandId)
      .eq("phone", phone)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (data) return { customer: data, matchedBy: "phone" };
  }

  // 3. By exact name
  if (name) {
    const { data } = await sb
      .from("customers")
      .select(CUSTOMER_SELECT)
      .eq("brand_id", brandId)
      .eq("name", name)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (data) return { customer: data, matchedBy: "name" };
  }

  return null;
}

async function resolveEffectivePointsPerReal(
  sb: ReturnType<typeof createClient>,
  brandId: string,
  branchId: string | null,
  customerTier: string
): Promise<{ pointsPerReal: number; source: string }> {
  // 1. Try tier-specific rule
  if (branchId) {
    const { data: tierRule } = await sb
      .from("tier_points_rules")
      .select("points_per_real")
      .eq("brand_id", brandId)
      .eq("branch_id", branchId)
      .eq("tier", customerTier)
      .eq("is_active", true)
      .maybeSingle();
    if (tierRule) {
      return { pointsPerReal: Number(tierRule.points_per_real), source: `tier_rule:${customerTier}` };
    }
  }

  // 2. Fall back to brand points_rules
  const { data: rules } = await sb
    .from("points_rules")
    .select("points_per_real")
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .or(branchId ? `branch_id.eq.${branchId},branch_id.is.null` : "branch_id.is.null")
    .order("branch_id", { ascending: false, nullsFirst: false })
    .limit(1);

  if (rules?.[0]) {
    return { pointsPerReal: Number(rules[0].points_per_real), source: "brand_rule" };
  }

  // 3. Absolute fallback
  return { pointsPerReal: 1.0, source: "default_fallback" };
}

async function processFinalized(
  sb: ReturnType<typeof createClient>,
  integration: any,
  brandId: string,
  branchId: string | null,
  machineRideId: string,
  ip: string
) {
  // City-level credentials (used for V1 endpoint)
  const basicUser = (integration.basic_auth_user || "").trim();
  const basicPass = (integration.basic_auth_password || "").trim();
  const cityApiKey = (integration.api_key || "").trim();
  const hasValidCityKey = cityApiKey && !cityApiKey.startsWith("url-only-");
  if (!hasValidCityKey) {
    logger.error("Missing api_key on integration", { brandId });
    logAudit(sb, "MACHINE_RIDE_NO_CREDENTIALS", { brandId, entityId: machineRideId, ip, details: { reason: "credentials_missing", missing: ["api_key"] } });
    await sb.from("machine_rides").upsert({
      brand_id: brandId,
      branch_id: branchId,
      machine_ride_id: machineRideId,
      ride_status: "CREDENTIAL_ERROR",
      ride_value: 0,
      points_credited: 0,
      finalized_at: new Date().toISOString(),
    }, { onConflict: "brand_id,machine_ride_id", ignoreDuplicates: false });
    return { error: "A api-key da cidade não foi configurada. Acesse a configuração da integração e preencha o campo.", status: 400 };
  }

  // Build city-level headers (used for V1 endpoint)
  const cityHeaders = buildApiHeaders(cityApiKey, basicUser, basicPass);

  // Build matrix-level headers for Recibo endpoint (headquarters credentials)
  const matrixApiKey = (integration.matrix_api_key || "").trim();
  const matrixUser = (integration.matrix_basic_auth_user || "").trim();
  const matrixPass = (integration.matrix_basic_auth_password || "").trim();
  const matrixHeaders = matrixApiKey
    ? buildApiHeaders(matrixApiKey, matrixUser, matrixPass)
    : undefined; // fallback: fetchRideData will use cityHeaders for Recibo

  logger.info("TaxiMachine auth config", {
    brandId,
    machineRideId,
    hasBasicAuth: !!(basicUser && basicPass),
    hasCityApiKey: true,
    hasMatrixCredentials: !!matrixApiKey,
    cityApiKeyPrefix: cityApiKey ? `${cityApiKey.slice(0, 6)}***` : null,
  });

  // Dual-endpoint fetch with configurable primary endpoint
  const preferredEndpoint = (integration.preferred_endpoint || "recibo") as "recibo" | "request_v1";
  const rideResult = await fetchRideData(cityHeaders, machineRideId, preferredEndpoint, matrixHeaders);

  if (!rideResult.ok) {
    logger.error("TaxiMachine fetch failed", { machineRideId, error: rideResult.error });
    logAudit(sb, "MACHINE_API_ERROR", { brandId, entityId: machineRideId, ip, details: { error: rideResult.error, status: rideResult.status } });

    await sb.from("machine_rides").upsert({
      brand_id: brandId,
      branch_id: branchId,
      machine_ride_id: machineRideId,
      ride_status: rideResult.status === 401 ? "CREDENTIAL_ERROR" : "API_ERROR",
      ride_value: 0,
      points_credited: 0,
      finalized_at: new Date().toISOString(),
    }, { onConflict: "brand_id,machine_ride_id", ignoreDuplicates: false });

    if (rideResult.status === 401) {
      return { error: "Credenciais TaxiMachine inválidas. Verifique a api-key na configuração da integração.", status: 400 };
    }
    return { error: rideResult.error, status: 502 };
  }

  const { rideValue, passengerName, passengerCpf, passengerPhone, passengerEmail, driverName, driverId, source } = rideResult.data;
  logger.info("Ride data fetched", { machineRideId, source, rideValue, passengerName, hasCpf: !!passengerCpf, hasPhone: !!passengerPhone });

  if (rideValue <= 0) {
    await sb.from("machine_rides").upsert({
      brand_id: brandId,
      branch_id: branchId,
      machine_ride_id: machineRideId,
      ride_value: 0,
      ride_status: "NO_VALUE",
      points_credited: 0,
      passenger_cpf: passengerCpf,
      finalized_at: new Date().toISOString(),
    }, { onConflict: "brand_id,machine_ride_id", ignoreDuplicates: false });
    logAudit(sb, "MACHINE_RIDE_NO_VALUE", { brandId, entityId: machineRideId, ip, details: { ride_value: 0, source } });
    return { data: { message: "Ride has no value", machine_ride_id: machineRideId, points_credited: 0 } };
  }

  // Resolve the branch to use for customer creation
  const customerBranchId = branchId || integration.branch_id;

  // --- Cascading customer lookup ---
  let customer: any = null;
  let matchedBy: string | null = null;

  const cascadeResult = await findCustomerCascade(sb, brandId, passengerCpf, passengerPhone, passengerName);
  if (cascadeResult) {
    customer = cascadeResult.customer;
    matchedBy = cascadeResult.matchedBy;
  }

  // If not found, create a new customer
  let customerId: string | null = null;
  let pointsCredited = false;
  let points = 0;

  if (!customer) {
    // Determine which branch to use
    let resolveBranchId = customerBranchId;
    if (!resolveBranchId) {
      const { data: branch } = await sb
        .from("branches")
        .select("id")
        .eq("brand_id", brandId)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      resolveBranchId = branch?.id || null;
    }

    if (resolveBranchId) {
      const customerDisplayName = passengerName || (passengerCpf ? `Passageiro •••${passengerCpf.slice(-4)}` : `Passageiro corrida #${machineRideId}`);
      const { data: created } = await sb
        .from("customers")
        .insert({
          brand_id: brandId,
          branch_id: resolveBranchId,
          cpf: passengerCpf || null,
          phone: passengerPhone || null,
          name: customerDisplayName,
          points_balance: 0,
          money_balance: 0,
          ride_count: 0,
          customer_tier: "INICIANTE",
          crm_sync_status: "PENDING",
        })
        .select(CUSTOMER_SELECT)
        .single();

      if (created) {
        customer = created;
        logAudit(sb, "MACHINE_CUSTOMER_CREATED", {
          brandId,
          entityId: created.id,
          ip,
          details: {
            name: customerDisplayName,
            cpf_masked: passengerCpf ? `***${passengerCpf.slice(-4)}` : null,
            phone: passengerPhone,
            branch_id: resolveBranchId,
          },
        });
      }
    }
  }

  if (customer) {
    customerId = customer.id;

    // --- Tier-based points calculation ---
    const customerTier = customer.customer_tier || "INICIANTE";
    const { pointsPerReal, source: ruleSource } = await resolveEffectivePointsPerReal(
      sb, brandId, customer.branch_id || branchId, customerTier
    );
    points = Math.floor(rideValue * pointsPerReal);
    logger.info("Points calculated", { machineRideId, customerTier, pointsPerReal, ruleSource, rideValue, points });

    if (points > 0) {
      await sb.from("points_ledger").insert({
        brand_id: brandId,
        branch_id: customer.branch_id,
        customer_id: customer.id,
        entry_type: "CREDIT",
        points_amount: points,
        money_amount: rideValue,
        reason: `Corrida TaxiMachine #${machineRideId} - R$ ${rideValue.toFixed(2)} (${customerTier} ×${pointsPerReal})`,
        reference_type: "MACHINE_RIDE",
      });

      // Update points_balance, ride_count, and recalculate tier
      const newRideCount = (customer.ride_count || 0) + 1;
      const newTier = getTierFromRideCount(newRideCount);
      await sb
        .from("customers")
        .update({
          points_balance: (customer.points_balance || 0) + points,
          ride_count: newRideCount,
          customer_tier: newTier,
        })
        .eq("id", customer.id);

      pointsCredited = true;
    }

    // --- Mirror to crm_contacts ---
    const contactPayload: Record<string, unknown> = {
      brand_id: brandId,
      branch_id: customer.branch_id || branchId,
      customer_id: customer.id,
      name: passengerName || customer.name || null,
      phone: passengerPhone || customer.phone || null,
      email: passengerEmail || null,
      cpf: passengerCpf || null,
      source: "MOBILITY_APP",
      is_active: true,
      ride_count: (customer.ride_count || 0) + 1,
    };
    // Remove null keys to avoid overwriting good data
    Object.keys(contactPayload).forEach(k => { if (contactPayload[k] === null) delete contactPayload[k]; });

    sb.from("crm_contacts")
      .upsert(contactPayload, { onConflict: "brand_id,customer_id" })
      .then(({ error }) => {
        if (error) logger.error("crm_contacts upsert error", { error });
      });
  }

  // --- Driver scoring ---
  let driverPointsCredited = 0;
  let driverCustomerId: string | null = null;
  let driverMonthlyRides = 0;
  let driverVolumeTierLabel: string | null = null;

  if (pointsCredited && points > 0 && integration.driver_points_enabled && driverId) {
    // 1. Try advanced rules from driver_points_rules table
    const { data: advancedRule } = await sb
      .from("driver_points_rules")
      .select("*")
      .eq("brand_id", brandId)
      .eq("is_active", true)
      .or(branchId ? `branch_id.eq.${branchId},branch_id.is.null` : "branch_id.is.null")
      .order("branch_id", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    // Determine driver points based on rule
    let driverPoints = 0;
    let reasonDetail = "";

    if (advancedRule) {
      const ruleMode = advancedRule.rule_mode || "PER_REAL";

      if (ruleMode === "FIXED") {
        driverPoints = Number(advancedRule.fixed_points_per_ride) || 10;
        reasonDetail = `Fixo: ${driverPoints} pts/corrida`;
      } else if (ruleMode === "PERCENT") {
        const pct = Number(advancedRule.percent_of_passenger) || 50;
        driverPoints = Math.floor(points * (pct / 100));
        reasonDetail = `${pct}% de ${points} pts passageiro`;
      } else if (ruleMode === "VOLUME_TIER") {
        // We need to resolve the driver customer first to check ride count
        // Will be calculated after driver customer resolution below
        driverPoints = -1; // sentinel: calculate after finding driver
        reasonDetail = "volume_tier";
      } else {
        // PER_REAL
        const ppr = Number(advancedRule.points_per_real) || 1;
        driverPoints = Math.floor(rideValue * ppr);
        reasonDetail = `${ppr} pts/R$ × R$ ${rideValue.toFixed(2)}`;
      }
    } else {
      // Fallback to integration-level config
      const driverMode = integration.driver_points_mode || "PERCENT";
      const driverPercent = Number(integration.driver_points_percent) || 50;
      const driverPerReal = Number(integration.driver_points_per_real) || 1;
      driverPoints = driverMode === "PER_REAL"
        ? Math.floor(rideValue * driverPerReal)
        : Math.floor(points * (driverPercent / 100));
      reasonDetail = driverMode === "PER_REAL"
        ? `${driverPerReal} pts/R$ × R$ ${rideValue.toFixed(2)}`
        : `${driverPercent}% de ${points} pts`;
    }

    if (driverPoints !== 0) {
      // Fetch driver details from TaxiMachine API
      const driverHeaders = matrixHeaders ?? cityHeaders;
      const driverDetails = await fetchDriverDetails(driverId, driverHeaders);
      const driverDisplayName = driverDetails.name || driverName || `Motorista #${driverId}`;
      const driverTag = integration.driver_customer_tag || "MOTORISTA";

      // Find or create driver customer
      const driverCascade = await findCustomerCascade(
        sb, brandId,
        driverDetails.cpf,
        driverDetails.phone,
        driverDisplayName
      );

      let driverCustomer: any = null;
      let driverMatchedBy: string | null = null;

      if (driverCascade) {
        driverCustomer = driverCascade.customer;
        driverMatchedBy = driverCascade.matchedBy;
      }

      if (!driverCustomer) {
        let resolveBranchId = branchId || integration.branch_id;
        if (!resolveBranchId) {
          const { data: branch } = await sb
            .from("branches").select("id")
            .eq("brand_id", brandId).eq("is_active", true)
            .order("created_at", { ascending: true }).limit(1).maybeSingle();
          resolveBranchId = branch?.id || null;
        }
        if (resolveBranchId) {
          const taggedName = `[${driverTag}] ${driverDisplayName}`;
          const { data: created } = await sb
            .from("customers")
            .insert({
              brand_id: brandId,
              branch_id: resolveBranchId,
              cpf: driverDetails.cpf || null,
              phone: driverDetails.phone || null,
              name: taggedName,
              points_balance: 0,
              money_balance: 0,
              ride_count: 0,
              customer_tier: "INICIANTE",
              crm_sync_status: "PENDING",
              driver_monthly_ride_count: 0,
              driver_cycle_start: new Date().toISOString().slice(0, 10),
            })
            .select("id, branch_id, points_balance, name, phone, customer_tier, ride_count, driver_monthly_ride_count, driver_cycle_start")
            .single();
          if (created) {
            driverCustomer = created;
            logAudit(sb, "MACHINE_DRIVER_CREATED", {
              brandId, entityId: created.id, ip,
              details: { name: taggedName, driver_id: driverId, tag: driverTag },
            });
          }
        }
      }

      if (driverCustomer) {
        driverCustomerId = driverCustomer.id;

        // Handle volume cycle reset
        const cycleStart = driverCustomer.driver_cycle_start ? new Date(driverCustomer.driver_cycle_start) : new Date();
        const now = new Date();
        const cycleDays = advancedRule?.volume_cycle_days || 30;
        const daysSinceCycleStart = Math.floor((now.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));
        let currentMonthlyRides = Number(driverCustomer.driver_monthly_ride_count) || 0;

        if (daysSinceCycleStart >= cycleDays) {
          // Reset cycle
          currentMonthlyRides = 0;
          await sb.from("customers").update({
            driver_monthly_ride_count: 0,
            driver_cycle_start: now.toISOString().slice(0, 10),
          }).eq("id", driverCustomer.id);
        }

        currentMonthlyRides += 1;
        driverMonthlyRides = currentMonthlyRides;

        // If VOLUME_TIER, calculate points now
        if (driverPoints === -1 && advancedRule) {
          const tiers = (advancedRule.volume_tiers || []) as Array<{ min: number; max: number | null; mode: string; value: number }>;
          const matchedTier = tiers.find(
            (t) => currentMonthlyRides >= t.min && (t.max === null || currentMonthlyRides <= t.max)
          );
          if (matchedTier) {
            if (matchedTier.mode === "FIXED") {
              driverPoints = matchedTier.value;
            } else if (matchedTier.mode === "PERCENT") {
              driverPoints = Math.floor(points * (matchedTier.value / 100));
            } else {
              driverPoints = Math.floor(rideValue * matchedTier.value);
            }
            driverVolumeTierLabel = `Faixa ${matchedTier.min}-${matchedTier.max ?? "∞"} (${currentMonthlyRides} corridas)`;
            reasonDetail = `Volume: ${driverVolumeTierLabel} → ${matchedTier.value} ${matchedTier.mode === "FIXED" ? "pts" : matchedTier.mode === "PERCENT" ? "%" : "pts/R$"}`;
          } else {
            driverPoints = 0;
            reasonDetail = "Sem faixa aplicável";
          }
        }

        if (driverPoints > 0) {
          // Credit driver points
          await sb.from("points_ledger").insert({
            brand_id: brandId,
            branch_id: driverCustomer.branch_id,
            customer_id: driverCustomer.id,
            entry_type: "CREDIT",
            points_amount: driverPoints,
            money_amount: rideValue,
            reason: `Corrida TaxiMachine #${machineRideId} - Motorista (${reasonDetail})`,
            reference_type: "MACHINE_RIDE",
          });

          const newRideCount = (driverCustomer.ride_count || 0) + 1;
          const newTier = getTierFromRideCount(newRideCount);
          await sb.from("customers").update({
            points_balance: (driverCustomer.points_balance || 0) + driverPoints,
            ride_count: newRideCount,
            customer_tier: newTier,
            driver_monthly_ride_count: currentMonthlyRides,
          }).eq("id", driverCustomer.id);

          driverPointsCredited = driverPoints;
        }

        // Mirror driver to crm_contacts
        const driverContactPayload: Record<string, unknown> = {
          brand_id: brandId,
          branch_id: driverCustomer.branch_id || branchId,
          customer_id: driverCustomer.id,
          name: driverDetails.name || driverName || null,
          phone: driverDetails.phone || null,
          email: driverDetails.email || null,
          cpf: driverDetails.cpf || null,
          source: "MOBILITY_DRIVER",
          is_active: true,
          ride_count: (driverCustomer.ride_count || 0) + 1,
        };
        Object.keys(driverContactPayload).forEach(k => { if (driverContactPayload[k] === null) delete driverContactPayload[k]; });

        sb.from("crm_contacts")
          .upsert(driverContactPayload, { onConflict: "brand_id,customer_id" })
          .then(({ error }) => { if (error) logger.error("crm_contacts driver upsert error", { error }); });

        logger.info("Driver points credited", {
          machineRideId, driverId, driverPoints: driverPointsCredited,
          passengerPoints: points, driverCustomerId, driverMatchedBy,
          monthlyRides: currentMonthlyRides, volumeTier: driverVolumeTierLabel,
        });
      }
    }
  }

  // Persist ride
  await sb.from("machine_rides").upsert({
    brand_id: brandId,
    branch_id: branchId,
    machine_ride_id: machineRideId,
    passenger_name: passengerName || null,
    passenger_cpf: passengerCpf || null,
    passenger_phone: passengerPhone || null,
    passenger_email: passengerEmail || null,
    ride_value: rideValue,
    ride_status: "FINALIZED",
    points_credited: pointsCredited ? points : 0,
    finalized_at: new Date().toISOString(),
    driver_name: driverName || null,
    driver_id: driverId || null,
    driver_points_credited: driverPointsCredited,
    driver_customer_id: driverCustomerId,
  }, { onConflict: "brand_id,machine_ride_id", ignoreDuplicates: false });

  // Update integration counters
  const { error: updateErr } = await sb
    .from("machine_integrations")
    .update({
      total_rides: integration.total_rides + 1,
      total_points: integration.total_points + (pointsCredited ? points : 0),
      last_ride_processed_at: new Date().toISOString(),
    })
    .eq("id", integration.id);

  if (updateErr) logger.error("Update integration counters error", { error: updateErr });

  logAudit(sb, "MACHINE_RIDE_PROCESSED", {
    brandId,
    entityId: machineRideId,
    ip,
    details: {
      ride_value: rideValue,
      points,
      points_credited: pointsCredited,
      matched_by: matchedBy,
      customer_id: customerId,
      passenger_name: passengerName,
      passenger_cpf: passengerCpf ? `***${passengerCpf.slice(-4)}` : null,
      driver_name: driverName,
      data_source: source,
      branch_id: branchId,
    },
  });

  // Insert into machine_ride_notifications for realtime dashboard
  if (pointsCredited) {
    let resolvedCityName: string | null = null;
    if (branchId || integration.branch_id) {
      const { data: branchData } = await sb
        .from("branches")
        .select("city, state")
        .eq("id", branchId || integration.branch_id)
        .maybeSingle();
      if (branchData?.city) {
        resolvedCityName = `${branchData.city}${branchData.state ? ` - ${branchData.state}` : ""}`;
      }
    }

    const customerFullName = customer?.name || passengerName || (passengerCpf ? `Passageiro •••${passengerCpf.slice(-4)}` : null);
    const customerPhone = customer?.phone || passengerPhone || null;

    await sb.from("machine_ride_notifications").insert({
      brand_id: brandId,
      branch_id: branchId,
      machine_ride_id: machineRideId,
      customer_id: customerId || null,
      customer_name: customerFullName,
      customer_phone: customerPhone,
      customer_cpf_masked: passengerCpf ? `•••${passengerCpf.slice(-4)}` : null,
      city_name: resolvedCityName,
      points_credited: points,
      ride_value: rideValue,
      finalized_at: new Date().toISOString(),
      driver_name: driverName || null,
    });

    // Send Telegram notification if chat_id configured (fire-and-forget)
    if (integration.telegram_chat_id) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        fetch(`${supabaseUrl}/functions/v1/send-telegram-ride-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            chat_id: integration.telegram_chat_id,
            customer_name: customerFullName,
            customer_phone: customerPhone,
            city_name: resolvedCityName,
            ride_value: rideValue,
            points_credited: points,
            finalized_at: new Date().toISOString(),
            machine_ride_id: machineRideId,
            driver_name: driverName || null,
          }),
        }).catch((e) => logger.error("Telegram notification error", { error: String(e) }));

        // Send driver Telegram notification if driver was scored
        if (driverPointsCredited > 0) {
          const driverDisplayName = driverName || `Motorista #${driverId || "?"}`;
          fetch(`${supabaseUrl}/functions/v1/send-telegram-ride-notification`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({
              chat_id: integration.telegram_chat_id,
              customer_name: customerFullName,
              customer_phone: customerPhone,
              city_name: resolvedCityName,
              ride_value: rideValue,
              points_credited: points,
              finalized_at: new Date().toISOString(),
              machine_ride_id: machineRideId,
              driver_name: driverDisplayName,
              is_driver_notification: true,
              driver_points: driverPointsCredited,
            }),
          }).catch((e) => logger.error("Telegram driver notification error", { error: String(e) }));
        }
      } catch (e) {
        logger.error("Telegram notification setup error", { error: String(e) });
      }
    }
  }

  // Fire callback URL if configured (fire-and-forget)
  if (pointsCredited && integration.callback_url) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      fetch(integration.callback_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          event: "points_credited",
          machine_ride_id: machineRideId,
          ride_value: rideValue,
          points,
          passenger_name: passengerName,
          cpf_masked: passengerCpf ? `***${passengerCpf.slice(-4)}` : null,
          customer_id: customerId,
          brand_id: brandId,
          branch_id: branchId,
          timestamp: new Date().toISOString(),
        }),
      })
        .then(() => clearTimeout(timeout))
        .catch((e) => {
          clearTimeout(timeout);
          logger.error("Callback URL error", { url: integration.callback_url, error: String(e) });
        });
    } catch (e) {
      logger.error("Callback URL setup error", { error: String(e) });
    }
  }

  return {
    data: {
      success: true,
      machine_ride_id: machineRideId,
      ride_value: rideValue,
      points_credited: pointsCredited ? points : 0,
      customer_found: !!matchedBy,
      customer_created: !matchedBy && !!customerId,
      matched_by: matchedBy,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") || "unknown";

  // Rate limiting
  const rlKey = rateLimitKey("machine-webhook", req);
  const rlResult = await checkRateLimit(sb, rlKey, { maxRequests: 30, windowSeconds: 60 });
  if (!rlResult.allowed) {
    logAudit(sb, "MACHINE_RATE_LIMITED", { ip, details: { reason: "rate_limit" } });
    return rateLimitResponse(rlResult, corsHeaders);
  }

  try {
    const body = await req.json();
    const { request_id, status_code } = body;

    // Log full raw payload to identify alternative ID fields and client data
    logger.info("Raw webhook payload", { payload: JSON.stringify(body).slice(0, 2000) });

    if (!request_id || !status_code) {
      logAudit(sb, "MACHINE_WEBHOOK_REJECTED", { ip, details: { reason: "missing_fields", request_id, status_code } });
      return json({ error: "Missing request_id or status_code" }, 400);
    }

    // Find integration
    const integration = await findIntegration(sb, req, body);
    if (!integration) {
      logAudit(sb, "MACHINE_WEBHOOK_AUTH_FAILED", { ip, details: { request_id, reason: "integration_not_found" } });
      return json({ error: "Integration not found or inactive" }, 401);
    }

    const brandId = integration.brand_id;
    const branchId = integration.branch_id || null;
    const machineRideId = String(request_id);
    const mappedStatus = STATUS_MAP[status_code] || status_code;

    // Update last_webhook_at
    sb.from("machine_integrations")
      .update({ last_webhook_at: new Date().toISOString() })
      .eq("id", integration.id)
      .then();

    // 1. Always log the event for real-time tracking
    await sb.from("machine_ride_events").insert({
      brand_id: brandId,
      machine_ride_id: machineRideId,
      status_code,
      raw_payload: body,
      ip_address: ip,
    });

    logAudit(sb, "MACHINE_WEBHOOK_RECEIVED", { brandId, entityId: machineRideId, ip, details: { status_code, mapped: mappedStatus, branch_id: branchId } });

    // 2. Upsert ride status (for non-finalized, just track status)
    if (status_code !== "F") {
      await sb.from("machine_rides").upsert({
        brand_id: brandId,
        branch_id: branchId,
        machine_ride_id: machineRideId,
        ride_status: mappedStatus,
        ride_value: 0,
        points_credited: 0,
      }, { onConflict: "brand_id,machine_ride_id", ignoreDuplicates: false });

      return json({
        success: true,
        machine_ride_id: machineRideId,
        status: mappedStatus,
        message: "Event recorded",
      });
    }

    // 3. Finalized ride — full processing with points
    // Anti-duplication check
    const { data: existing } = await sb
      .from("machine_rides")
      .select("id, ride_status")
      .eq("brand_id", brandId)
      .eq("machine_ride_id", machineRideId)
      .maybeSingle();

    if (existing?.ride_status === "FINALIZED") {
      logAudit(sb, "MACHINE_RIDE_DUPLICATE", { brandId, entityId: machineRideId, ip, details: { reason: "already_finalized" } });
      return json({ message: "Ride already processed", machine_ride_id: machineRideId });
    }

    const result = await processFinalized(sb, integration, brandId, branchId, machineRideId, ip);
    if (result.error) {
      return json({ error: result.error }, result.status);
    }
    return json(result.data!);
  } catch (err) {
    logger.error("machine-webhook error", { error: String(err) });
    logAudit(sb, "MACHINE_WEBHOOK_ERROR", { ip, details: { error: String(err) } });
    return json({ error: "Internal server error" }, 500);
  }
});
