import { util as u } from '@webkrafters/trie';
import { isAnyOfTypes } from './main';
export const util = { ...u, isAnyOfTypes };
export {
    Compared,
    default as Base,
    EqualityFn, 
    KeyType,
    Node,
    OpStatus,
    Options,
    Status,
    TrieableNode,
    TrieableNodeKeyMapping
} from '@webkrafters/trie';
export {
    CType,
    default as Core,
    RadixOptions
} from './main';
export { default as DefaultImpl } from './____impls____/default';
export { default as StringImpl } from './____impls____/string';
