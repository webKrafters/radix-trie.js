import Base, { TrieableNode, util } from '@webkrafters/trie';

import Trie, { isAnyOfTypes } from '../../main';

const { isIterable, toArray } = util;

export default class StringTrie extends Trie<string> {

	constructor( data? : Trie<string>, sorted? : boolean );
	constructor( data? : TrieableNode<string>, sorted? : boolean );
	constructor( data? : Array<TrieableNode<string>>, sorted? : boolean );
	constructor( data? : Array<Iterable<string>>, sorted? : boolean );
	constructor( data? : Array<Iterable<string>|TrieableNode<string>>, sorted? : boolean );
	constructor( data, sorted = false ) {
		const opts = { sorted };
		if( typeof data === 'undefined' || data === null ) {
			super( data, opts );
			return;
		}
		if( Array.isArray( data ) ) {
			let children = new Array( data.length );
			let hasTrieable = false;
			const parent = {
				data: null,
				isBoundary: false,
				parent: null
			} as TrieableNode<string>;
			for( let d = data.length; d--; ) {
				if( isTrieableNode( data[ d ]) ) {
					children[ d ] = data[ d ];
					children[ d ].parent = parent;
					hasTrieable = true;
					continue;
				}
				children[ d ] = {
					children: [],
					data: data[ d ],
					isBoundary: true,
					parent
				};
			}
			if( hasTrieable ) {
				parent.children = children;
				data = parent;
			}
		}
		if( !Array.isArray( data ) ) {
			data = ( new Base<string>( data, opts ) ).asArray();
		}
		for( let d = data.length; d--; ) {
			data[ d ] = reduce( data[ d ] );
		}
		super( data, opts );
	}

	add( sequence : string ) : void
	add( sequence : Iterable<string> ) : void
	add( sequence ) : void {
		return super.add( reduce( sequence ) );
	}
	
	matches( graph: Array<Iterable<string>> ): boolean;
	matches( graph: Array<TrieableNode<string>> ): boolean;
	matches( graph: TrieableNode<string> ): boolean;
	matches( graph: Base<string> ): boolean;
	matches( graph ) : boolean {
		return super._matches(
			!( graph instanceof StringTrie )
				? new StringTrie( graph )
				: graph
		);
	}

	merge( graph : Base<string> ) : void;
	merge( graph : TrieableNode<string> ) : void;
	merge( graph ) {
		if( !( graph instanceof Base ) ) {
			graph = new Base<string>( graph, this.options )
		}
		graph = graph.asArray();
		for( let  g = graph.length; g--; ) {
			graph[ g ] = reduce( graph[ g ] );
		}
		this.addMany( graph );
	}

}

function isTrieableNode( data ) {
	try {
		return 'data' in data
	} catch( e ) {
		return false
	}
}

function reduce( it : Iterable<string> ) {
	if( isAnyOfTypes( it, 'string' ) ) { return it }
	if( !isIterable( it ) ) {
		throw new TypeError( 'FATAL: non-string value detected.' );
	}
	let res = '';
	for( let _it = toArray( it ), _Len = _it.length, _ = 0; _ < _Len; _++ ) {
		res += reduce( _it[ _ ] as Iterable<string> );
	}
	return res;
}
