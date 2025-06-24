import type { TrieableNode } from '@webkrafters/trie';

/**
 * @example
 * Turning the follwing list of strings:
 * [ 'Tennessee', 'MI', 'Maine', 'Ohio', 'Miss.', 'OR', 'Nevada', 'Texas', 'Oregon', 'Missouri', 'Mississippi', 'Idaho', 'Michigan' ]
 * into a trieable node for the followoing visual model:
 *              ------------------------------------------------------------------------
 *              t              m            o               n, e, v, a, d, a     i, d, a, h, o
 *              e              |        ------^------         
 *        -------^-------      |    h, i, o         r              
 *        |      e, x, a, s    |               e, g, o, n 
 *  n, n, e, s, s, e, e        |                           
 *                             |                                                                                    
 *                      -------^-------      
 *                  a, i, n, e        i 
 *                         -----------^----------
 *                       s, s            c, h, i, g, a, n
 *             ------------^------------   
 *             .           |   i, s, s, i, p, p, i
 *                    o, u, r, i                                                                   
 */

export function getTrieableNode() : TrieableNode<string> {
    return {
        data: null,
        children: [{
            data: 't',
            children: [{
                data: 'e',
                children: [{
                    data: 'n',
                    children: [{
                        data: 'n',
                        children: [{
                            data: 'e',
                            children: [{
                                data: 's',
                                children: [{
                                    data: 's',
                                    children: [{
                                        data: 'e',
                                        children: [{
                                            data: 'e',
                                            isBoundary: true
                                        }]
                                    }]
                                }]
                            }]
                        }]
                    }]
                }, {
                    data: 'x',
                    children: [{
                        data: 'a',
                        children: [{
                            data: 's',
                            isBoundary: true
                        }]
                    }]
                }]
            }]
        }, {
            data: 'm',
            children: [{
                data: 'a',
                children: [{
                    data: 'i',
                    children: [{
                        data: 'n',
                        children: [{
                            data: 'e',
                            isBoundary: true
                        }]
                    }]
                }]
            }, {
                data: 'i',
                isBoundary: true,
                children: [{
                    data: 's',
                    children: [{
                        data: 's',
                        children: [{
                            data: '.',
                            isBoundary: true
                        }, {
                            data: 'o',
                            children: [{
                                data: 'u',
                                children: [{
                                    data: 'r',
                                    children: [{
                                        data: 'i',
                                        isBoundary: true
                                    }]
                                }]
                            }]
                        }, {
                            data: 'i',
                            children: [{
                                data: 's',
                                children: [{
                                    data: 's',
                                    children: [{
                                        data: 'i',
                                        children: [{
                                            data: 'p',
                                            children: [{
                                                data: 'p',
                                                children: [{
                                                    data: 'i',
                                                    isBoundary: true
                                                }]
                                            }]
                                        }]
                                    }]
                                }]
                            }]
                        }]
                    }]
                }, {
                    data: 'c',
                    children: [{
                        data: 'h',
                        children: [{
                            data: 'i',
                            children: [{
                                data: 'g',
                                children: [{
                                    data: 'a',
                                    children: [{
                                        data: 'n',
                                        isBoundary: true
                                    }]
                                }]
                            }]
                        }]
                    }]
                }]
            }]
        }, {
            data: 'o',
            children: [{
                data: 'h',
                children: [{
                    data: 'i',
                    children: [{
                        data: 'o',
                        isBoundary: true
                    }]
                }]
            }, {
                data: 'r',
                isBoundary: true,
                children: [{
                    data: 'e',
                    children: [{
                        data: 'g',
                        children: [{
                            data: 'o',
                            children: [{
                                data: 'n',
                                isBoundary: true
                            }]
                        }]
                    }]
                }]
            }]
        }, {
            data: 'n',
            children: [{
                data: 'e',
                children: [{
                    data: 'v',
                    children: [{
                        data: 'a',
                        children: [{
                            data: 'd',
                            children: [{
                                data: 'a',
                                isBoundary: true
                            }]
                        }]
                    }]
                }]
            }]
        }, {
            data: 'i',
            children: [{
                data: 'd',
                children: [{
                    data: 'a',
                    children: [{
                        data: 'h',
                        children: [{
                            data: 'o',
                            isBoundary: true
                        }]
                    }]
                }]
            }]
        }]
    };
}

export function getTrieableNodeCompressed() : TrieableNode<Array<string>> {
    return {
        data: null,
        children: [{
            data: [ 't', 'e' ],
            children: [{
                data: [ 'n', 'n', 'e', 's', 's', 'e', 'e' ],
                isBoundary: true
            }, {
                data: [ 'x', 'a', 's' ],
                isBoundary: true
            }]
        }, {
            data: [ 'm' ],
            children: [{
                data: [ 'a', 'i', 'n', 'e' ],
                isBoundary: true
            }, {
                data: [ 'i' ],
                isBoundary: true,
                children: [{
                    data: [ 's', 's' ],
                    children: [{
                        data: [ '.' ],
                        isBoundary: true
                    }, {
                        data: [ 'o', 'u', 'r', 'i' ],
                        isBoundary: true
                    }, {
                        data: [ 'i', 's', 's', 'i', 'p', 'p', 'i' ],
                        isBoundary: true
                    }]
                }, {
                    data: [ 'c', 'h', 'i', 'g', 'a', 'n' ],
                    isBoundary: true
                }]
            }]
        }, {
            data: [ 'o' ],
            children: [{
                data: [ 'h', 'i', 'o' ],
                isBoundary: true
            }, {
                data: [ 'r' ],
                isBoundary: true,
                children: [{
                    data: [ 'e', 'g', 'o', 'n' ],
                    isBoundary: true
                }],
            }]
        }, {
            data: [ 'n', 'e', 'v', 'a', 'd', 'a' ],
            isBoundary: true
        }, {
            data: [ 'i', 'd', 'a', 'h', 'o' ],
            isBoundary: true
        }]
    };
}

export function getStringListNode() : Array<string> {
    return [
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
}

export function getStringListNodeSorted() : Array<string> {
    return [
        'idaho',
        'maine',
        'mi',
        'michigan',
        'miss.',
        'mississippi',
        'missouri',
        'nevada',
        'ohio',
        'or',
        'oregon',
        'tennessee',
        'texas'
      ];
}

export function getArrayifiedNode() : Array<Array<string>> {
    return getStringListNode().map( s => s.split( '' ) )
}

export function getArrayifiedNodeSorted() : Array<Array<string>> {
    return getStringListNodeSorted().map( s => s.split( '' ) )
}

export const getExpectedTrieAsTrieableNode : () => TrieableNode<string> = (() => {
    function noMissingProperty(
        { children = [], ...input } : TrieableNode<string>,
        parentNode : TrieableNode<string>|null = null
    ) {
        const t : TrieableNode<string> = {
            children: new Array( children.length ),
            data: input.data,
            isBoundary: input.isBoundary ?? false,
            parent: parentNode
        };
        for( let cLen = children.length, c = 0; c < cLen; c++ ) {
            t.children![ c ] = noMissingProperty( children[ c ], t );
        }
        return t;
    };
    const trieableNode = getTrieableNode();
    return () => noMissingProperty( trieableNode );
})();
