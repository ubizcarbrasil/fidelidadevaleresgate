/**
 * Dual-endpoint TaxiMachine ride data fetcher.
 * Tries the Recibo endpoint first, falls back to Request V1.
 * If Recibo succeeds but lacks passenger phone, enriches from V1.
 *
 * IMPORTANT: Recibo endpoint requires MATRIX (headquarters) credentials,
 * while V1 uses city-level credentials.
 */

import { createEdgeLogger } from "./edgeLogger.ts";

const logger = createEdgeLogger("fetchRideData");

/** Both endpoints live on the same base domain */
const API_BASE_URL = "https://api.taximachine.com.br";

export interface RideData {
  source: "recibo" | "request_v1" | "recibo+v1";
  rideValue: number;
  passengerName: string | null;
  passengerCpf: string | null;
  passengerPhone: string | null;
  passengerEmail: string | null;
  driverName: string | null;
  driverId: string | null;
  clienteId: string | null;
}

export interface DriverDetails {
  cpf: string | null;
  phone: string | null;
  email: string | null;
  name: string | null;
}

export type FetchRideResult =
  | { ok: true; data: RideData }
  | { ok: false; error: string; status: number };

/**
 * Parse the Recibo API response.
 * The API returns an ARRAY: [{ success, response: { cliente, motorista, corrida, ... } }]
 */
function parseRecibo(json: any): Omit<RideData, "source"> | null {
  // API returns an array — take first element
  const item = Array.isArray(json) ? json[0] : json;

  // Validate success flag
  if (item?.success === false) {
    logger.warn("Recibo returned success=false", { message: item?.message || item?.msg });
    return null;
  }

  const response = item?.response || item;
  const clienteBlock = response?.cliente || {};
  const motoristaBlock = response?.motorista || response?.condutor || {};
  const corridaBlock = response?.corrida || response?.dados_solicitacao || {};
  const rawCpf = (clienteBlock.cpf || "").replace(/\D/g, "");

  return {
    rideValue: Number(corridaBlock.valor || 0),
    passengerName: clienteBlock.nome || null,
    passengerCpf: rawCpf || null,
    passengerPhone: null,  // Recibo API does not return passenger phone
    passengerEmail: null,  // Recibo API does not return passenger email
    driverName: motoristaBlock.nome || null,
    clienteId: clienteBlock.cliente_id || null,
  };
}

function parseRequestV1(json: any): Omit<RideData, "source"> {
  // Log raw V1 JSON for debugging missing client data
  logger.info("V1 raw payload (first 1500 chars)", {
    raw: JSON.stringify(json).slice(0, 1500),
  });

  const firstStop = Array.isArray(json?.stops) ? json.stops[0] : null;
  const client = firstStop?.client || {};
  const driver = json?.driver || {};

  // Also check for client data in alternative locations
  const rootClient = json?.client || {};
  const passenger = json?.passenger || {};

  const name = client.name || rootClient.name || passenger.name || json?.passenger_name || null;
  const phone = client.phone || rootClient.phone || passenger.phone || json?.passenger_phone || null;
  const cpf = (client.cpf || rootClient.cpf || passenger.cpf || json?.passenger_cpf || "").replace(/\D/g, "") || null;

  if (name || phone || cpf) {
    logger.info("V1 client data found", { name, hasPhone: !!phone, hasCpf: !!cpf, source: client.name ? "stops[0].client" : rootClient.name ? "root.client" : "passenger/root" });
  }

  return {
    rideValue: Number(json?.finished?.final_value || 0),
    passengerName: name,
    passengerCpf: cpf,
    passengerPhone: phone,
    passengerEmail: null, // V1 does not return email
    driverName: driver.name || null,
    clienteId: null, // V1 does not return cliente_id
  };
}

/**
 * Fetch complementary client details from TaxiMachine /api/integracao/cliente endpoint.
 * Uses matrix (headquarters) credentials. Returns phone and email if available.
 */
export async function fetchClientDetails(
  clienteId: string,
  matrixHeaders: Record<string, string>
): Promise<{ phone: string | null; email: string | null; cpf: string | null; name: string | null }> {
  const url = `${API_BASE_URL}/api/integracao/cliente?id=${clienteId}`;
  logger.info("Fetching client details", { clienteId, url });

  try {
    const res = await fetch(url, { headers: matrixHeaders });
    if (!res.ok) {
      const body = await res.text();
      logger.warn("Client details fetch failed", { clienteId, status: res.status, body: body.slice(0, 300) });
      return { phone: null, email: null, cpf: null, name: null };
    }

    const json = await res.json();
    // Response: [{ success: true, response: [{ id, nome, email, telefone, cpf, ... }] }]
    const item = Array.isArray(json) ? json[0] : json;
    if (item?.success === false) {
      logger.warn("Client details returned success=false", { clienteId });
      return { phone: null, email: null, cpf: null, name: null };
    }

    const responseArr = item?.response;
    const client = Array.isArray(responseArr) ? responseArr[0] : responseArr;
    if (!client) {
      logger.warn("Client details response empty", { clienteId });
      return { phone: null, email: null, cpf: null, name: null };
    }

    const phone = client.telefone || null;
    const email = client.email || null;
    const rawCpf = (client.cpf || "").replace(/\D/g, "") || null;
    const name = client.nome || null;

    logger.info("Client details fetched", { clienteId, hasPhone: !!phone, hasEmail: !!email, hasCpf: !!rawCpf });
    return { phone, email, cpf: rawCpf, name };
  } catch (e) {
    logger.warn("Client details fetch exception", { clienteId, error: String(e) });
    return { phone: null, email: null, cpf: null, name: null };
  }
}
export function buildApiHeaders(
  receiptApiKey: string,
  basicUser: string,
  basicPass: string
): Record<string, string> {
  const headers: Record<string, string> = {
    "api-key": receiptApiKey,
    "User-Agent": "ua-ubizcar",
    "Content-Type": "application/json",
  };
  if (basicUser && basicPass) {
    headers["Authorization"] = `Basic ${btoa(`${basicUser}:${basicPass}`)}`;
  }
  return headers;
}

/**
 * Fetch ride data from TaxiMachine APIs.
 * @param headers - City-level headers (used for V1 endpoint)
 * @param machineRideId - The ride ID from TaxiMachine
 * @param preferredEndpoint - Which endpoint to try first
 * @param matrixHeaders - Matrix (headquarters) headers for Recibo endpoint. If not provided, falls back to city headers.
 */
export async function fetchRideData(
  headers: Record<string, string>,
  machineRideId: string,
  preferredEndpoint: "recibo" | "request_v1" = "recibo",
  matrixHeaders?: Record<string, string>
): Promise<FetchRideResult> {
  if (preferredEndpoint === "request_v1") {
    return fetchV1First(headers, machineRideId, matrixHeaders);
  }
  return fetchReciboFirst(headers, machineRideId, matrixHeaders);
}

async function fetchReciboFirst(
  headers: Record<string, string>,
  machineRideId: string,
  matrixHeaders?: Record<string, string>
): Promise<FetchRideResult> {
  const reciboUrl = `${API_BASE_URL}/api/integracao/recibo?id_mch=${machineRideId}`;
  const reciboHeaders = matrixHeaders ?? headers;
  logger.info("Trying recibo endpoint (primary)", { machineRideId, url: reciboUrl, usingMatrixHeaders: !!matrixHeaders });

  let reciboData: Omit<RideData, "source"> | null = null;

  try {
    const reciboRes = await fetch(reciboUrl, { headers: reciboHeaders });
    if (reciboRes.ok) {
      const reciboJson = await reciboRes.json();
      reciboData = parseRecibo(reciboJson);
      if (reciboData) {
        logger.info("Recibo OK", { machineRideId, rideValue: reciboData.rideValue, hasPhone: !!reciboData.passengerPhone, hasEmail: !!reciboData.passengerEmail });
      } else {
        logger.warn("Recibo returned success=false, falling through to V1", { machineRideId });
      }
    } else {
      const body = await reciboRes.text();
      logger.warn("Recibo failed", { machineRideId, status: reciboRes.status, body: body.slice(0, 300) });
    }
  } catch (e) {
    logger.warn("Recibo fetch exception", { machineRideId, error: String(e) });
  }

  if (reciboData) {
    // Enrich with client details API if we have clienteId (phone + email)
    if (reciboData.clienteId && (!reciboData.passengerPhone || !reciboData.passengerEmail)) {
      const enrichHeaders = matrixHeaders ?? headers;
      const clientDetails = await fetchClientDetails(reciboData.clienteId, enrichHeaders);
      if (clientDetails.phone) reciboData.passengerPhone = clientDetails.phone;
      if (clientDetails.email) reciboData.passengerEmail = clientDetails.email;
      // Also enrich CPF and name if missing
      if (!reciboData.passengerCpf && clientDetails.cpf) reciboData.passengerCpf = clientDetails.cpf;
      if (!reciboData.passengerName && clientDetails.name) reciboData.passengerName = clientDetails.name;

      if (clientDetails.phone || clientDetails.email) {
        logger.info("Enriched from client API", { machineRideId, hasPhone: !!clientDetails.phone, hasEmail: !!clientDetails.email });
        return { ok: true, data: { source: "recibo+v1", ...reciboData } };
      }
    }

    // Fallback: try V1 for phone if still missing
    if (!reciboData.passengerPhone) {
      try {
        const v1Url = `${API_BASE_URL}/api/v1/request/${machineRideId}`;
        const v1Res = await fetch(v1Url, { headers });
        if (v1Res.ok) {
          const v1Json = await v1Res.json();
          const v1Data = parseRequestV1(v1Json);
          if (v1Data.passengerPhone) {
            logger.info("Enriched phone from V1", { machineRideId, phone: v1Data.passengerPhone });
            return { ok: true, data: { source: "recibo+v1", ...reciboData, passengerPhone: v1Data.passengerPhone } };
          }
        } else { await v1Res.text().catch(() => {}); }
      } catch (e) {
        logger.warn("V1 enrich fetch exception", { machineRideId, error: String(e) });
      }
    }
    return { ok: true, data: { source: "recibo", ...reciboData } };
  }

  // Fallback to V1
  return tryV1(headers, machineRideId);
}

async function fetchV1First(
  headers: Record<string, string>,
  machineRideId: string,
  matrixHeaders?: Record<string, string>
): Promise<FetchRideResult> {
  const v1Url = `${API_BASE_URL}/api/v1/request/${machineRideId}`;
  logger.info("Trying V1 endpoint (primary)", { machineRideId });

  let v1Data: Omit<RideData, "source"> | null = null;

  try {
    const v1Res = await fetch(v1Url, { headers });
    if (v1Res.ok) {
      const v1Json = await v1Res.json();
      v1Data = parseRequestV1(v1Json);
      logger.info("V1 OK", { machineRideId, rideValue: v1Data.rideValue });
    } else {
      const body = await v1Res.text();
      logger.warn("V1 failed", { machineRideId, status: v1Res.status, body: body.slice(0, 300) });
    }
  } catch (e) {
    logger.warn("V1 fetch exception", { machineRideId, error: String(e) });
  }

  if (v1Data) {
    // Enrich with CPF from recibo if missing
    if (!v1Data.passengerCpf) {
      try {
        const reciboUrl = `${API_BASE_URL}/api/integracao/recibo?id_mch=${machineRideId}`;
        const reciboHeaders = matrixHeaders ?? headers;
        const reciboRes = await fetch(reciboUrl, { headers: reciboHeaders });
        if (reciboRes.ok) {
          const reciboJson = await reciboRes.json();
          const reciboData = parseRecibo(reciboJson);
          if (reciboData?.passengerCpf) {
            logger.info("Enriched CPF from recibo", { machineRideId });
            return { ok: true, data: { source: "recibo+v1", ...v1Data, passengerCpf: reciboData.passengerCpf, passengerEmail: reciboData.passengerEmail } };
          }
        } else { await reciboRes.text().catch(() => {}); }
      } catch (e) {
        logger.warn("Recibo enrich fetch exception", { machineRideId, error: String(e) });
      }
    }
    return { ok: true, data: { source: "request_v1", ...v1Data } };
  }

  // Fallback to recibo
  const reciboUrl = `${API_BASE_URL}/api/integracao/recibo?id_mch=${machineRideId}`;
  const reciboHeaders = matrixHeaders ?? headers;
  logger.info("Trying recibo fallback", { machineRideId });
  try {
    const reciboRes = await fetch(reciboUrl, { headers: reciboHeaders });
    if (reciboRes.ok) {
      const reciboJson = await reciboRes.json();
      const data = parseRecibo(reciboJson);
      if (data) {
        logger.info("Recibo fallback OK", { machineRideId, rideValue: data.rideValue });
        return { ok: true, data: { source: "recibo", ...data } };
      }
      logger.warn("Recibo fallback returned success=false", { machineRideId });
    }
    const body = await reciboRes.text();
    logger.error("Both endpoints failed", { machineRideId, reciboStatus: reciboRes.status, body: body.slice(0, 300) });
    if (reciboRes.status === 401) {
      return { ok: false, error: "Credenciais TaxiMachine inválidas em ambos endpoints.", status: 401 };
    }
    return { ok: false, error: `Ambos endpoints falharam. Recibo status: ${reciboRes.status}`, status: 502 };
  } catch (e) {
    logger.error("Recibo fallback exception", { machineRideId, error: String(e) });
    return { ok: false, error: `Falha ao conectar com TaxiMachine: ${String(e)}`, status: 502 };
  }
}

async function tryV1(
  headers: Record<string, string>,
  machineRideId: string
): Promise<FetchRideResult> {
  const v1Url = `${API_BASE_URL}/api/v1/request/${machineRideId}`;
  logger.info("Trying V1 fallback", { machineRideId });
  try {
    const v1Res = await fetch(v1Url, { headers });
    if (v1Res.ok) {
      const v1Json = await v1Res.json();
      const v1Data = parseRequestV1(v1Json);
      logger.info("V1 OK", { machineRideId, rideValue: v1Data.rideValue });
      return { ok: true, data: { source: "request_v1", ...v1Data } };
    }
    const body = await v1Res.text();
    logger.error("Both endpoints failed", { machineRideId, v1Status: v1Res.status, body: body.slice(0, 300) });
    if (v1Res.status === 401) {
      return { ok: false, error: "Credenciais TaxiMachine inválidas em ambos endpoints.", status: 401 };
    }
    return { ok: false, error: `Ambos endpoints falharam. V1 status: ${v1Res.status}`, status: 502 };
  } catch (e) {
    logger.error("V1 fallback exception", { machineRideId, error: String(e) });
    return { ok: false, error: `Falha ao conectar com TaxiMachine: ${String(e)}`, status: 502 };
  }
}

/**
 * Test both endpoints independently and return results for each.
 * Uses matrixHeaders for Recibo if provided, otherwise falls back to headers.
 */
export async function testBothEndpoints(
  headers: Record<string, string>,
  testRideId = "100003661",
  matrixHeaders?: Record<string, string>
): Promise<{
  recibo: { ok: boolean; status: number; error?: string; body?: string };
  request_v1: { ok: boolean; status: number; error?: string; body?: string };
}> {
  const reciboUrl = `${API_BASE_URL}/api/integracao/recibo?id_mch=${testRideId}`;
  const v1Url = `${API_BASE_URL}/api/v1/request/${testRideId}`;
  const reciboHeaders = matrixHeaders ?? headers;

  const [reciboResult, v1Result] = await Promise.allSettled([
    fetch(reciboUrl, { headers: reciboHeaders }),
    fetch(v1Url, { headers }),
  ]);

  let recibo: { ok: boolean; status: number; error?: string; body?: string };
  if (reciboResult.status === "fulfilled") {
    const bodyText = await reciboResult.value.text().catch(() => "");
    recibo = {
      ok: reciboResult.value.ok,
      status: reciboResult.value.status,
      ...(!reciboResult.value.ok ? { body: bodyText.slice(0, 500) } : {}),
    };
  } else {
    recibo = { ok: false, status: 0, error: String((reciboResult as PromiseRejectedResult).reason) };
  }

  let request_v1: { ok: boolean; status: number; error?: string; body?: string };
  if (v1Result.status === "fulfilled") {
    const bodyText = await v1Result.value.text().catch(() => "");
    request_v1 = {
      ok: v1Result.value.ok,
      status: v1Result.value.status,
      ...(!v1Result.value.ok ? { body: bodyText.slice(0, 500) } : {}),
    };
  } else {
    request_v1 = { ok: false, status: 0, error: String((v1Result as PromiseRejectedResult).reason) };
  }

  return { recibo, request_v1 };
}
