import { expect } from '@jest/globals';

import type { TrieableNode } from '@webkrafters/trie';

declare module 'expect' {
    interface AsymmetricMatchers {
        toMatchNode<T>( expected : TrieableNode<T> ) : void;
        toMatchSequences<T>( expected : Array<Array<T>> ) : void;
    }
    interface Matchers<R> {
        toMatchNode<T>( expected : TrieableNode<T> ) : R;
        toMatchSequences<T>( expected : Array<Array<T>>) : R;
    }
}

expect.extend({ toMatchNode, toMatchSequences });

export function removeSequence<T>(
    sequences : Array<Array<T>>,
    { length : rLen, ...removedSequence } : Array<T>
) {
    return sequences.filter( seq => seq.length !== rLen || seq.some(( v, i ) => v !== removedSequence[ i ] ));
}

function toMatchNode<T>(
    actual : TrieableNode<T>,
    expected : TrieableNode<T>
) {
    let message : () => string;
    let pass : boolean = true;
    try {
        testNode2Node( actual, expected );
        message = () =>  `expected value ${
            this.utils.printReceived( actual )
        } is equal to ${
            this.utils.printExpected( expected )
        }`;
    } catch( e ) {
        message = () => e.message;
        pass = false;
    }
    return { message, pass };
}

function toMatchSequences<T>(
    actual : Array<Array<T>>,
    expected : Array<Array<T>>
) {
    let _expected = [ ...expected ];
    let pass = actual.length === _expected.length
        && actual.every(({ length: aLen, ...seqA }) => {
            const index = _expected.findIndex(
                seqE => seqE.length === aLen && seqE.every(( e, i ) => e === seqA[ i ])
            );
            if( index !== -1 ) {
                _expected.splice( index, 1 );
                return true;
            }
            return false;
        } );
    return {
        message: () => `expected ${
            this.utils.printReceived( actual )
        } sequences ${
            pass ? '' : 'does not'
        } comprise idetical values as ${
            this.utils.printReceived( expected )
        } sequences.`,
        pass
    };
}

function testNode2Node<T>(
    actual : TrieableNode<T>,
    expected : TrieableNode<T>,
    treeDepth = 0
) {
    if( !areEqual( actual.data, expected.data ) ) { 
        throw new Error( 'Actual node data (' + actual.data + ') is not equal to expected node data (' + expected.data + ') at tree depth ' + treeDepth + '.' );
    }
    if(( actual.isBoundary ?? false ) !== ( expected.isBoundary ?? false )) {
        throw new Error( 'Actual node isBoundary (' + actual.isBoundary + ') is not equal to expected node isBoundary (' + expected.isBoundary + ') at tree depth ' + treeDepth + '.' );
    }
    if(( actual.children?.length ?? 0 ) !== ( expected.children?.length ?? 0 ) ) {
        throw new Error( 'Actual node children (' + actual.children!.map( c => c.data ) + ') is not equal to expected node data (' + expected.children!.map( c => c.data ) + ') at tree depth ' + treeDepth + '.' );
    }
    ( actual.children ?? [] ).forEach( a => {
        const t = expected.children!.find( e => areEqual( a.data, e.data ) );
        if( !t ) {
            throw new ReferenceError( 'Actual node child at tree depth ' + treeDepth + ' where data = ' + a.data + ' missing in expected node children (' + expected.children!.map( c => c.data ) + ').' );
        }
        testNode2Node( a, t, treeDepth + 1 );
    } );
};

function areEqual( actual, expected ) {
    return actual === expected || (
        Array.isArray( actual ) && Array.isArray( expected ) &&
        actual.length === expected.length &&
        actual.every(( v, i ) => v === expected[ i ])
    );
}
