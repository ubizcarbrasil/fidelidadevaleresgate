/**
 * Dual-endpoint TaxiMachine ride data fetcher.
 * Tries the Recibo endpoint first, falls back to Request V1.
 * If Recibo succeeds but lacks passenger phone, enriches from V1.
 */

import { createEdgeLogger } from "./edgeLogger.ts";

const logger = createEdgeLogger("fetchRideData");

const BASE_URL = "https://api.taximachine.com.br";

export interface RideData {
  source: "recibo" | "request_v1" | "recibo+v1";
  rideValue: number;
  passengerName: string | null;
  passengerCpf: string | null;
  passengerPhone: string | null;
  driverName: string | null;
}

export type FetchRideResult =
  | { ok: true; data: RideData }
  | { ok: false; error: string; status: number };

function parseRecibo(json: any): Omit<RideData, "source"> {
  const response = json?.response || json;
  const clienteBlock = response?.cliente || {};
  const condutorBlock = response?.condutor || {};
  const rawCpf = (clienteBlock.cpf || "").replace(/\D/g, "");

  return {
    rideValue: Number(response?.dados_solicitacao?.valor || 0),
    passengerName: clienteBlock.nome || null,
    passengerCpf: rawCpf || null,
    passengerPhone: null, // Recibo endpoint does NOT return passenger phone
    driverName: condutorBlock.nome || null,
  };
}

function parseRequestV1(json: any): Omit<RideData, "source"> {
  const firstStop = Array.isArray(json?.stops) ? json.stops[0] : null;
  const client = firstStop?.client || {};
  const driver = json?.driver || {};

  return {
    rideValue: Number(json?.finished?.final_value || 0),
    passengerName: client.name || null,
    passengerCpf: null, // V1 endpoint does NOT return passenger CPF
    passengerPhone: client.phone || null,
    driverName: driver.name || null,
  };
}

export function buildApiHeaders(
  receiptApiKey: string,
  basicUser: string,
  basicPass: string
): Record<string, string> {
  const headers: Record<string, string> = {
    "api-key": receiptApiKey,
    "User-Agent": "ua-ubizcar",
  };
  if (basicUser && basicPass) {
    headers["Authorization"] = `Basic ${btoa(`${basicUser}:${basicPass}`)}`;
  }
  return headers;
}

export async function fetchRideData(
  headers: Record<string, string>,
  machineRideId: string,
  preferredEndpoint: "recibo" | "request_v1" = "recibo"
): Promise<FetchRideResult> {
  if (preferredEndpoint === "request_v1") {
    return fetchV1First(headers, machineRideId);
  }
  return fetchReciboFirst(headers, machineRideId);
}

async function fetchReciboFirst(
  headers: Record<string, string>,
  machineRideId: string
): Promise<FetchRideResult> {
  const reciboUrl = `${BASE_URL}/api/integracao/recibo?id_mch=${machineRideId}`;
  logger.info("Trying recibo endpoint (primary)", { machineRideId });

  let reciboData: Omit<RideData, "source"> | null = null;

  try {
    const reciboRes = await fetch(reciboUrl, { headers });
    if (reciboRes.ok) {
      const reciboJson = await reciboRes.json();
      reciboData = parseRecibo(reciboJson);
      logger.info("Recibo OK", { machineRideId, rideValue: reciboData.rideValue });
    } else {
      const body = await reciboRes.text();
      logger.warn("Recibo failed", { machineRideId, status: reciboRes.status, body: body.slice(0, 300) });
    }
  } catch (e) {
    logger.warn("Recibo fetch exception", { machineRideId, error: String(e) });
  }

  if (reciboData) {
    if (!reciboData.passengerPhone) {
      try {
        const v1Url = `${BASE_URL}/api/v1/request/${machineRideId}`;
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
  machineRideId: string
): Promise<FetchRideResult> {
  const v1Url = `${BASE_URL}/api/v1/request/${machineRideId}`;
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
        const reciboUrl = `${BASE_URL}/api/integracao/recibo?id_mch=${machineRideId}`;
        const reciboRes = await fetch(reciboUrl, { headers });
        if (reciboRes.ok) {
          const reciboJson = await reciboRes.json();
          const reciboData = parseRecibo(reciboJson);
          if (reciboData.passengerCpf) {
            logger.info("Enriched CPF from recibo", { machineRideId });
            return { ok: true, data: { source: "recibo+v1", ...v1Data, passengerCpf: reciboData.passengerCpf } };
          }
        } else { await reciboRes.text().catch(() => {}); }
      } catch (e) {
        logger.warn("Recibo enrich fetch exception", { machineRideId, error: String(e) });
      }
    }
    return { ok: true, data: { source: "request_v1", ...v1Data } };
  }

  // Fallback to recibo
  const reciboUrl = `${BASE_URL}/api/integracao/recibo?id_mch=${machineRideId}`;
  logger.info("Trying recibo fallback", { machineRideId });
  try {
    const reciboRes = await fetch(reciboUrl, { headers });
    if (reciboRes.ok) {
      const reciboJson = await reciboRes.json();
      const data = parseRecibo(reciboJson);
      logger.info("Recibo fallback OK", { machineRideId, rideValue: data.rideValue });
      return { ok: true, data: { source: "recibo", ...data } };
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
  const v1Url = `${BASE_URL}/api/v1/request/${machineRideId}`;
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
 */
export async function testBothEndpoints(
  headers: Record<string, string>,
  testRideId = "100003661"
): Promise<{
  recibo: { ok: boolean; status: number; error?: string; body?: string };
  request_v1: { ok: boolean; status: number; error?: string; body?: string };
}> {
  const reciboUrl = `${BASE_URL}/api/integracao/recibo?id_mch=${testRideId}`;
  const v1Url = `${BASE_URL}/api/v1/request/${testRideId}`;

  const [reciboResult, v1Result] = await Promise.allSettled([
    fetch(reciboUrl, { headers }),
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
