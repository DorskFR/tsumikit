// Headless query core for FilterSearchBar — schema registry, tolerant parser,
// serialisable AST, autocomplete engine and AST compilers. Framework-agnostic:
// no Svelte, no DOM. A host app supplies a `Schema` (optionally with async
// `ValueProvider`s) and consumes the `Query` AST against its own backend.

export type {
	AndNode,
	ExprNode,
	FilterNode,
	LeafNode,
	NotNode,
	OrNode,
	Query,
	QueryNode,
	TextNode,
} from './ast';
export { filters, freeText, walk } from './ast';
export {
	autoQuoteEdit,
	backspaceEmptyQuotes,
	closingQuoteExit,
	insideQuoteAtCaret,
} from './edit';
export { parse } from './parser';
export { compilePredicate, serialize, serializeFilter, toSql } from './query';
export type {
	FieldDef,
	FieldType,
	Operator,
	OperatorId,
	Schema,
	ValueContext,
	ValueOption,
	ValueProvider,
} from './schema';
export {
	defaultOperator,
	findField,
	OPERATORS,
	operatorByCode,
	operatorById,
	operatorsFor,
	resolveValues,
} from './schema';
export type { Suggestion, SuggestKind, SuggestState } from './suggest';
export { activeToken, suggest } from './suggest';
