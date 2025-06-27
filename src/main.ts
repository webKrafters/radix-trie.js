import Base, {
    Compared,
    EqualityFn,
    Node,
    OpStatus,
    Options,
    TrieableNode,
    util
} from '@webkrafters/trie';

export interface RadixOptions<T = unknown> extends Options<T> {
    isUnitEqual : EqualityFn<T>;
    isUnitLessThan : EqualityFn<T>;
}

const {
    bSearch,
    computeHash,
    defaultEqMatcher,
    defaultLtMatcher,
    getTypeName,
    toArray
} = util;

export enum CType {
    ARRAY = 0,
    STRING = 1
};

export const CLOSED_MATCHES_METHOD_ERROR_MSG = 'The public `matches` method is unavailable.\nImplement it in your derived class as needed.\nMay use the `_matches` method to access the parent public `matches` method.';

export const CLOSED_MERGE_METHOD_ERROR_MSG = 'The public `merge` method is unavailable.\nImplement it in your derived class as needed.\nMay use the `_merge` method to access the parent public `matches` method.';

export default abstract class Trie<T = unknown> extends Base<T> {

    static superOptions : Options = {
        equalityMatcher: ( <T>( data : Segment<T>, comprahend : Segment<T> ) => data.equals( comprahend ) ) as EqualityFn,
        lessThanMatcher: ( <T>( data : Segment<T>, comprahend : Segment<T> ) => data.isLessThan( comprahend ) ) as EqualityFn
    };

    private _contentType : CType = CType.STRING;
    private _opts : RadixOptions<T>;
    private _size = 0;

    constructor( data? : Base<T>, opts? : Options<T> );
    constructor( data? : TrieableNode<T>, opts? : Options<T> );
    constructor( data? : Array<TrieableNode<T>>, opts? : Options<T> );
    constructor( data? : Array<Iterable<T>>, opts? : Options<T> );
    constructor( data? : Array<Iterable<T>|TrieableNode<T>>, opts? : Options<T> );
    constructor( data, opts ) {
        super( undefined, { ...opts, ...Trie.superOptions } );
        this._opts = buildMatcherOptions( opts );
        this.addMany(
            !Array.isArray( data )
                ? ( data instanceof Base ? data : new Base( data ) ).asArray()
                : data
        );
    }
    
    get size() { return this._size }
    
    protected get contentType() { return this._contentType }
    protected get options() { return this._opts }
    
    add( sequence : Iterable<T> ) { this._add( this._prepareEntry( sequence ) ) }
    addMany( sequences : Array<Iterable<T>> ) : void;
    addMany( sequences : Array<TrieableNode<T>> ) : void;
    addMany( sequences : Array<Iterable<T>|TrieableNode<T>> ) : void;
    addMany( sequences ) {
        this._addMany( normalize( sequences ) as Array<Array<T>> );
    }
    asArray( completeSequencesOnly = true ) {
        return this._join2Dim( super.asArray( completeSequencesOnly ) as Array<Iterable<Segment<T>>> ) as Array<Iterable<T>>;
    }
    /**
     * Produces a TrieableNode reflecting the fully uncompressed version of this instance.
     * @see `viewInternalsAsNode` method to view the compressed version.
     */
    asTrieableNode() : TrieableNode<T> {
        return expandNode( this.viewInternalsAsNode() as TrieableNode<string> );
    }
    getFarthestIn( sequence : Iterable<T> = [] ) {
        const farthest = this._getFarthestIn( this._adjustForSegmentType( sequence ) );
        return !farthest ? [] : this._join2Dim([ farthest ])[ 0 ] as Iterable<T>;
    }
    getAllStartingWith(
        prefix : Iterable<T> = [],
        completeSequencesOnly = true
    ) : Array<Iterable<T>> {
        const _pSegment = this._createSegment( this._adjustForSegmentType( prefix ) );
        let sNode : Node<Segment<T>>;
        L0: {
            const pLen = _pSegment.length;
            if( !pLen ) { return [] }
            let farthestRange = this._getFarthestIn( _pSegment );
            const rLen = countUnitsIn( farthestRange );
            sNode = this._getNodeAtPrefixEnd( rLen === 0 ? [] : farthestRange as Iterable<T> ) as Node<Segment<T>>;
            if( rLen === pLen ) { break L0 }
            sNode = this._findNodeAtPrefix(
                _pSegment.splice( rLen ),
                sNode.childNodes.list()
            );
            if( !sNode ) { return [] }
            _pSegment.splice( _pSegment.length, 0, ...sNode.data.value as Iterable<T> )
        }
        const data = sNode.asArray( completeSequencesOnly );
        for( let d = data.length; d--; ) { data[ d ] = [ _pSegment, ...data[ d ] ] }
        return this._join2Dim( data ) as Array<Iterable<T>>;
    }
    has( sequence : Iterable<T> ) {
        return super.has(
            this._getExactSegmentsFor(
                this._adjustForSegmentType( sequence )
            ) as Iterable<T> 
        );
    }
    /**
     * Implements `_matches` affirming that the argument is either identical to this instance or is a data configuration which can produce an instance identical to this instance.
     * @see `_matches(...)` protected method below.
     */
    matches( graph: Array<Iterable<T>> ) : boolean;
    matches( graph: Array<TrieableNode<T>> ) : boolean;
    matches( graph: TrieableNode<T> ) : boolean;
    matches( graph: Base<T> ) : boolean;
    matches( graph ) {
        throw new Error( CLOSED_MATCHES_METHOD_ERROR_MSG );
        // istanbul ignore next
        return false;
    }
    /** @see `_merge(...)` protected method below */
    merge( graph : Base<T> ) : void;
    merge( graph : TrieableNode<T> ) : void;
    merge( graph ) { throw new Error( CLOSED_MERGE_METHOD_ERROR_MSG ) }
    remove( sequence : Iterable<T> ) {
        const removed = super.remove(
            this._getExactSegmentsFor(
                this._adjustForSegmentType( sequence )
            ) as Iterable<T>
        );
        removed && this._size--;
        return removed;
    }
    removeAllStartingWith( prefix : Iterable<T> = [] ) {
        const _pSegment = this._createSegment( this._adjustForSegmentType( prefix ) );
        if( !_pSegment.length ) { return }
        const pSegSequence = this._getFarthestIn( _pSegment );
        const sNode = this._getNodeAtPrefixEnd(
            !pSegSequence.length ? [] : pSegSequence as Iterable<T>
        ) as Node<Segment<T>>;
        const pSeqCount = countUnitsIn( pSegSequence );
        if( pSeqCount === _pSegment.length ) {
            this._size -= sNode.size;
            return sNode.parentNode.childNodes.remove( sNode );
        }
        const removable = this._findNodeAtPrefix(
            _pSegment.slice( pSeqCount ),
            sNode.childNodes.list()
        );
        if( !removable ) { return }
        this._size -= removable.size;
        sNode.childNodes.remove( removable );
    }
    removeMany( { length: sLen, ...sequences } : Array<Iterable<T>> ) {
        const statusList : Array<OpStatus> = new Array( sLen );
        for( let s = sLen; s--; ) {
            statusList[ s ] = this.remove( sequences[ s ] )
                ? OpStatus.SUCCESSFUL
                : OpStatus.FAILED;
        }
        return statusList;
    }  
    /** Produces TrieableNode reflecting this instance as-is. */
    viewInternalsAsNode() {
        return { ...this._fromSegmentableNode( super.asTrieableNode() ), data: null };
    }
    private _add( sequence : string ) : void;
    private _add( sequence : Iterable<T> ) : void;
    private _add( sequence ) {
        let sNode : Node<Segment<T>>;
        let rem : Segment<T>;
        {
            const seqSegment = this._createSegment( sequence )
            const pSegSequence = this._getFarthestIn( seqSegment );
            const pSeqCount = countUnitsIn( pSegSequence );
            rem = seqSegment.slice( pSeqCount );
            if( !rem.length ) { return }
            sNode = this._getNodeAtPrefixEnd( pSegSequence as Iterable<T> ) as Node<Segment<T>>;
        }
        let splitNode = this._findNodeAtPrefix(
            rem.slice( 0, 1 ),
            sNode.childNodes.list()
        );
        if( !splitNode ) {
            this._size++;
            return sNode.addChild([ rem ]);
        }
        sNode.childNodes.remove( splitNode );
        const splitVal = splitNode.data;
        let splitIndex = 0;
        const rLen = rem.length;
        const sLen = splitVal.length;
        for( ; splitIndex < rLen || splitIndex < sLen; splitIndex++ ) {
            if( !this._opts.isUnitEqual(
                rem.at( splitIndex ) as T,
                splitVal.at( splitIndex )
            ) ) { break }
        }
        const trieable = splitNode.asTrieableNode();
        trieable.data = splitVal.slice( splitIndex );
        const newChildren = [ trieable ];
        const isBifurcating = splitIndex < rLen;
        isBifurcating && newChildren.push({
            data: rem.slice( splitIndex ),
            isBoundary: true
        });
        sNode.mergeTrieableNode({
            children: newChildren,
            data: rem.slice( 0, splitIndex ),
            isBoundary: !isBifurcating
        });
        this._size++;
    }
    private _addMany( sequences : Array<string> ) : void;
    private _addMany( sequences : Array<Array<T>> ) : void;
    private _addMany({ length: sLen, ...sequences }) {
        for( let s = 0; s < sLen; s++ ) { this.add( sequences[ s ] ) }
    }
    private _adjustForSegmentType( sequence : Iterable<T> ) {
        return this._contentType === CType.STRING && !isAnyOfTypes( sequence, 'string' )
            ? toArray( sequence ).join( '' ) as Iterable<T>
            : sequence;
    }
    /** replaces all `data = Segment` in trieableNode with `data = Segment.value` */
    private _fromSegmentableNode( trieableNode : TrieableNode<T> ) {
        for( let c = trieableNode.children.length; c--; ) {
            this._fromSegmentableNode( trieableNode.children[ c ] );
        }
        trieableNode.data = ( trieableNode.data as Segment<T> )?.value as T;
        return trieableNode;
    }
    private _getExactSegmentsFor( sequence : Iterable<T> ) {
        const eSequence = this._getFarthestIn( sequence );
        return countUnitsIn( eSequence ) === ( this._createSegment( sequence ) ).length
            ? eSequence
            : [];
    }
    /**
     * This will produce the longest sequence containing up to the word.
     * 
     * @param {string} word 
     * @returns {Array<string>}
     * @example
     * Considering the following haystack: [['a', 'b', 'c'], ['d', 'e' ], [ 'f', 'g' ]]
     * Searching for ['a', 'b', 'c', 'd'] in the haystack would yeild [['a', 'b', 'c']]
     * Searching for ['a', 'b', 'c', 'd', 'y', 'z'] in the haystack would yeild [['a', 'b', 'c']]
     * Searching for ['a', 'b', 'c', 'd', 'e', 'f', 'g'] in the haystack would yeild the haystack
     * Searching for ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm'] in the haystack would yeild the haystack
     */
    private _getFarthestIn( sequence : Segment<T> ) : Array<Segment<T>>;
    private _getFarthestIn( sequence : Iterable<T> ) : Array<Segment<T>>;
    private _getFarthestIn( sequence ) {
        const seqSegments : Segment<T> = !( sequence instanceof Segment )
            ? this._createSegment( sequence )
            : sequence.slice();
        const sLen  = seqSegments.length;
        const segments : Array<Segment<T>> = [];
        let currentNode = this._getNodeAtPrefixEnd( [] ) as Node<Segment<T>>;
        let segStart = 0;
        while( segStart < sLen && currentNode.childNodes.size ) {
            const thisChild = this._findNodeAtPrefix(
                seqSegments.slice( segStart, segStart + 1 ),
                currentNode.childNodes.list()
            );
            if( thisChild === null ) { break }
            const { data } = thisChild;
            const dLen = data.length;
            const suffixLen = sLen - segStart;
            if( dLen > suffixLen ) { break }
            let matchCount = 0;
            for( ; matchCount < dLen; matchCount++, segStart++ ) {
                if( !this._opts.isUnitEqual(
                    data.at( matchCount ) as T,
                    seqSegments.at( segStart )
                ) ) { break }
            }
            if( matchCount < dLen ) { break }
            segments.push( data );
            if( dLen === suffixLen ) { break }
            currentNode = thisChild;
        }
        return segments;
    }
    private _joinSegmentsValues({ length: sLen, ...segments } : Array<Segment<T>> ) {
        if( this._contentType === CType.ARRAY ) {
            const data : Array<T> = [];
            for( let s = 0; s < sLen; s++ ) data.push( ...segments[ s ].value as Array<T> );
            return data;
        }
        let data = '';
        for( let s = 0; s < sLen; s++ ) data += segments[ s ].value as string;
        return data;
    }
    private _join2Dim({ length: _Len, ..._2dim } : Array<Iterable<Segment<T>>> ) : Array<Array<T>|string> {
        const data = new Array( _Len );
        for( ; _Len--; ) { data[ _Len ] = this._joinSegmentsValues( _2dim[ _Len ] as Array<Segment<T>> ) }
        return data;
    }
    private _prepareEntry( entry : string ) : Iterable<T>
    private _prepareEntry( entry : Iterable<T> ) : Iterable<T>
    private _prepareEntry( entry ) : Iterable<T> {
        if( isAnyOfTypes( entry, 'string' ) ) {
            return this._contentType !== CType.STRING
                ? ( entry as string ).split( '' ) as Iterable<T>
                : entry;
        }
        if( this._contentType === CType.STRING ) {
            const currStrings = this.asArray() as Array<string>;
            this.clear();
            this._contentType = CType.ARRAY;
            this._addMany( currStrings );
        }
        return entry;
    }
    protected _createSegment( data : string ) : Segment<T>;
    protected _createSegment( data : Iterable<T> ) : Segment<T>;
    protected _createSegment( data ) : Segment<T> {
        return this._contentType === CType.STRING
            ? new StringSegment( data, this._opts as RadixOptions<string> ) as unknown as Segment<T>
            : new ArraySegment<T>( data, this._opts );
    }
    /**
     * produces the node from an array of node whose `data`
     * property compares well with the dataPrefix
     */
    protected _findNodeAtPrefix(
        dataPrefix : Segment<T>,
        nodes : Array<Node<Segment<T>>>,
        compare = getPrefixComparatorFor( dataPrefix )
    ) {
        if( this._opts.sorted ) {
            const r = bSearch(
                dataPrefix,
                nodes as unknown as Array<Segment<T>>,
                compare
            );
            return r.desc === Compared.EQ ? nodes[ r.index ] : null
        }
        for( let n = nodes.length; n--; ) {
           if( compare( nodes[ n ] ) === Compared.EQ ) {
                return nodes[ n ];
           };
        }
        return null;
    }
    /** calls the `super.matches(...)` method. */
    protected _matches( graph: Array<Iterable<T>> ) : boolean;
    protected _matches( graph: Array<TrieableNode<T>> ) : boolean;
    protected _matches( graph: TrieableNode<T> ) : boolean;
    protected _matches( graph: Base<T> ) : boolean;
    protected _matches( graph ) { return super.matches( graph ) }
    /** calls the `super.merge(...)` method. */
    protected _merge( graph: TrieableNode<T> ) : void;
    protected _merge( graph: Base<T> ) : void;
    protected _merge( graph ) { return super.merge( graph ) }
}

export abstract class Segment<T> {
    protected eq : EqualityFn<T>;
    protected lt : EqualityFn<T>;
    protected options : RadixOptions<T>;
    protected _value : Array<T>|string;
    constructor( data : string, options? : RadixOptions<T> );
    constructor( data : Array<T>, options? : RadixOptions<T> );
    constructor( data, options? : RadixOptions<T> ){
        this.eq = options?.equalityMatcher;
        this.lt = options?.lessThanMatcher;
        this.options = options;
        this._value = data;
    }
    get length() { return this._value.length }
    get value() { return this._value }
    at( index : number ) { return this._value[ index ] }
    equals( segment : Segment<T> ) { return this.eq( this._value as T, segment._value ) }
    hashCode() { return computeHash( this._value[ 0 ] ?? null ) }
    isLessThan( segment : Segment<T> ) { return this.lt( this._value as T, segment._value ) }
    abstract slice( start? : number, end? : number ) : Segment<T>;
    abstract splice( start? : number, deleteCount? : number, ...items : Array<T> ) : Segment<T>
    startsWith( dataPrefix : Segment<T> ) {
        const _aPrefix = this.slice( 0, dataPrefix.length );
        return _aPrefix.equals( dataPrefix )
            ? Compared.EQ
            : _aPrefix.isLessThan( dataPrefix )
                ? Compared.LT
                : Compared.GT
    }
}

class ArraySegment<T> extends Segment<T> {
    protected _value : Array<T>;
    constructor( data : Iterable<T>, options? : RadixOptions<T> ) {
        super( toArray( data ), options );
    }
    slice( start? : number, end? : number ) {
        return new ArraySegment<T>(
            this._value.slice( start, end ),
            this.options
        );
    }
    splice( start? : number, deleteCount? : number, ...items : Array<T> ) {
       return new ArraySegment<T>(
            this._value.splice( start, deleteCount === undefined && !items.length ? this.length : deleteCount, ...items ),
            this.options
        );
    }
}

class StringSegment extends Segment<string> {
    protected _value : string;
    constructor( data : string, options? : RadixOptions<string> ) {
        super( data, options );
        this.eq = options?.isUnitEqual;
        this.lt = options?.isUnitLessThan;
    }
    slice( start? : number, end? : number ) {
        return new StringSegment(
            this._value.slice( start, end ),
            this.options
        );
    }
    splice(
        start : number = null,
        deleteCount : number = null,
        ...items : Array<string>
    ) : StringSegment { 
        items = items.join( '' ) as unknown as Array<string>;
        const vLen = this._value.length;
        const hasStart = start !== null
        start = start ?? ( deleteCount === null && !items.length ? vLen : 0 );
        deleteCount = deleteCount ?? ( hasStart ? vLen : 0 );
        if( start < 0 ) { start = vLen + start }
        start = start < 0 ? 0 : start > vLen ? vLen : start;
        deleteCount = start + ( deleteCount < 0 ? 0 : deleteCount > vLen ? vLen : deleteCount );
        const c = this._value.slice.bind( this._value );
        const deleted = c( start, deleteCount );
        this._value = c( 0, start ) + items + c( deleteCount );
        return new StringSegment( deleted, this.options );
    }
}

function buildMatcherOptions<T>( opts : Options<T> = {} ) {
    const options = opts as RadixOptions<T>;
    const _eq = opts.equalityMatcher ?? defaultEqMatcher;
    const _lt = opts.lessThanMatcher ?? defaultLtMatcher;
    options.isUnitEqual = _eq;
    options.isUnitLessThan = _lt;
    options.equalityMatcher = ( a : T, b : T ) => {
        const segA = a as Segment<T>;
        if( segA instanceof StringSegment ) { return _eq( a, b ) }
        const segB = b as Segment<T>;
        let i = segA.length;
        if( i !== segB.length ) { return false }
        for( ; i--; ) {
            if( !_eq( segA.at( i ) as T, segB.at( i ) ) ) {
                return false;
            }
        }
        return true;
    }
    options.lessThanMatcher = ( a : T, b : T ) => {
        const segA = a as Segment<T>;
        if( segA instanceof StringSegment ) { return _lt( a, b ) }
        const segB = b as Segment<T>;
        const aLen = segA.length;
        const bLen = segB.length;
        if( !aLen && bLen ) { return true }
        for( let i = 0; i < aLen; i++ ) {
            if( i === bLen ) { return false }
            if( _lt( segA.at( i ) as T, segB.at( i ) ) ) { return true }
            if( !_eq( segA.at( i ) as T, segB.at( i ) ) ) { return false }
        }
        // istanbul ignore next
        return false;
    }
    return options;
}

function countUnitsIn<T>( segments : Iterable<Segment<T>> ) {
    const _segments = toArray( segments );
    let sum = 0;
    for( let _ = _segments.length; _--; ) {
        sum += _segments[ _ ].length;
    }
    return sum;
}

function expandNode<T>( node : TrieableNode<string> ) : TrieableNode<T>;
function expandNode<T>( node : TrieableNode<Array<T>> ) : TrieableNode<T>;
function expandNode<T>( node ) : TrieableNode<T> {
    for( let c = node.children.length; c--; )  {
        expandNode( node.children[ c ] );
    }
    if( !node.parent ) { return node }
    let parent = node;
    while( true ) {
        const [ value, ...data ] = parent.data;
        parent.data = value;
        if( !data.length ) { break }
        parent.children = [{ ...parent, data, parent }];
        parent.isBoundary = false;
        parent = parent.children[ 0 ];
    }
    return node;
}

function getPrefixComparatorFor<T>( dataPrefix : Segment<T> ) {
    return (
        { data } : Node<Segment<T>>,
        prefix? : Segment<T>
    ) => data.startsWith( dataPrefix );
}

export function isAnyOfTypes( obj : unknown, ...typeName : Array<string> ) {
    const type = getTypeName( obj ).toUpperCase();
    for( let n = typeName.length; n--; ) {
        if( type === typeName[ n ].toUpperCase() ) {
            return true;
        }
    }
    return false;
}

function normalize<T>( sequences : Base<T> ) : Array<Iterable<T>>;
function normalize<T>( sequences : TrieableNode<T> ) : Array<Iterable<T>>;
function normalize<T>( sequences : Array<TrieableNode<T>> ) : Array<Iterable<T>>;
function normalize<T>( sequences : Array<Iterable<T>> ) : Array<Iterable<T>>;
function normalize<T>( sequences : Array<Iterable<T>|TrieableNode<T>> ) : Array<Iterable<T>>;
function normalize<T>( sequences ) {
    const arraifiedMap = {};
    if( Array.isArray( sequences ) ) {
        sequences = [ ...sequences ];
        for( let s = sequences.length; s--; ) {
            const sequence = sequences[ s ];
            if( isAnyOfTypes( sequence, 'string' ) ){
                arraifiedMap[ sequence ] = undefined;
                sequences[ s ] = [ sequence ];
            }
        }
    }
    const normalized = ( new Base<T>( sequences ) ).asArray();
    let norm;
    for( let n = normalized.length; n--; ) {
        norm = normalized[ n ] as Array<T>;
        if( Array.isArray( norm )
            && norm.length === 1
            && isAnyOfTypes( norm[ 0 ], 'string' )
            && norm[ 0 ] in arraifiedMap
        ) { normalized[ n ] = norm[ 0 ] }
    }
    return normalized;
}

