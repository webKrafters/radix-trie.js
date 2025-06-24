import type {
    EqualityFn,
    Options,
    TrieableNode
} from '@webkrafters/trie';

import {
    afterAll,
	beforeAll,
	describe,
	expect,
    jest,
	test
} from '@jest/globals';

import { removeSequence } from './test-artifacts';

import {
    getArrayifiedNode,
    getArrayifiedNodeSorted,
    getExpectedTrieAsTrieableNode,
    getStringListNode,
    getStringListNodeSorted,
    getTrieableNode,
    getTrieableNodeCompressed
} from './test-artifacts/test-data';

import Base, { OpStatus, util } from '@webkrafters/trie';

import CompressedTrie, {
    CLOSED_MATCHES_METHOD_ERROR_MSG,
    CLOSED_MERGE_METHOD_ERROR_MSG,
    CType,
    RadixOptions,
    Segment
} from './main';

const arrayifiedNode = getArrayifiedNode();
const sortedArrayifiedNode = getArrayifiedNodeSorted();
const trieableNode = getTrieableNode();
const expectedTrieAsTrieableNode = getExpectedTrieAsTrieableNode();

class Trie<T> extends CompressedTrie<T> {
    get contentType() { return super.contentType }
    get options() { return super.options }
    createSegment( data ) { return super._createSegment( data ) }
    getFarthestNodeIn( prefix = [] ) { return super._getNodeAtPrefixEnd( prefix ) }
}

const logNode = ( tNode, label = 'MY DATA' ) => console.info(
    label.toUpperCase() + ' >>>>>>>>>>>>>>> ',
    JSON.stringify(
        tNode,
        ( k, v ) => k === 'parent' ? undefined : v,
        2
    )
);

/* ------- */

describe( 'Trie class', () => {

    describe( 'constructors(...)', () => {

        test( 'stores all non-string iterables or with string mixtures as arrays', () => {
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
                        data: [ 'c', 'h', 'i', 'g', 'a', 'n' ],
                        isBoundary: true
                    }, {
                        children: [{
                            children: [],
                            data: [ 'i', 's', 's', 'i', 'p', 'p', 'i' ],
                            isBoundary: true
                        }, {
                            children: [],
                            data: [ 'o', 'u', 'r', 'i' ],
                            isBoundary: true
                        }],
                        data: [ 's', 's' ],
                        isBoundary: true
                    }],
                    data: [ 'm', 'i' ],
                    isBoundary: false
                }, {
                    children: [{
                        children: [],
                        data: [ 'x', 'a', 's' ],
                        isBoundary: true
                    }, {
                        children: [],
                        data: [ 'n', 'n', 'e', 's', 's', 'e', 'e' ],
                        isBoundary: true
                    }],
                    data: [ 't', 'e' ],
                    isBoundary: false
                }, {
                    children: [],
                    data: [ 'n', 'e', 'v', 'a', 'd', 'a' ],
                    isBoundary: true
                }, {
                    children: [],
                    data: [ 'i', 'd', 'a', 'h', 'o' ],
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

        test( 'compresses TrieableNode to this instance', () => {
            const trie = new Trie( trieableNode );
            const tNode = trie.viewInternalsAsNode();
            expect( tNode ).not.toMatchNode( trieableNode );
            expect( trie.asTrieableNode() ).toMatchNode( trieableNode );
            expect( tNode ).toMatchNode( getTrieableNodeCompressed() );
        } );

        test( 'can be sorted', () => {
            let data = ( new Trie( arrayifiedNode, { sorted: true } ) ).asArray();
            expect( data ).not.toEqual( arrayifiedNode );
            expect( data ).toEqual( getArrayifiedNodeSorted() );
            const strings = getStringListNode();
            data = ( new Trie( strings, { sorted: true } ) ).asArray();
            expect( data ).not.toEqual( strings );
            expect( data ).toEqual( getStringListNodeSorted() );
        } );

        test( 'stores only complete sequences', () => {
            const trie = new Trie([
                'mississippi',
                'michigan',
                [ 'm', 'i', 's', 's' ],
                'missouri',
                [ 't', 'e', 'x', 'a', 's' ],
                'tennessee',
                [ 'n', 'e', 'v', 'a', 'd', 'a' ],
                [ 'i', 'd', 'a', 'h', 'o' ]
            ]);
            expect( trie.viewInternalsAsNode() ).toMatchNode({
                children: [{
                    children: [{
                        children: [],
                        data: [ 'c', 'h', 'i', 'g', 'a', 'n' ],
                        isBoundary: true
                    }, {
                        children: [{
                            children: [],
                            data: [ 'i', 's', 's', 'i', 'p', 'p', 'i' ],
                            isBoundary: true
                        }, {
                            children: [],
                            data: [ 'o', 'u', 'r', 'i' ],
                            isBoundary: true
                        }],
                        data: [ 's', 's' ],
                        isBoundary: true
                    }],
                    data: [ 'm', 'i' ],
                    isBoundary: false
                }, {
                    children: [{
                        children: [],
                        data: [ 'x', 'a', 's' ],
                        isBoundary: true
                    }, {
                        children: [],
                        data: [ 'n', 'n', 'e', 's', 's', 'e', 'e' ],
                        isBoundary: true
                    }],
                    data: [ 't', 'e' ],
                    isBoundary: false
                }, {
                    children: [],
                    data: [ 'n', 'e', 'v', 'a', 'd', 'a' ],
                    isBoundary: true
                }, {
                    children: [],
                    data: [ 'i', 'd', 'a', 'h', 'o' ],
                    isBoundary: true
                }],
                data: null,
                isBoundary: false
            });
            trie.removeAllStartingWith( 'mississip' ); // this will remove the entire entry for 'issippi'
            trie.removeAllStartingWith( 'nevad' );  // this will remove the entire entry for 'nevada'
            expect( trie.viewInternalsAsNode() ).toMatchNode({
                children: [{
                    children: [{
                        children: [],
                        data: [ 'c', 'h', 'i', 'g', 'a', 'n' ],
                        isBoundary: true
                    }, {
                        children: [{
                            children: [],
                            data: [ 'o', 'u', 'r', 'i' ],
                            isBoundary: true
                        }],
                        data: [ 's', 's' ],
                        isBoundary: true
                    }],
                    data: [ 'm', 'i' ],
                    isBoundary: false
                }, {
                    children: [{
                        children: [],
                        data: [ 'x', 'a', 's' ],
                        isBoundary: true
                    }, {
                        children: [],
                        data: [ 'n', 'n', 'e', 's', 's', 'e', 'e' ],
                        isBoundary: true
                    }],
                    data: [ 't', 'e' ],
                    isBoundary: false
                }, {
                    children: [],
                    data: [ 'i', 'd', 'a', 'h', 'o' ],
                    isBoundary: true
                }],
                data: null,
                isBoundary: false
            });
        } );

    } );

    describe( 'methods', () => {

        describe( 'add(...)', () => {

            describe( 'packing all in parent node', () => {

                test( 'accepting array of data', () => {
                    const entry1 = [ 'm', 'i', 's', 's', 'i', 's', 's', 'i', 'p', 'p', 'i' ];
                    const trie = new Trie<string>([ entry1 ]);
                    const hashableEntry1 = trie.createSegment( entry1 );
                    const rootNode = trie.getFarthestNodeIn();
                    expect( rootNode.childNodes.size ).toBe( 1 );
                    let onlyChild =  rootNode.childNodes.get( hashableEntry1 as unknown as string );
                    expect( onlyChild.childNodes.size ).toBe( 0 );
                    const entry2 = [ 'm', 'i', 's', 's' ];
                    const hashableEntry2 = trie.createSegment( entry2 );
                    trie.add( entry2 );
                    expect( rootNode.childNodes.get( hashableEntry1 as unknown as string ) ).toBeNull();
                    onlyChild = rootNode.childNodes.get( hashableEntry2 as unknown as string );
                    expect( onlyChild.childNodes.size ).toBe( 1 );
                    onlyChild = onlyChild.childNodes.get( hashableEntry1.slice( entry2.length ) as unknown as string )
                    expect( onlyChild.childNodes.size ).toBe( 0 );
                } );

                test( 'accepting strings', () => {
                    const entry1 = 'mississippi';
                    const trie = new Trie<string>([ entry1 ]);
                    const hashableEntry1 = trie.createSegment( entry1 );
                    const rootNode = trie.getFarthestNodeIn();
                    expect( rootNode.childNodes.size ).toBe( 1 );
                    let onlyChild = rootNode.childNodes.get( hashableEntry1 as unknown as string );
                    expect( onlyChild.childNodes.size ).toBe( 0 );
                    const entry2 = 'miss';
                    const hashableEntry2 = trie.createSegment( entry2 );
                    trie.add( entry2 );
                    expect( rootNode.childNodes.get( hashableEntry1 as unknown as string ) ).toBeNull();
                    onlyChild = rootNode.childNodes.get( hashableEntry2 as unknown as string );
                    expect( onlyChild.childNodes.size ).toBe( 1 );
                    onlyChild = onlyChild.childNodes.get( hashableEntry1.slice( entry2.length ) as unknown as string )
                    expect( onlyChild.childNodes.size ).toBe( 0 );
                } );

            } );

            describe( 'determining string data packing', () => {

                test( 'will store all string data as-is for every string added', () => {
                    const trie = new Trie<string>([ 'mississippi', 'michigan' ]);
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

                test( 'will arraify all convert entries once a non-string iterable is added to the trie', () => {
                    const trie = new Trie<string>([ 'mississippi', 'michigan' ]);
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
                                data: [ 'c', 'h', 'i', 'g', 'a', 'n' ],
                                isBoundary: true
                            }, {
                                children: [{
                                    children: [],
                                    data: [ 'i', 's', 's', 'i', 'p', 'p', 'i' ],
                                    isBoundary: true
                                }, {
                                    children: [],
                                    data: [ 'o', 'u', 'r', 'i' ],
                                    isBoundary: true
                                }],
                                data: [ 's', 's' ],
                                isBoundary: false
                            }],
                            data: [ 'm', 'i' ],
                            isBoundary: false
                        }],
                        data: null,
                        isBoundary: false
                    });
                } );

                test( 'arraifies all incoming strings in order to maintain the arraified trie once the first non-string iterable sequence enters the trie', () => {
                    const trie = new Trie<string>([
                        [ 'm', 'i', 's', 's', 'i', 's', 's', 'i', 'p', 'p', 'i' ],
                        [ 'm', 'i', 'c', 'h', 'i', 'g', 'a', 'n' ]
                    ]);
                    expect( trie.viewInternalsAsNode() ).toMatchNode({
                        children: [{
                            children: [{
                                children: [],
                                data: [ 's', 's', 'i', 's', 's', 'i', 'p', 'p', 'i' ],
                                isBoundary: true
                            }, {
                                children: [],
                                data: [ 'c', 'h', 'i', 'g', 'a', 'n' ],
                                isBoundary: true
                            }],
                            data: [ 'm', 'i' ],
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
                                data: [ 'c', 'h', 'i', 'g', 'a', 'n' ],
                                isBoundary: true
                            }, {
                                children: [{
                                    children: [],
                                    data: [ 'i', 's', 's', 'i', 'p', 'p', 'i' ],
                                    isBoundary: true
                                }, {
                                    children: [],
                                    data: [ 'o', 'u', 'r', 'i' ],
                                    isBoundary: true
                                }],
                                data: [ 's', 's' ],
                                isBoundary: false
                            }],
                            data: [ 'm', 'i' ],
                            isBoundary: false
                        }],
                        data: null,
                        isBoundary: false
                    });
                } );

            } );
            
        } );

        describe( 'addMany(...)', () => {

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
                expect( trie.viewInternalsAsNode() ).toMatchNode({
                    children: [{
                        children: [{
                            children: [{
                                children: [],
                                data: [ 'i', 's', 's', 'i', 'p', 'p', 'i' ],
                                isBoundary: true
                            }, {
                                children: [],
                                data:  [ 'o', 'u', 'r', 'i' ],
                                isBoundary: true
                            }],
                            data: [ 's', 's' ],
                            isBoundary: true
                        }, {
                            children: [],
                            data: [ 'c', 'h', 'i', 'g', 'a', 'n' ],
                            isBoundary: true
                        }],
                        data: [ 'm', 'i' ],
                        isBoundary: false
                      }, {
                        children: [{
                            children: [],
                            data: [ 'x', 'a', 's' ],
                            isBoundary: true
                        }, {
                            children: [],
                            data: [ 'n', 'n', 'e', 's', 's', 'e', 'e' ],
                            isBoundary: true
                        }],
                        data: [ 't', 'e' ],
                        isBoundary: false
                      }, {
                        children: [],
                        data: [ 'n', 'e', 'v', 'a', 'd', 'a' ],
                        isBoundary: true
                      }, {
                        children: [],
                        data: [ 'i', 'd', 'a', 'h', 'o' ],
                        isBoundary: true
                    }],
                    data: null,
                    isBoundary: false
                })
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
                expect( trie.viewInternalsAsNode()).toMatchNode({
                    children: [{
                        children: [{
                            children: [],
                            data: [ 'c', 'h', 'i', 'g', 'a', 'n' ],
                            isBoundary: true
                        }, {
                            children: [{
                                children: [],
                                data: [ 'i', 's', 's', 'i', 'p', 'p', 'i' ],
                                isBoundary: true
                            }, {
                                children: [],
                                data: [ 'o', 'u', 'r', 'i' ],
                                isBoundary: true
                            }],
                            data: [ 's', 's' ],
                            isBoundary: true
                        }],
                        data: [ 'm', 'i' ],
                        isBoundary: false
                    }, {
                        children: [{
                            children: [],
                            data: [ 'x', 'a', 's' ],
                            isBoundary: true
                        }, {
                            children: [],
                            data: [ 'n', 'n', 'e', 's', 's', 'e', 'e' ],
                            isBoundary: true
                        }],
                        data: [ 't', 'e' ],
                        isBoundary: false
                    }, {
                        children: [],
                        data: [ 'n', 'e', 'v', 'a', 'd', 'a' ],
                        isBoundary: true
                    }, {
                        children: [],
                        data: [ 'i', 'd', 'a', 'h', 'o' ],
                        isBoundary: true
                    }],
                    data: null,
                    isBoundary: false
                })
            } );

        } );

        describe( 'asArray(...)', () => {

            let trieArr : Trie<string>|null;
            let trieStr : Trie<string>|null;
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
            });
            afterAll(() => { trieArr = trieStr = null });

            test( 'produces all complete sequences by default', () => {
                expect( trieArr!.asArray() ).toEqual([
                    [ 'm', 'i', 's', 's' ],
                    [ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ],
                    [ 'm', 'i', 'c', 'h', 'i', 'g', 'a', 'n' ],
                    [ 't', 'e', 'x', 'a', 's' ],
                    [ 't', 'e', 'n', 'n', 'e', 's', 's', 'e', 'e' ],
                    [ 'n', 'e', 'v', 'a', 'd', 'a' ],
                    [ 'i', 'd', 'a', 'h', 'o' ]
                ]);
                expect( trieStr!.asArray() ).toEqual([
                    'michigan',
                    'miss',
                    'missouri',
                    'texas',
                    'tennessee',
                    'nevada',
                    'idaho'
                ]);
            } );
            
            test( 'produces only complete sequences even when the "completeSequencesOnly" flag is unset', () => {
                expect( trieArr!.asArray( false ) ).toEqual([
                    [ 'm', 'i', 's', 's' ],
                    [ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ],
                    [ 'm', 'i', 'c', 'h', 'i', 'g', 'a', 'n' ],
                    [ 't', 'e', 'x', 'a', 's' ],
                    [ 't', 'e', 'n', 'n', 'e', 's', 's', 'e', 'e' ],
                    [ 'n', 'e', 'v', 'a', 'd', 'a' ],
                    [ 'i', 'd', 'a', 'h', 'o' ]
                ]);
                expect( trieStr!.asArray( false ) ).toEqual([
                    'michigan',
                    'miss',
                    'missouri',
                    'texas',
                    'tennessee',
                    'nevada',
                    'idaho'
                ]);
            } );

        } );

        describe( 'asTrieableNode(...)', () => {

            test( 'returns a trieableNode of strings in its lowest common presentation', () => {
                expect(
                    ( new Trie( getStringListNode() ) )
                    .asTrieableNode()
                ).toMatchNode( getTrieableNode() )
            } );

            test( 'returns a trieableNode of items in its lowest common presentation', () => {
                expect(
                    ( new Trie( arrayifiedNode ) )
                    .asTrieableNode()
                ).toMatchNode( getTrieableNode() )
            } );

        } );

        describe( 'getFarthestIn(...)', () => {

            let trieArr : Trie<string>;
            let trieStr : Trie<string>;
            beforeAll(() => {
                trieArr = new Trie( getArrayifiedNode() );
                trieStr = new Trie( getStringListNode() );
            });

            test( 'produces an empty sequence if none found in this Trie', () => {
                expect( trieArr.getFarthestIn([
                    'w', 'e', 's', 't', ' ', 'v', 'i', 'r', 'g', 'i', 'n', 'i', 'a'
                ]) ).toEqual( [] );
                expect( trieStr.getFarthestIn([
                    'w', 'e', 's', 't', ' ', 'v', 'i', 'r', 'g', 'i', 'n', 'i', 'a'
                ]) ).toEqual( '' );
                // --- using strings --- //
                expect( trieArr.getFarthestIn( 'west virginia' ) ).toEqual( [] );
                expect( trieStr.getFarthestIn( 'west virginia' ) ).toEqual( '' );
            } );

            test( 'produces an empty sequence for an empty sequence', () => {
                expect( trieArr.getFarthestIn() ).toEqual( [] );
                expect( trieStr.getFarthestIn() ).toEqual( '' );
                expect( trieArr.getFarthestIn( '' ) ).toEqual( [] ) ;
                expect( trieStr.getFarthestIn( '' ) ).toEqual( '' );
                expect( trieArr.getFarthestIn( [] ) ).toEqual( [] );
                expect( trieStr.getFarthestIn( [] ) ).toEqual( '' );
            } );

            test( 'produces all items if all found in this Trie', () => {
                expect( trieArr.getFarthestIn([
                    'n', 'e', 'v', 'a', 'd', 'a'
                ]) ).toEqual([ 'n', 'e', 'v', 'a', 'd', 'a' ]);
                expect( trieStr.getFarthestIn([
                    'n', 'e', 'v', 'a', 'd', 'a'
                ]) ).toEqual( 'nevada' );
                // --- using strings --- //
                expect( trieArr.getFarthestIn( 'nevada' ) ).toEqual([ 'n', 'e', 'v', 'a', 'd', 'a' ]);
                expect( trieStr.getFarthestIn( 'nevada' ) ).toEqual( 'nevada' );
            } );

            test( 'can only produce up to the last complete sequence in this Trie found in the prefix', () => {
                expect( trieArr.getFarthestIn([
                    'm', 'i', 'c', 'h', 'o', 'a', 'c', 'a', 'n'
                ]) ).toEqual([ 'm', 'i' ]);
                expect( trieArr.getFarthestIn([ 't', 'e', 'n' ]) ).toEqual([ 't', 'e' ]);
                expect( trieStr.getFarthestIn([
                    'm', 'i', 'c', 'h', 'o', 'a', 'c', 'a', 'n'
                ]) ).toEqual( 'mi' );
                expect( trieStr.getFarthestIn([ 't', 'e', 'n' ]) ).toEqual( 'te' );
                // --- using strings --- //
                expect( trieArr.getFarthestIn( 'michoacan' ) ).toEqual([ 'm', 'i' ]);
                expect( trieArr.getFarthestIn( 'ten' ) ).toEqual([ 't', 'e' ]);
                expect( trieStr.getFarthestIn( 'michoacan' ) ).toEqual( 'mi' );
                expect( trieStr.getFarthestIn( 'ten' ) ).toEqual( 'te' );
            } );
        } );

        describe( 'getAllStartingWith(...)', () => {

            let trieArr : Trie<string>;
            let trieStr : Trie<string>;
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

            test( 'cannot produce incomplete sequences -- this instance does not store them', () => {
                let trie = new Trie( trieableNode );
                let prefix = [ 'm', 'i', 's' ];
                let actual = trie.getAllStartingWith( prefix );
                const sequences = [
                    [ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ],
                    [ 'm', 'i', 's', 's', 'i', 's', 's', 'i', 'p', 'p', 'i' ],
                    [ 'm', 'i', 's', 's', '.' ]
                ];
                const sequenceStrs = [ 'miss.', 'missouri', 'mississippi' ];
                let mississip = [ 'm', 'i', 's', 's', 'i', 's', 's', 'i', 'p' ];
               
                expect( actual ).toMatchSequences( sequences );
                actual = trie.getAllStartingWith( prefix, false );
                expect( actual ).toMatchSequences( sequences );
                trie.removeAllStartingWith( mississip );
                expect( trie.getAllStartingWith( prefix ) ).toMatchSequences([
                    [ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ],
                    [ 'm', 'i', 's', 's', '.' ]
                ]);
                expect( trie.getAllStartingWith( prefix, false ) ).toMatchSequences([
                    [ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ],
                    [ 'm', 'i', 's', 's', '.' ]
                ]);

                trie = new Trie( getStringListNode() );
                actual = trie.getAllStartingWith( prefix, false );
                expect( actual ).toEqual( sequenceStrs );
                expect( actual ).toEqual( sequenceStrs );
                trie.removeAllStartingWith( mississip );
                expect( trie.getAllStartingWith( prefix ) )
                    .toEqual([ 'miss.', 'missouri' ]);
                expect( trie.getAllStartingWith( prefix, false ) )
                    .toEqual([ 'miss.', 'missouri' ]);

                // --- using strings --- //

                prefix = prefix.join( '' ) as unknown as Array<string>;
                mississip = mississip.join( '' ) as unknown as Array<string>;
                
                trie = new Trie( trieableNode );
                actual = trie.getAllStartingWith( prefix );
                expect( actual ).toEqual([
                    [ 'm', 'i', 's', 's', '.' ],
                    [ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ],
                    [ 'm', 'i', 's', 's', 'i', 's', 's', 'i', 'p', 'p', 'i' ]
                ]);
                actual = trie.getAllStartingWith( prefix, false );
                expect( actual ).toEqual([
                    [ 'm', 'i', 's', 's', '.' ],
                    [ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ],
                    [ 'm', 'i', 's', 's', 'i', 's', 's', 'i', 'p', 'p', 'i' ]
                ]);
                trie.removeAllStartingWith( mississip );
                expect( trie.getAllStartingWith( prefix ) ).toEqual([
                    [ 'm', 'i', 's', 's', '.' ],
                    [ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ]
                ]);
                expect( trie.getAllStartingWith( prefix, false ) ).toEqual([
                    [ 'm', 'i', 's', 's', '.' ],
                    [ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ]
                ]);

                trie = new Trie( getStringListNode() );
                actual = trie.getAllStartingWith( prefix );
                expect( actual ).toMatchSequences( sequences );
                actual = trie.getAllStartingWith( prefix, false );
                expect( actual ).toMatchSequences( sequences );
                trie.removeAllStartingWith( mississip );
                expect( trie.getAllStartingWith( prefix ) )
                    .toEqual([ 'miss.', 'missouri' ]);
                expect( trie.getAllStartingWith( prefix, false ) )
                    .toEqual([ 'miss.', 'missouri' ]);

            } );

        } );

        describe( 'has(...)', () => {
            
            let trieArr : Trie<string>;
            let trieStr : Trie<string>;
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
            
            test( 'is unavailable on this instance', () => {
                const stringListNode = getStringListNode();
                expect(() => new Trie( arrayifiedNode ).matches( arrayifiedNode ) ).toThrow( CLOSED_MATCHES_METHOD_ERROR_MSG );
                expect(() => new Trie( stringListNode ).matches( stringListNode ) ).toThrow( CLOSED_MATCHES_METHOD_ERROR_MSG );
            } );

            describe( 'invoking the ancestral matches(...) method', () => {
                test( 'matches an existing trie directly with ancestral instance', () => {
                    class Trie extends CompressedTrie<string> {
                        matches() { return super._matches({ data: 'test' } ) }
                    }
                    const thisTrie = new Trie();
                    const superMatchesSpy = jest
                        .spyOn( Base.prototype, 'matches' )
                        .mockReturnValue( true );
                    thisTrie.matches();
                    expect( superMatchesSpy ).toHaveBeenCalled();
                    superMatchesSpy.mockRestore();
                } );

            } );
            
        
        } );
        
        describe( 'merge(...)', () => {

            test( 'is unavailable on this instance', () => {
                const stringListNode = getStringListNode();
                expect(() => new Trie( arrayifiedNode ).merge( trieableNode ) ).toThrow( CLOSED_MERGE_METHOD_ERROR_MSG );
                expect(() => new Trie( stringListNode ).merge( trieableNode ) ).toThrow( CLOSED_MERGE_METHOD_ERROR_MSG );
            } );

            describe( 'invoking the ancestral merge(...) method', () => {
                test( 'merges an existing trie directly into ancestral instance', () => {
                    class Trie extends CompressedTrie<string> {
                        merge() { super._merge({ data: 'test' } ) }
                    }
                    const thisTrie = new Trie();
                    const superMergeSpy = jest
                        .spyOn( Base.prototype, 'merge' )
                        .mockReturnValue( undefined );
                    thisTrie.merge();
                    expect( superMergeSpy ).toHaveBeenCalled();
                    superMergeSpy.mockRestore();
                } );

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
                });
            } );

            test( 'returns a trieableNodes of compressed sub arrays of iterable sequences', () => {
                expect(( new Trie([
                    [ 'm', 'i', 's', 's', 'i', 's', 's', 'i', 'p', 'p', 'i' ],
                    [ 'm', 'i', 'c', 'h', 'i', 'g', 'a', 'n' ],
                    [ 'm', 'i', 's', 's' ],
                    [ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ],
                    [ 't', 'e', 'x', 'a', 's' ],
                    [ 't', 'e', 'n', 'n', 'e', 's', 's', 'e', 'e' ],
                    [ 'n', 'e', 'v', 'a', 'd', 'a' ],
                    [ 'i', 'd', 'a', 'h', 'o' ]
                ]) ).viewInternalsAsNode()).toMatchNode({
                    children: [{
                        children: [{
                            children: [{
                                children: [],
                                data: [ 'i', 's', 's', 'i', 'p', 'p', 'i' ],
                                isBoundary: true
                            }, {
                                children: [],
                                data:  [ 'o', 'u', 'r', 'i' ],
                                isBoundary: true
                            }],
                            data: [ 's', 's' ],
                            isBoundary: true
                        }, {
                            children: [],
                            data: [ 'c', 'h', 'i', 'g', 'a', 'n' ],
                            isBoundary: true
                        }],
                        data: [ 'm', 'i' ],
                        isBoundary: false
                    }, {
                        children: [{
                            children: [],
                            data: [ 'x', 'a', 's' ],
                            isBoundary: true
                        }, {
                            children: [],
                            data: [ 'n', 'n', 'e', 's', 's', 'e', 'e' ],
                            isBoundary: true
                        }],
                        data: [ 't', 'e' ],
                        isBoundary: false
                    }, {
                        children: [],
                        data: [ 'n', 'e', 'v', 'a', 'd', 'a' ],
                        isBoundary: true
                    }, {
                        children: [],
                        data: [ 'i', 'd', 'a', 'h', 'o' ],
                        isBoundary: true
                    }],
                    data: null,
                    isBoundary: false
                })
            } );

            test( 'can only produce a compressed version of the origin TrieableNode matching this instance', () => {
                const tNode = new Trie( trieableNode ).viewInternalsAsNode();
                expect( tNode ).not.toMatchNode( trieableNode );
                expect( tNode ).toMatchNode( getTrieableNodeCompressed() );
            } );

        } );
    } );

    describe( 'properties', () => {
        let trie : Trie<string>;
        let strTrie : Trie<string>;
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
        test( 'contentType', () => {
            expect( trie.contentType ).toBe( CType.ARRAY );
            expect( strTrie.contentType ).toBe( CType.STRING );
        } );
        test( 'options', () => {
            const expected = {
                equalityMatcher: expect.any( Function ),
                isUnitEqual: expect.any( Function ),
                isUnitLessThan: expect.any( Function ),
                lessThanMatcher: expect.any( Function )
            };
            expect( trie.options ).toEqual( expected );
            expect( new Trie( arrayifiedNode, { sorted: true } ).options )
                .toEqual({ ...expected, sorted: expect.any( Boolean ) });
        } );

    } );

} );
