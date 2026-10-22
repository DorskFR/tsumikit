export const loader = `import { error } from '@sveltejs/kit';
import { getService } from '$lib/server/fleet';

export async function load({ params }) {
  const service = await getService(params.name);
  if (!service) error(404, 'Unknown service');
  // cpu is sampled every 15 seconds
  return { service, refreshMs: 15000, live: true };
}`;

export const setup = `git clone https://github.com/DorskFR/tsumikit.git
cd tsumikit
npm install
npm run dev -- --open`;

export const longLine = `kubectl -n cyberia logs deploy/api-gateway --since=1h --timestamps --all-containers --prefix | grep -E "5[0-9]{2}" | tail -n 200`;

export const secret = 'ghp_9f12e485513e4d6eb987d81a95cead559f12e485513e4d6eb987d81a95cead55';

export const config = Array.from(
	{ length: 24 },
	(_, i) =>
		`  ${['api-gateway', 'worker-02', 'cache-01', 'postgres-primary'][i % 4]}-${i}: { replicas: ${(i % 3) + 1}, region: 'eu-west-1' },`,
).join('\n');
