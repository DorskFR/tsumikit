import { type Message, messages } from '../../fixtures';

export { type Message, messages };

let seq = 100;

export function message(role: Message['role'], text: string, at = Date.now()): Message {
	seq += 1;
	return {
		id: seq,
		role,
		text,
		at,
		ms: role === 'assistant' ? 600 + ((seq * 37) % 900) : undefined,
	};
}

export function older(before: number, count = 4): Message[] {
	return Array.from({ length: count }, (_, i) =>
		message(
			i % 2 ? 'assistant' : 'user',
			i % 2
				? 'Done, the changelog entry is in `CHANGELOG.md`.'
				: 'Add a changelog entry for the DataTable fix.',
			before - (count - i) * 60_000,
		),
	);
}
