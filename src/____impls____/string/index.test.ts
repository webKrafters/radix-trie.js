import type { TrieableNode } from '@webkrafters/trie';

import {
	afterAll,
	beforeAll,
	describe,
	expect,
	test
} from '@jest/globals';

import { removeSequence } from '../../test-artifacts';

import {
	getArrayifiedNode,
	getArrayifiedNodeSorted,
	getStringListNode,
	getStringListNodeSorted,
	getTrieableNode
} from '../../test-artifacts/test-data';

import Base, { OpStatus } from '@webkrafters/trie';

import Trie from '.';

const arrayifiedNode = getArrayifiedNode();


describe( 'Trie class', () => {

	describe( 'constructors(...)', () => {

		test( 'stores all non-string iterables or with string mixtures as complete strings', () => {
			expect(( new Trie([
				'mississippi',
				'michigan',
				[ 'm', 'i', 's', 's' ],
				'missouri',
				[ 't', 'e', 'x', 'a', 's' ],
				'tennessee',
				[ 'n', 'e', 'v', 'a', 'd', 'a' ],
				[ 'i', 'd', 'a', 'h', 'o' ]
			]) ).viewInternalsAsNode()).toMatchNode({
				children: [{
					children: [{
						children: [],
						data: 'chigan',
						isBoundary: true
					}, {
						children: [{
							children: [],
							data: 'issippi',
							isBoundary: true
						}, {
							children: [],
							data: 'ouri',
							isBoundary: true
						}],
						data: 'ss',
						isBoundary: true
					}],
					data: 'mi',
					isBoundary: false
				}, {
					children: [{
						children: [],
						data: 'xas',
						isBoundary: true
					}, {
						children: [],
						data: 'nnessee',
						isBoundary: true
					}],
					data: 'te',
					isBoundary: false
				}, {
					children: [],
					data: 'nevada',
					isBoundary: true
				}, {
					children: [],
					data: 'idaho',
					isBoundary: true
				}],
				data: null,
				isBoundary: false
			})
		} );

		test( 'accepts string sequences and preserves them -- this preservation is permanently lost upon adding non-string sequences', () => {
			
			expect(( new Trie([
				'mississippi',
				'michigan',
				'miss',
				'missouri',
				'texas',
				'tennessee',
				'nevada',
				'idaho'
			]) ).viewInternalsAsNode() ).toMatchNode({
				children: [{
					children: [{
						children: [],
						data: 'chigan',
						isBoundary: true
					}, {
						children: [{
							children: [],
							data: 'issippi',
							isBoundary: true
						}, {
							children: [],
							data: 'ouri',
							isBoundary: true
						}],
						data: 'ss',
						isBoundary: true
					}],
					data: 'mi',
					isBoundary: false
				}, {
					children: [{
						children: [],
						data: 'xas',
						isBoundary: true
					}, {
						children: [],
						data: 'nnessee',
						isBoundary: true
					}],
					data: 'te',
					isBoundary: false
				}, {
					children: [],
					data: 'nevada',
					isBoundary: true
				}, {
					children: [],
					data: 'idaho',
					isBoundary: true
				}],
				data: null,
				isBoundary: false
			});
		} );

		test( 'can be sorted', () => {
			let data = ( new Trie( arrayifiedNode, true ) ).asArray();
			expect( data ).not.toEqual( arrayifiedNode );
			expect( data ).not.toEqual( getArrayifiedNodeSorted() );
			expect( data ).toEqual( getStringListNodeSorted() );
			const strings = getStringListNode();
			data = ( new Trie( strings, true ) ).asArray();
			expect( data ).not.toEqual( strings );
			expect( data ).toEqual( getStringListNodeSorted() );
		} );

		test( 'throws on an any non-string items', () => {
			expect(() => new Trie([
				'mississippi',
				'michigan',
				[ 'm', 'i', 's', 's' ],
				'missouri',
				[ 't', 'e', 'x', 'a', 's' ],
				'tennessee',
				// @ts-ignore
				[ 'n', 'e', 'v', 2, 'd', 'a' ],
				[ 'i', 'd', 'a', 'h', 'o' ]
			])).toThrow();
		} );

	} );

	describe( 'methods', () => {

		describe( 'add(...)', () => {

			describe( 'packing all in parent node', () => {

				test( 'accepting array of data', () => {
					let entry = [ 'm', 'i', 's', 's', 'i', 's', 's', 'i', 'p', 'p', 'i' ];
					const trie = new Trie([ entry ]);
					let items = trie.asArray();
					expect( items ).toContain( 'mississippi' );
					expect( items ).not.toContain( entry );
					entry = [ 'm', 'i', 's', 's' ];
					expect( items ).not.toContain( 'miss' );
					trie.add( entry );
					items = trie.asArray();
					expect( items ).toContain( 'miss' );
					expect( items ).not.toContain( entry );
				} );

				test( 'accepting strings', () => {
					let entry = 'mississippi';
					const trie = new Trie([ entry ]);
					let items = trie.asArray();
					expect( items ).toContain( entry );
					entry = 'miss';
					expect( items ).not.toContain( entry );
					trie.add( entry );
					items = trie.asArray();
					expect( items ).toContain( entry );
				} );

			} );

			describe( 'determining string data packing', () => {

				test( 'will store all string data as-is for every string added', () => {
					const trie = new Trie([ 'mississippi', 'michigan' ]);
					expect( trie.viewInternalsAsNode() ).toMatchNode({
						children: [{
							children: [{
								children: [],
								data: 'ssissippi',
								isBoundary: true
							}, {
								children: [],
								data: 'chigan',
								isBoundary: true
							}],
							data: 'mi',
							isBoundary: false
						}],
						data: null,
						isBoundary: false
					});
					trie.add( 'missouri' );
					expect( trie.viewInternalsAsNode() ).toMatchNode({
						children: [{
							children: [{
								children: [],
								data: 'chigan',
								isBoundary: true,
							}, {
								children: [{
									children: [],
									data: "issippi",
									isBoundary: true,
								}, {
									children: [],
									data: "ouri",
									isBoundary: true,
								}],
								data: 'ss',
								isBoundary: false,
							}],
							data: 'mi',
							isBoundary: false
						}],
						data: null,
						isBoundary: false
					});
				} );

				test( 'will convert string iterables to string', () => {
					const trie = new Trie([ 'mississippi', 'michigan' ]);
					expect( trie.viewInternalsAsNode() ).toMatchNode({
						children: [{
							children: [{
								children: [],
								data: 'ssissippi',
								isBoundary: true
							}, {
								children: [],
								data: 'chigan',
								isBoundary: true
							}],
							data: 'mi',
							isBoundary: false
						}],
						data: null,
						isBoundary: false
					});
					trie.add([ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ]);
					expect( trie.viewInternalsAsNode() ).toMatchNode({
						children: [{
							children: [{
								children: [],
								data: 'chigan',
								isBoundary: true
							}, {
								children: [{
									children: [],
									data: 'issippi',
									isBoundary: true
								}, {
									children: [],
									data: 'ouri',
									isBoundary: true
								}],
								data: 'ss',
								isBoundary: false
							}],
							data: 'mi',
							isBoundary: false
						}],
						data: null,
						isBoundary: false
					});
				} );

				test( 'will throw on attempt to add non-string iterables', () => {
					expect(() => {
						new Trie([ 'mississippi', 'michgan' ])
							// @ts-ignore
							.add([ 'm', 'i', 's', 's', 'o', 'u', 7, 'i' ])
					}).toThrow();
				} );

			} );
			
		} );

		describe( 'addMany(...)', () => {
			let expected;
			beforeAll(() => {
				expected = {
					children: [{
						children: [{
							children: [],
							data: 'chigan',
							isBoundary: true
						}, {
							children: [{
								children: [],
								data: 'issippi',
								isBoundary: true
							}, {
								children: [],
								data: 'ouri',
								isBoundary: true
							}],
							data: 'ss',
							isBoundary: true
						}],
						data: 'mi',
						isBoundary: false
					}, {
						children: [{
							children: [],
							data: 'xas',
							isBoundary: true
						}, {
							children: [],
							data: 'nnessee',
							isBoundary: true
						}],
						data: 'te',
						isBoundary: false
					}, {
						children: [],
						data: 'nevada',
						isBoundary: true
					}, {
						children: [],
						data: 'idaho',
						isBoundary: true
					}],
					data: null,
					isBoundary: false
				};
			});
			afterAll(() => { expected = null })

			test( 'can add several strings at once', () => {
				const trie = new Trie();
				trie.addMany([
					'mississippi',
					'michigan',
					'miss',
					'missouri',
					'texas',
					'tennessee',
					'nevada',
					'idaho'
				]);
				expect( trie.viewInternalsAsNode() ).toMatchNode( expected );
			} );

			test( 'can add several arrays at once', () => {
				const trie = new Trie();
				trie.addMany([
					[ 'm', 'i', 's', 's', 'i', 's', 's', 'i', 'p', 'p', 'i' ],
					[ 'm', 'i', 'c', 'h', 'i', 'g', 'a', 'n' ],
					[ 'm', 'i', 's', 's' ],
					[ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ],
					[ 't', 'e', 'x', 'a', 's' ],
					[ 't', 'e', 'n', 'n', 'e', 's', 's', 'e', 'e' ],
					[ 'n', 'e', 'v', 'a', 'd', 'a' ],
					[ 'i', 'd', 'a', 'h', 'o' ]
				]);
				expect( trie.viewInternalsAsNode() ).toMatchNode( expected )
			} );

			test( 'will store a mixture of arrays and strings as arrays', () => {
				const trie = new Trie();
				trie.addMany([
					'mississippi',
					'michigan',
					[ 'm', 'i', 's', 's' ],
					'missouri',
					[ 't', 'e', 'x', 'a', 's' ],
					'tennessee',
					[ 'n', 'e', 'v', 'a', 'd', 'a' ],
					[ 'i', 'd', 'a', 'h', 'o' ]
				]);
				expect( trie.viewInternalsAsNode()).toMatchNode( expected );
			} );

			

			test( 'will store a mixture of arrays and strings as arrays', () => {
				expect(() => {
					new Trie().addMany([
						'mississippi',
						'michigan',
						[ 'm', 'i', 's', 's' ],
						'missouri',
						[ 't', 'e', 'x', 'a', 's' ],
						'tennessee',
						// @ts-ignore
						[ 'n', 'e', 'v', 'a', 0, 'a' ],
						[ 'i', 'd', 'a', 'h', 'o' ]
					]);
				}).toThrow();
			} );

		} );

		describe( 'asArray(...)', () => {

			let trieArr : Trie|null;
			let trieStr : Trie|null;
			let expected;
			beforeAll(() => {
				trieArr = new Trie([
					[ 'm', 'i', 's', 's', 'i', 's', 's', 'i', 'p', 'p', 'i' ],
					[ 'm', 'i', 'c', 'h', 'i', 'g', 'a', 'n' ],
					[ 'm', 'i', 's', 's' ],
					[ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ],
					[ 't', 'e', 'x', 'a', 's' ],
					[ 't', 'e', 'n', 'n', 'e', 's', 's', 'e', 'e' ],
					[ 'n', 'e', 'v', 'a', 'd', 'a' ],
					[ 'i', 'd', 'a', 'h', 'o' ]
				]);
				trieStr = new Trie([
					'mississippi',
					'michigan',
					'miss',
					'missouri',
					'texas',
					'tennessee',
					'nevada',
					'idaho'
				]);
				trieArr.removeAllStartingWith( 'mississipp' );
				trieStr.removeAllStartingWith( 'mississipp' );
				expected = [
					'michigan',
					'miss',
					'missouri',
					'texas',
					'tennessee',
					'nevada',
					'idaho'
				];
			});
			afterAll(() => { trieArr = trieStr = expected = null });

			test( 'produces all complete sequences as strings by default', () => {
				expect( trieArr!.asArray() ).toEqual( expected );
				expect( trieStr!.asArray() ).toEqual( expected );
			} );
			
			test( 'produces only complete sequences even when the "completeSequencesOnly" flag is unset', () => {
				expect( trieArr!.asArray( false ) ).toEqual( expected );
				expect( trieStr!.asArray( false ) ).toEqual( expected );
			} );

		} );

		describe( 'getFarthestIn(...)', () => {

			let trieArr : Trie;
			let trieStr : Trie;
			beforeAll(() => {
				trieArr = new Trie( getArrayifiedNode() );
				trieStr = new Trie( getStringListNode() );
			});

			test( 'produces empty string if none found in this Trie', () => {
				expect( trieArr.getFarthestIn([
					'w', 'e', 's', 't', ' ', 'v', 'i', 'r', 'g', 'i', 'n', 'i', 'a'
				]) ).toEqual( '' );
				expect( trieStr.getFarthestIn([
					'w', 'e', 's', 't', ' ', 'v', 'i', 'r', 'g', 'i', 'n', 'i', 'a'
				]) ).toEqual( '' );
				// --- using strings --- //
				expect( trieArr.getFarthestIn( 'west virginia' ) ).toEqual( '' );
				expect( trieStr.getFarthestIn( 'west virginia' ) ).toEqual( '' );
			} );

			test( 'produces an empty string for an empty sequence', () => {
				expect( trieArr.getFarthestIn() ).toEqual( '' );
				expect( trieStr.getFarthestIn() ).toEqual( '' );
				expect( trieArr.getFarthestIn( '' ) ).toEqual( '' ) ;
				expect( trieStr.getFarthestIn( '' ) ).toEqual( '' );
				expect( trieArr.getFarthestIn( [] ) ).toEqual( '' );
				expect( trieStr.getFarthestIn( [] ) ).toEqual( '' );
			} );

			test( 'produces all items as strings if all found in this Trie', () => {
				expect( trieArr.getFarthestIn([
					'n', 'e', 'v', 'a', 'd', 'a'
				]) ).toEqual( 'nevada' );
				expect( trieStr.getFarthestIn([
					'n', 'e', 'v', 'a', 'd', 'a'
				]) ).toEqual( 'nevada' );
				// --- using strings --- //
				expect( trieArr.getFarthestIn( 'nevada' ) ).toEqual( 'nevada' );
				expect( trieStr.getFarthestIn( 'nevada' ) ).toEqual( 'nevada' );
			} );

			test( 'can only produce up to the last complete sequence in this Trie found in the prefix', () => {
				expect( trieArr.getFarthestIn([
					'm', 'i', 'c', 'h', 'o', 'a', 'c', 'a', 'n'
				]) ).toEqual( 'mi' );
				expect( trieArr.getFarthestIn([ 't', 'e', 'n' ]) ).toEqual( 'te' );
				expect( trieStr.getFarthestIn([
					'm', 'i', 'c', 'h', 'o', 'a', 'c', 'a', 'n'
				]) ).toEqual( 'mi' );
				expect( trieStr.getFarthestIn([ 't', 'e', 'n' ]) ).toEqual( 'te' );
				// --- using strings --- //
				expect( trieArr.getFarthestIn( 'michoacan' ) ).toEqual( 'mi' );
				expect( trieArr.getFarthestIn( 'ten' ) ).toEqual( 'te' );
				expect( trieStr.getFarthestIn( 'michoacan' ) ).toEqual( 'mi' );
				expect( trieStr.getFarthestIn( 'ten' ) ).toEqual( 'te' );
			} );
		} );

		describe( 'getAllStartingWith(...)', () => {

			let trieArr : Trie;
			let trieStr : Trie;
			beforeAll(() => {
				trieArr = new Trie( getArrayifiedNode() );
				trieStr = new Trie( getStringListNode() );
			});

			test( 'produces an array of sequences starting with a subsequence', () => {
				expect( trieArr.getAllStartingWith([ 'm', 'i', 's' ]) ).toMatchSequences([
					[ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ],
					[ 'm', 'i', 's', 's', 'i', 's', 's', 'i', 'p', 'p', 'i' ],
					[ 'm', 'i', 's', 's', '.' ]
				]);
				expect( trieStr.getAllStartingWith([ 'm', 'i', 's' ]) )
					.toEqual([ 'miss.', 'missouri', 'mississippi' ]);
				// --- using strings --- //
				expect( trieArr.getAllStartingWith( 'mis' ) ).toMatchSequences([
					[ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ],
					[ 'm', 'i', 's', 's', 'i', 's', 's', 'i', 'p', 'p', 'i' ],
					[ 'm', 'i', 's', 's', '.' ]
				]);
				expect( trieStr.getAllStartingWith( 'miss' ) )
					.toEqual([ 'miss.', 'missouri', 'mississippi' ]);
			} );
			
			test( 'produces all up to and including the prefix sequence if a complete sequence', () => {
				expect( trieArr.getAllStartingWith([ 'o', 'r' ]) ).toMatchSequences([
					[ 'o', 'r' ],
					[ 'o', 'r', 'e', 'g', 'o', 'n' ]
				]);
				expect( trieStr.getAllStartingWith([ 'o', 'r' ]) )
					.toEqual([ 'or', 'oregon' ]);
				// --- using strings --- //
				expect( trieArr.getAllStartingWith( 'or' ) ).toMatchSequences([
					[ 'o', 'r' ],
					[ 'o', 'r', 'e', 'g', 'o', 'n' ]
				]);
				expect( trieStr.getAllStartingWith( 'or' ) )
					.toEqual([ 'or', 'oregon' ]);
			} );
			
			test( 'produces an empty array if no prefix sequence supplied', () => {
				const trie = new Trie( getArrayifiedNode() );
				expect( trieArr.getAllStartingWith() ).toEqual( [] );
				expect( trieArr.getAllStartingWith( '' ) ).toEqual( [] );
				expect( trieArr.getAllStartingWith([]) ).toEqual( [] );
				expect( trieStr.getAllStartingWith() ).toEqual( [] );
				expect( trieStr.getAllStartingWith( '' ) ).toEqual( [] );
				expect( trieStr.getAllStartingWith([]) ).toEqual( [] );
			} );
		   
			test( 'produces an empty array if no complete sequences found preceded by the prefix sequence.', () => {
				expect( trieArr.getAllStartingWith([ 'w', 'y', 'o' ]) ).toEqual( [] );
				expect( trieStr.getAllStartingWith([ 'w', 'y', 'o' ]) ).toEqual( [] );
				// -- using strings -- //
				expect( trieArr.getAllStartingWith( 'wyo' ) ).toEqual( [] );
				expect( trieStr.getAllStartingWith( 'wyo' ) ).toEqual( [] );
			} );

		} );

		describe( 'has(...)', () => {
			
			let trieArr : Trie;
			let trieStr : Trie;
			beforeAll(() => {
				trieArr = new Trie( getArrayifiedNode() );
				trieStr = new Trie( getStringListNode() );
			});
		
			test( 'affirms for a complete sequence in this instance', () => {
				expect( trieArr.has([ 'm', 'i' ]) ).toBe( true );
				expect( trieStr.has([ 'm', 'i' ]) ).toBe( true );
				expect( trieArr.has([ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ]) ).toBe( true );
				expect( trieStr.has([ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ]) ).toBe( true );
				expect( trieArr.has([ 'o', 'r', 'e', 'g', 'o', 'n' ]) ).toBe( true );
				expect( trieStr.has([ 'o', 'r', 'e', 'g', 'o', 'n' ]) ).toBe( true );
				// --- using strings --- //
				expect( trieArr.has( 'mi' ) ).toBe( true );
				expect( trieStr.has( 'mi' ) ).toBe( true );
				expect( trieArr.has( 'missouri' ) ).toBe( true );
				expect( trieStr.has( 'missouri' ) ).toBe( true );
				expect( trieArr.has( 'oregon' ) ).toBe( true );
				expect( trieStr.has( 'oregon' ) ).toBe( true );
			} );

			test( 'does not affirm for sequences not in this instance', () => {
				expect( trieArr.has([ 'i', 'o', 'w', 'a' ]) ).toBe( false );
				expect( trieStr.has([ 'i', 'o', 'w', 'a' ]) ).toBe( false );
				// --- using strings --- //
				expect( trieArr.has( 'iowa' ) ).toBe( false );
				expect( trieStr.has( 'iowa' ) ).toBe( false );
			} );
		
			test( 'does not affirm for imcomplete sequences in this instance', () => {
				expect( trieArr.has([ 'm', 'i', 's', 's', 'i' ]) ).toBe( false );
				expect( trieStr.has([ 'm', 'i', 's', 's', 'i' ]) ).toBe( false );
				// --- using strings --- //
				expect( trieArr.has( 'missi' ) ).toBe( false );
				expect( trieStr.has( 'missi' ) ).toBe( false );
			} );
		
		} );
		
		describe( 'matches(...)', () => {

			let trie : Trie;
			let strings : Array<string>;
			beforeAll(() => {
				strings = getStringListNode();
				trie = new Trie( strings );
			});

			test( 'matches own self', () => {
				expect( trie.matches( trie ) ).toBe( true );
			} );

			test( 'matches own trieableNode representation', () => {
				const tNode = trie.asTrieableNode();
				expect( trie.matches( tNode ) ).toBe( true );
				expect( trie.matches( new Trie( tNode ) ) ).toBe( true );
			} );

			test( 'matches own internal trieableNode representation', () => {
				const tNode = trie.viewInternalsAsNode();
				expect( trie.matches( tNode ) ).toBe( true );
				expect( trie.matches( new Trie( tNode ) ) ).toBe( true );
			} );

			test( 'matches any corresponding trie instance', () => {
				expect( trie.matches( new Trie( strings ) ) ).toBe( true );
				expect( trie.matches( new Trie( arrayifiedNode ) ) ).toBe( true );
				expect( trie.matches( new Base( strings ) ) ).toBe( true );
				expect( trie.matches( new Trie( strings.slice( 1 ) ) ) ).toBe( false );
			} );

			test( 'matches corresponding array of strings input', () => {
				expect( trie.matches( strings ) ).toBe( true );
				expect( trie.matches( new Trie( strings ) ) ).toBe( true );
				expect( trie.matches( strings.slice( 1 ) ) ).toBe( false );
			} );

			test( 'matches corresponding array of charArrays matching strings input', () => {
				expect( trie.matches( arrayifiedNode ) ).toBe( true );
				expect( trie.matches( new Trie( arrayifiedNode ) ) ).toBe( true );
				expect( trie.matches( arrayifiedNode.slice( 1 ) ) ).toBe( false );
			} );

			test( 'matches own array representation', () => {
				const arr = trie.asArray();
				expect( trie.matches( arr ) ).toBe( true );
				expect( trie.matches( new Trie( arr ) ) ).toBe( true );
			} );

			test( 'matches corresponding trieableNode', () => {
				const tNode = getTrieableNode();
				expect( trie.matches( tNode ) ).toBe( true );
				expect( trie.matches( new Trie( tNode ) ) ).toBe( true );
			} );

			test( 'matches array of corresponding trieableNode children', () => {
				const tNodes = getTrieableNode().children as Array<TrieableNode<string>>;
				expect( trie.matches( tNodes ) ).toBe( true );
				expect( trie.matches( new Trie( tNodes ) ) ).toBe( true );
				tNodes.pop();
				expect( trie.matches( tNodes ) ).toBe( false );
				expect( trie.matches( new Trie( tNodes ) ) ).toBe( false );
			} );
		
		} );
		
		describe( 'merge(...)', () => {

			let expected, expected2;
			let strings : Array<string>;
			let incoming : Array<string>;
			beforeAll(() => {
				strings = getStringListNode();
				expected = [ 'tennessee', 'mi', 'miss.', 'maine', 'ohio', 'or' ];
				expected2 = [ 'mi', 'miss.', 'missouri', 'mississippi', 'michigan', 'maine', 'ohio', 'or', 'oregon', 'nevada', 'tennessee', 'texas', 'idaho' ];
				incoming = strings.splice( 6, 8 );
			});

			test( 'merges incoming trieableNode', () => {
				const trie = new Trie( strings );
				expect( trie.asArray() ).toEqual( expected );
				// attempt to remerge self => no change in content
				trie.merge( trie.asTrieableNode() );
				expect( trie.asArray() ).toEqual( expected );
				// merged in new items
				trie.merge( new Trie( incoming ).asTrieableNode() );
				expect( trie.asArray() ).toEqual( expected2 );
			} );

			test( 'matches incoming trie instance', () => {
				const trie = new Trie( strings );
				expect( trie.asArray() ).toEqual( expected );
				// attempt to remerge self => no change in content
				trie.merge( trie );
				expect( trie.asArray() ).toEqual( expected );
				// merged in new items
				trie.merge( new Trie( incoming ) );
				expect( trie.asArray() ).toEqual( expected2 );
			} );
			
		} );
		
		describe( 'remove(...)', () => {
		
			test( 'removes a complete sequence', () => {
				const run = ( input, removed ) => {
					let trie = new Trie( input );
					expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
					let status = trie.remove( removed );
					expect( trie.asArray() ).toHaveLength( arrayifiedNode.length - 1 );
					expect( status ).toBe( true );
				};
				run( arrayifiedNode, [ 't', 'e', 'x', 'a', 's' ] );
				run( getStringListNode(), [ 't', 'e', 'x', 'a', 's' ] );
				// --- using strings --- //
				run( arrayifiedNode, 'texas' );
				run( getStringListNode(), 'texas' );
			} );
		
			test( 'removes a complete subsequence of a longer sequence', () => {
				const run = ( trie, removed ) => {
					expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
					let status = trie.remove( removed );
					expect( trie.has([ 'o', 'r', 'e', 'g', 'o', 'n' ]) ).toBe( true );
					expect( trie.has([ 'o', 'r' ]) ).toBe( false );
					expect( status ).toBe( true );
				};
				const trie = new Trie( arrayifiedNode );
				run( trie, [ 'o', 'r' ]);
				expect( trie.asArray() ).toHaveLength( arrayifiedNode.length - 1 );
				run( new Trie( getStringListNode() ), [ 'o', 'r' ] );
				// --- using strings --- //
				run( new Trie( arrayifiedNode ), 'or' );
				run( new Trie( getStringListNode() ), 'or' );
			} );
		
			test( 'removes a complete longer sequence while preserving its subsequence', () => {
				const process = ( input, removed, ...keyTerms ) => {
					let trie = new Trie( input );
					expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
					let status = trie.remove( removed );
					expect( trie.has( keyTerms[ 0 ] ) ).toBe( false );
					expect( trie.has( keyTerms[ 1 ] ) ).toBe( true );
					expect( status ).toBe( true );
				};
				let run = input => process(
					input,
					[ 'o', 'r', 'e', 'g', 'o', 'n' ],
					[ 'o', 'r', 'e', 'g', 'o', 'n' ],
					[ 'o', 'r' ]
				);
				run( arrayifiedNode );
				run( getStringListNode() );
				// --- using string --- //
				run = input => process( input, 'oregon', 'oregon', 'or' );
				run( arrayifiedNode );
				run( getStringListNode() );
			} );
		
			test( 'ignores incomplete sequence', () => {
				const run = ( input, removed ) => {
					let trie = new Trie( input );
					expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
					let status = trie.remove( removed );
					expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
					expect( status ).toBe( false );
				};
				run( arrayifiedNode, [ 'o', 'r', 'e', 'g' ] );
				run( getStringListNode(), [ 'o', 'r', 'e', 'g' ] );
				// --- using  strings --- //
				run( arrayifiedNode, 'oreg' );
				run( getStringListNode(), 'oreg' );
			} );
		
			test( 'ignores inexistent sequence', () => {
				const run = ( input, removed ) => {
					let trie = new Trie( input );
					expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
					let status = trie.remove( removed );
					expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
					expect( status ).toBe( false );
				};
				run( arrayifiedNode, [ 'i', 'o', 'w', 'a' ] );
				run( getStringListNode(), [ 'i', 'o', 'w', 'a' ] );
				// --- using strings --- //
				run( arrayifiedNode, 'iowa' );
				run( getStringListNode(), 'iowa' );
			} );
		
		} );
		
		describe( 'removeAllStartingWith(...)', () => {
		
			test( 'removes all under a particular node', () => {
				let trie = new Trie( arrayifiedNode );
				expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
				const prefix = [ 'm', 'i', 's', 's' ];
				trie.removeAllStartingWith( prefix );
				let remaining = trie.asArray();
				expect( remaining ).not.toHaveLength( arrayifiedNode.length );
				expect( remaining.length ).toBeLessThan( arrayifiedNode.length );
				expect( trie.asArray() ).toHaveLength(
					arrayifiedNode.filter( n => !prefix.every(
						( p, i ) => n[ i ] === p
					) ).length
				);
				// --- using strings --- //
				trie = new Trie( arrayifiedNode );
				expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
				trie.removeAllStartingWith( 'miss' );
				remaining = trie.asArray();
				expect( remaining ).not.toHaveLength( arrayifiedNode.length );
				expect( remaining.length ).toBeLessThan( arrayifiedNode.length );
				expect( trie.asArray() ).toHaveLength(
					arrayifiedNode.filter( n => !prefix.every(
						( p, i ) => n[ i ] === p
					) ).length
				);
			} );
		
			test( 'removes all up to and including the prefix sequence if a complete sequence', () => {
				let trie = new Trie( arrayifiedNode );
				expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
				const prefix = [ 'm', 'i' ];
				trie.removeAllStartingWith( prefix );
				let remaining = trie.asArray();
				expect( remaining ).not.toHaveLength( arrayifiedNode.length );
				expect( remaining.length ).toBeLessThan( arrayifiedNode.length );
				expect( trie.asArray() ).toHaveLength(
					arrayifiedNode.filter( n => !prefix.every(
						( p, i ) => n[ i ] === p
					) ).length
				);
				// --- using strings --- //
				trie = new Trie( arrayifiedNode );
				expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
				trie.removeAllStartingWith( 'mi' );
				remaining = trie.asArray();
				expect( remaining ).not.toHaveLength( arrayifiedNode.length );
				expect( remaining.length ).toBeLessThan( arrayifiedNode.length );
				expect( trie.asArray() ).toHaveLength(
					arrayifiedNode.filter( n => !prefix.every(
						( p, i ) => n[ i ] === p
					) ).length
				);
			} );
		
			test( 'removes nothing if node not found', () => {
				const trie = new Trie( arrayifiedNode );
				expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
				trie.removeAllStartingWith([ 'i', 'l' ]);
				expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
				// --- using strings --- //
				trie.removeAllStartingWith( 'il' );
				expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
			} );
		
			test( 'removes nothing if no prefix was provided', () => {
				let trie = new Trie( arrayifiedNode );
				expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
				trie.removeAllStartingWith([]);
				expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
				trie.removeAllStartingWith();
				expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
			} );
		
		} );
		
		describe( 'removeMany(...)', () => {
		
			test( 'remove several sequences at once', () => {
				const run = input => {
					const trie = new Trie( input );
					expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
					const removed = [
						[ 'o', 'r' ],
						'idaho',
						[ 'm', 'a', 'i', 'n', 'e' ]
					];
					const status = trie.removeMany( removed );
					expect( trie.asArray() ).toHaveLength( arrayifiedNode.length - removed.length );
					expect( status ).toHaveLength( removed.length );
					status.forEach( s => expect( s ).toBe( OpStatus.SUCCESSFUL ) );
				};
				run( arrayifiedNode );
				run( getStringListNode() );
			} );
		
			test( 'provides feedback per item ', () => {
				const run = input => {
					const trie = new Trie( input );
					expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
					const removed = [
						[ 'o', 'r' ],
						[ 'l', 'o', 'u', 'i', 's', 'i', 'a', 'n', 'a' ],
						[ 'i', 'd', 'a', 'h', 'o' ],
						[ 'm', 'i', 'n', 'n', 'e', 's', 'o', 't', 'a' ],
						[ 'm', 'a', 'i', 'n' ],
						[ 'm', 'a', 'i', 'n', 'e' ]
					];
					const status = trie.removeMany( removed );
					expect( trie.asArray() ).toHaveLength( arrayifiedNode.length - 3 );
					expect( status ).toHaveLength( removed.length );
					expect( status[ 0 ] ).toBe( OpStatus.SUCCESSFUL );
					expect( status[ 1 ] ).toBe( OpStatus.FAILED );
					expect( status[ 2 ] ).toBe( OpStatus.SUCCESSFUL );
					expect( status[ 3 ] ).toBe( OpStatus.FAILED );
					expect( status[ 4 ] ).toBe( OpStatus.FAILED );
					expect( status[ 5 ] ).toBe( OpStatus.SUCCESSFUL );
				};
				run( arrayifiedNode );
				run( getStringListNode() );
			} );
		
		} );

		describe( 'viewInternalsAsNode(...)', () => {

			let expected;
			beforeAll(() => {
				expected = {
					children: [{
						children: [{
							children: [],
							data: 'chigan',
							isBoundary: true
						}, {
							children: [{
								children: [],
								data: 'issippi',
								isBoundary: true
							}, {
								children: [],
								data: 'ouri',
								isBoundary: true
							}],
							data: 'ss',
							isBoundary: true
						}],
						data: 'mi',
						isBoundary: false
					}, {
						children: [{
							children: [],
							data: 'xas',
							isBoundary: true
						}, {
							children: [],
							data: 'nnessee',
							isBoundary: true
						}],
						data: 'te',
						isBoundary: false
					}, {
						children: [],
						data: 'nevada',
						isBoundary: true
					}, {
						children: [],
						data: 'idaho',
						isBoundary: true
					}],
					data: null,
					isBoundary: false
				};
			});
			afterAll(() => { expected = null })

			test( 'returns a trieableNode of substrings for string sequences', () => {
				expect(( new Trie([
					'mississippi',
					'michigan',
					'miss',
					'missouri',
					'texas',
					'tennessee',
					'nevada',
					'idaho'
				]) ).viewInternalsAsNode()).toMatchNode( expected );
			} );

			test( 'returns a trieableNodes of substrings for iterable sequences', () => {
				expect(( new Trie([
					[ 'm', 'i', 's', 's', 'i', 's', 's', 'i', 'p', 'p', 'i' ],
					[ 'm', 'i', 'c', 'h', 'i', 'g', 'a', 'n' ],
					[ 'm', 'i', 's', 's' ],
					[ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ],
					[ 't', 'e', 'x', 'a', 's' ],
					[ 't', 'e', 'n', 'n', 'e', 's', 's', 'e', 'e' ],
					[ 'n', 'e', 'v', 'a', 'd', 'a' ],
					[ 'i', 'd', 'a', 'h', 'o' ]
				]) ).viewInternalsAsNode()).toMatchNode( expected );
			} );

		} );
	} );

	describe( 'properties', () => {
		let trie : Trie;
		let strTrie : Trie;
		let strings = getStringListNode();
		
		beforeAll(() => {
			trie = new Trie( arrayifiedNode );
			strTrie = new Trie( strings );
		});

		describe( 'size', () => {

			test( 'produces size at initial creation', () => {
				expect( trie.size ).toBe( arrayifiedNode.length );
				expect( strTrie.size ).toBe( strings.length );
				expect( ( new Trie() ).size ).toBe( 0 );
			} );
			test( 'updates size in real time', () => {
				const initData = [
					'tennessee',
					'mi',
					'maine',
					'ohio',
					'miss.',
					'or',
					'nevada',
					'texas',
					'oregon',
					'missouri',
					'mississippi',
					'idaho',
					'michigan'
				];
				const testTrie = new Trie( initData );
				expect( testTrie.size ).toBe( initData.length );
				expect( testTrie.size ).toBe( testTrie.asArray().length );
				// extinct: 'miss.', 'mississippi', 'missouri'
				testTrie.removeAllStartingWith( 'mis' );
				expect( testTrie.size ).toBe( initData.length - 3 );
				expect( testTrie.size ).toBe( testTrie.asArray().length );
				// extinct: 'miss.', 'mississippi', 'missouri'
				testTrie.remove( 'mis' );
				expect( testTrie.size ).toBe( initData.length - 3 );
				expect( testTrie.size ).toBe( testTrie.asArray().length );
				// extinct: 'michigan', 'miss.', 'mississippi', 'missouri'
				testTrie.remove( 'michigan' );
				expect( testTrie.size ).toBe( initData.length - 4 );
				expect( testTrie.size ).toBe( testTrie.asArray().length );
				// extinct: 'michigan', 'miss.', 'mississippi', 'missouri'
				testTrie.remove( 'ten' );
				expect( testTrie.size ).toBe( initData.length - 4 );
				expect( testTrie.size ).toBe( testTrie.asArray().length );
				// extinct: 'michigan', 'miss.', 'missouri'
				testTrie.add( 'mississippi' );
				expect( testTrie.size ).toBe( initData.length - 3 );
				expect( testTrie.size ).toBe( testTrie.asArray().length );
				// extinct: 'michigan', 'miss.', 'missouri'
				testTrie.add( 'mi' );
				expect( testTrie.size ).toBe( initData.length - 3 );
				expect( testTrie.size ).toBe( testTrie.asArray().length );
				// extinct: 'michigan', 'missouri'
				testTrie.add( 'miss.' );
				expect( testTrie.size ).toBe( initData.length - 2 );
				expect( testTrie.size ).toBe( testTrie.asArray().length );
				// extinct: null
				testTrie.addMany([ 'michigan', 'missouri' ]);
				expect( testTrie.size ).toBe( initData.length );
				expect( testTrie.size ).toBe( testTrie.asArray().length );
			} );

		} );

	} );

} );
