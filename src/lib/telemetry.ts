export async function initTelemetry(_enabled: boolean = true) {}
export function trackEvent(_name: string, _properties?: Record<string, string>) {}
export function trackError(_error: Error, _properties?: Record<string, string>) {}
export function trackMetric(_name: string, _value: number, _properties?: Record<string, string>) {}
export function setTelemetryEnabled(_enabled: boolean) {}
export function isTelemetryEnabled(): boolean { return false; }
