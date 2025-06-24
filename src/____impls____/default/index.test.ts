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

	describe( 'methods', () => {
		
		describe( 'matches(...)', () => {

			let trie : Trie<string>;
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

			test( 'does not match own internal trieableNode representation', () => {
				const tNode = trie.viewInternalsAsNode();
				expect( trie.matches( tNode ) ).toBe( false );
				expect( trie.matches( new Trie( tNode ) ) ).toBe( false );
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
			let strings : Array<Array<string>>;
			let incoming : Array<Array<string>>;
			beforeAll(() => {
				strings = getArrayifiedNode();
				expected = [
					'tennessee', 'mi', 'miss.', 'maine', 'ohio', 'or'
				].map( v => v.split( '' ) );
				expected2 = [
					'mi', 'miss.', 'missouri', 'mississippi',
					'michigan', 'maine', 'ohio', 'or', 'oregon',
					'nevada', 'tennessee', 'texas', 'idaho'
				].map( v => v.split( '' ) );
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

	} );

} );
