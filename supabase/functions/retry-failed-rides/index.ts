import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";
import { fetchRideData, buildApiHeaders } from "../_shared/fetchRideData.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logger = createEdgeLogger("retry-failed-rides");

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function findCustomerCascade(
  sb: ReturnType<typeof createClient>,
  brandId: string,
  cpf: string | null,
  phone: string | null,
  name: string | null
) {
  if (cpf) {
    const { data } = await sb
      .from("customers")
      .select("id, branch_id, points_balance, name, phone")
      .eq("brand_id", brandId)
      .eq("cpf", cpf)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (data) return { customer: data, matchedBy: "cpf" };
  }
  if (phone) {
    const { data } = await sb
      .from("customers")
      .select("id, branch_id, points_balance, name, phone")
      .eq("brand_id", brandId)
      .eq("phone", phone)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (data) return { customer: data, matchedBy: "phone" };
  }
  if (name) {
    const { data } = await sb
      .from("customers")
      .select("id, branch_id, points_balance, name, phone")
      .eq("brand_id", brandId)
      .eq("name", name)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (data) return { customer: data, matchedBy: "name" };
  }
  return null;
}

async function retryRide(
  sb: ReturnType<typeof createClient>,
  integration: any,
  ride: any,
) {
  const isBackfill = ride.ride_status === "FINALIZED";
  const brandId = ride.brand_id;
  const branchId = ride.branch_id || integration.branch_id || null;
  const machineRideId = ride.machine_ride_id;

  const receiptApiKey = (integration.receipt_api_key || integration.api_key || "").trim();
  const basicUser = (integration.basic_auth_user || "").trim();
  const basicPass = (integration.basic_auth_password || "").trim();

  if (!receiptApiKey || receiptApiKey.startsWith("url-only-")) {
    return { machineRideId, status: "SKIP", reason: "no_receipt_api_key" };
  }

  const headers = buildApiHeaders(receiptApiKey, basicUser, basicPass);

  const preferredEndpoint = (integration.preferred_endpoint || "recibo") as "recibo" | "request_v1";
  logger.info("Retry: fetching ride data (dual endpoint)", { machineRideId, preferredEndpoint });

  const rideResult = await fetchRideData(headers, machineRideId, preferredEndpoint);

  if (!rideResult.ok) {
    logger.error("Retry: both endpoints failed", { machineRideId, error: rideResult.error });
    return { machineRideId, status: "FAILED", reason: rideResult.error };
  }

  const { rideValue, passengerName, passengerCpf, passengerPhone, source } = rideResult.data;

  if (rideValue <= 0) {
    await sb.from("machine_rides").update({
      ride_status: "NO_VALUE",
      ride_value: 0,
      points_credited: 0,
      passenger_cpf: passengerCpf,
      finalized_at: new Date().toISOString(),
    }).eq("id", ride.id);
    return { machineRideId, status: "NO_VALUE", rideValue: 0, source };
  }

  const points = Math.floor(rideValue);

  // Resolve branch
  let customerBranchId = branchId;
  if (!customerBranchId) {
    const { data: branch } = await sb
      .from("branches")
      .select("id")
      .eq("brand_id", brandId)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    customerBranchId = branch?.id || null;
  }

  // Find or create customer
  let customer: any = null;
  let matchedBy: string | null = null;
  const cascadeResult = await findCustomerCascade(sb, brandId, passengerCpf, passengerPhone, passengerName);
  if (cascadeResult) {
    customer = cascadeResult.customer;
    matchedBy = cascadeResult.matchedBy;
  }

  let customerId: string | null = null;
  let pointsCredited = false;

  if (!customer && customerBranchId) {
    const customerDisplayName = passengerName || (passengerCpf ? `Passageiro •••${passengerCpf.slice(-4)}` : `Passageiro corrida #${machineRideId}`);
    const { data: created } = await sb
      .from("customers")
      .insert({
        brand_id: brandId,
        branch_id: customerBranchId,
        cpf: passengerCpf || null,
        phone: passengerPhone || null,
        name: customerDisplayName,
        points_balance: 0,
        money_balance: 0,
      })
      .select("id, branch_id, points_balance")
      .single();
    if (created) customer = created;
  }

  if (customer && points > 0) {
    customerId = customer.id;
    await sb.from("points_ledger").insert({
      brand_id: brandId,
      branch_id: customer.branch_id,
      customer_id: customer.id,
      entry_type: "CREDIT",
      points_amount: points,
      money_amount: rideValue,
      reason: `Corrida TaxiMachine #${machineRideId} (retry) - R$ ${rideValue.toFixed(2)}`,
      reference_type: "MACHINE_RIDE",
    });

    await sb
      .from("customers")
      .update({ points_balance: (customer.points_balance || 0) + points })
      .eq("id", customer.id);

    pointsCredited = true;
  }

  // Update ride to FINALIZED
  await sb.from("machine_rides").update({
    ride_status: "FINALIZED",
    ride_value: rideValue,
    points_credited: pointsCredited ? points : 0,
    passenger_cpf: passengerCpf || null,
    finalized_at: new Date().toISOString(),
  }).eq("id", ride.id);

  // Update integration counters
  await sb
    .from("machine_integrations")
    .update({
      total_rides: integration.total_rides + 1,
      total_points: integration.total_points + (pointsCredited ? points : 0),
      last_ride_processed_at: new Date().toISOString(),
    })
    .eq("id", integration.id);

  // Insert notification for realtime dashboard
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

    await sb.from("machine_ride_notifications").insert({
      brand_id: brandId,
      branch_id: branchId,
      machine_ride_id: machineRideId,
      customer_name: customer?.name || passengerName || null,
      customer_phone: customer?.phone || passengerPhone || null,
      customer_cpf_masked: passengerCpf ? `•••${passengerCpf.slice(-4)}` : null,
      city_name: resolvedCityName,
      points_credited: points,
      ride_value: rideValue,
      finalized_at: new Date().toISOString(),
    });
  }

  logger.info("Retry: ride processed successfully", {
    machineRideId,
    rideValue,
    points: pointsCredited ? points : 0,
    matchedBy,
    customerId,
    source,
  });

  return {
    machineRideId,
    status: "FINALIZED",
    rideValue,
    pointsCredited: pointsCredited ? points : 0,
    source,
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

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const { brand_id } = body;

    if (!brand_id) {
      return json({ error: "brand_id is required" }, 400);
    }

    // Also include FINALIZED rides with no passenger data for backfill
    const { data: failedRides, error: fetchErr } = await sb
      .from("machine_rides")
      .select("*")
      .eq("brand_id", brand_id)
      .or("ride_status.in.(API_ERROR,CREDENTIAL_ERROR),and(ride_status.eq.FINALIZED,passenger_cpf.is.null)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (fetchErr) {
      logger.error("Failed to fetch rides", { error: fetchErr });
      return json({ error: "Failed to fetch failed rides" }, 500);
    }

    if (!failedRides || failedRides.length === 0) {
      return json({ message: "No failed rides to retry", retried: 0 });
    }

    logger.info("Retrying failed rides", { brand_id, count: failedRides.length });

    const { data: integrations } = await sb
      .from("machine_integrations")
      .select("*")
      .eq("brand_id", brand_id)
      .eq("is_active", true);

    if (!integrations || integrations.length === 0) {
      return json({ error: "No active integration found for this brand" }, 400);
    }

    const results: any[] = [];

    for (const ride of failedRides) {
      const integration =
        integrations.find((i: any) => i.branch_id === ride.branch_id) ||
        integrations[0];

      try {
        const result = await retryRide(sb, integration, ride);
        results.push(result);
      } catch (err) {
        logger.error("Retry error for ride", { machineRideId: ride.machine_ride_id, error: String(err) });
        results.push({ machineRideId: ride.machine_ride_id, status: "ERROR", reason: String(err) });
      }
    }

    const finalized = results.filter((r) => r.status === "FINALIZED").length;
    const failed = results.filter((r) => r.status === "FAILED" || r.status === "ERROR").length;

    return json({
      message: `Retry complete: ${finalized} finalized, ${failed} still failing`,
      retried: results.length,
      finalized,
      failed,
      results,
    });
  } catch (err) {
    logger.error("retry-failed-rides error", { error: String(err) });
    return json({ error: "Internal server error" }, 500);
  }
});
