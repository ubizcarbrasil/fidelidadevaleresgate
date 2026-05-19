/**
 * Boot metrics: usa Performance API pra cronometrar as etapas do boot.
 * Logs aparecem no console com tempo desde o início — essencial pra
 * diagnosticar onde o boot está travando em 5G/iOS Safari.
 *
 * Como ler:
 *   [boot] boot:rpc-start    +12ms
 *   [boot] auth:session-done +180ms
 *   [boot] boot:rpc-done     +890ms
 *   [boot] brand:resolved    +900ms
 *   [boot] roles:loaded      +910ms
 *   [boot] layout:mounted    +1240ms
 *   [boot] page:loaded       +1380ms
 *
 * Etapas > 2000ms são suspeitas. Etapas > 10000ms indicam request
 * travado (provavelmente HTTP/2 abort silencioso em iOS Safari).
 */

const BOOT_T0 =
  typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now();

const seen = new Set<string>();

export function bootMark(name: string): void {
  if (seen.has(name)) return;
  seen.add(name);

  const elapsed = Math.round(
    (typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now()) - BOOT_T0,
  );

  try {
    if (typeof performance !== "undefined" && performance.mark) {
      performance.mark(`boot:${name}`);
    }
  } catch {
    /* noop */
  }

  // Console log pra dev tools (vermelho se muito lento)
  const color = elapsed > 5000 ? "color:red" : elapsed > 2000 ? "color:orange" : "color:gray";
  // eslint-disable-next-line no-console
  console.info(
    `%c[boot] ${name.padEnd(24)} +${elapsed}ms`,
    color,
  );
}

export function getBootElapsed(): number {
  return Math.round(
    (typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now()) - BOOT_T0,
  );
}
