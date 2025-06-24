import Base, { TrieableNode } from '@webkrafters/trie';

import Trie from '../../main';

export default class RadixTrie<T = unknown> extends Trie<T> {

	matches( graph: Array<Iterable<T>> ): boolean;
	matches( graph: Array<TrieableNode<T>> ): boolean;
	matches( graph: TrieableNode<T> ): boolean;
	matches( graph: Base<T> ): boolean;
	matches( graph ) : boolean {
		return this._matches(
			graph instanceof RadixTrie
				? graph
				: new RadixTrie<T>(
					graph instanceof Base
						? graph.asArray()
						: graph
				)
		);
	}
		
	merge( graph : Base<T> ) : void;
	merge( graph : TrieableNode<T> ) : void;
	merge( graph ) {
		this.addMany((
			graph instanceof Base
				? graph
				: new Base( graph )
		).asArray());
	}

}
