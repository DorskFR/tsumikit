import type { ComponentMeta } from '../../framework/registry';

export const meta: ComponentMeta = {
	description:
		'The chat input: an autoresizing textarea fused with attach and send, Enter or mod+Enter to submit, ↑/↓ prompt history, paste and drop to attach, and an optional toolbar row.',
	keywords: [
		'chat',
		'message',
		'input',
		'textarea',
		'send',
		'attach',
		'upload',
		'history',
		'prompt',
	],
	seeAlso: ['ConversationPanel', 'ChatBubble', 'AttachmentList', 'InputGroup', 'Textarea'],
};
