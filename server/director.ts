export type DirectorAction = 'blow_valve' | 'trip_breaker' | 'vent_steam' | 'coolant_flush';
export interface DirectorTelemetry {
  temp: number;
  pressure: number;
  secondsLeft: number;
  playerCount: number;
  largestCluster: number;
}

const ACTIONS: DirectorAction[] = ['blow_valve', 'trip_breaker', 'vent_steam', 'coolant_flush'];

export function fallbackAction(state: DirectorTelemetry): DirectorAction {
  if (state.largestCluster >= 3) return 'vent_steam';
  if (state.temp >= 80 || state.pressure >= 80) return 'coolant_flush';
  if (state.temp < 60) return 'blow_valve';
  return 'trip_breaker';
}

export async function chooseDirectorAction(
  state: DirectorTelemetry,
  apiKey: unknown,
  fetcher: typeof fetch = fetch
): Promise<{ action: DirectorAction; source: 'model' | 'fallback' }> {
  const fallback = { action: fallbackAction(state), source: 'fallback' as const };
  if (typeof apiKey !== 'string' || !apiKey.trim()) return fallback;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1200);
  try {
    const response = await fetcher('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'gpt-6-luna',
        reasoning: { effort: 'none' },
        store: false,
        max_output_tokens: 50,
        instructions: 'You are MAINFRAME-86, a bunker disaster director. Choose exactly one action. Punish stationary groups of 3 or more with vent_steam. When the core is near meltdown, favor coolant_flush so the match continues. Otherwise create pressure with blow_valve or trip_breaker. Return only the structured action.',
        input: JSON.stringify(state),
        text: {
          format: {
            type: 'json_schema', name: 'director_action', strict: true,
            schema: {
              type: 'object',
              properties: { action: { type: 'string', enum: ACTIONS } },
              required: ['action'], additionalProperties: false
            }
          }
        }
      })
    });
    if (!response.ok) return fallback;
    const result = await response.json() as {
      status?: string;
      output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
    };
    if (result.status !== 'completed') return fallback;
    const content = result.output?.flatMap(item => item.type === 'message' ? item.content || [] : [])
      .find(item => item.type === 'output_text')?.text;
    if (!content) return fallback;
    const parsed = JSON.parse(content) as { action?: unknown };
    if (!ACTIONS.includes(parsed.action as DirectorAction)) return fallback;
    return { action: parsed.action as DirectorAction, source: 'model' };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}
