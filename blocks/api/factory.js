/**
 * External dependencies
 */
import uuid from 'uuid/v4';
import {
	every,
	get,
	reduce,
	castArray,
	findIndex,
	isObjectLike,
	find,
	uniq,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getBlockType, getBlockTypes } from './registration';

/**
 * Returns a block object given its type and attributes.
 *
 * @param  {String} name             Block name
 * @param  {Object} blockAttributes  Block attributes
 * @return {Object}                  Block object
 */
export function createBlock( name, blockAttributes = {} ) {
	// Get the type definition associated with a registered block.
	const blockType = getBlockType( name );

	// Ensure attributes contains only values defined by block type, and merge
	// default values for missing attributes.
	const attributes = reduce( blockType.attributes, ( result, source, key ) => {
		const value = blockAttributes[ key ];
		if ( undefined !== value ) {
			result[ key ] = value;
		} else if ( source.default ) {
			result[ key ] = source.default;
		}

		return result;
	}, {} );

	// Blocks are stored with a unique ID, the assigned type name,
	// and the block attributes.
	return {
		uid: uuid(),
		name,
		isValid: true,
		attributes,
	};
}

/**
 * Returns an array of possible block transformations that could happen on the set of blocks received as argument.
 *
 * @param  {Array}  blocks Blocks array
 * @return {Array}         Array of possible block transformations
 */
export function getPossibleBlockTransformations( blocks ) {
	if ( ! blocks || ! blocks[ 0 ] ) {
		return [];
	}
	const isMultiBlock = blocks.length > 1;
	const sourceBlockName = blocks[ 0 ].name;

	if ( isMultiBlock && ! every( blocks, ( block ) => ( block.name === sourceBlockName ) ) ) {
		return [];
	}

	const blockType = getBlockType( sourceBlockName );
	const blocksToBeTransformedFrom = reduce( getBlockTypes(), ( memo, type ) => {
		const transformFrom = get( type, 'transforms.from', [] );
		const transformation = find(
			transformFrom,
			t => t.type === 'block' && t.blocks.indexOf( sourceBlockName ) !== -1 &&
				( ! isMultiBlock || t.isMultiBlock )
		);
		return transformation ? memo.concat( [ type.name ] ) : memo;
	}, [] );
	const blocksToBeTransformedTo = get( blockType, 'transforms.to', [] )
		.reduce(
			( memo, transformation ) =>
				memo.concat( ! isMultiBlock || transformation.isMultiBlock ? transformation.blocks : [] ),
			[]
		);
	const allowedBlocks = uniq( blocksToBeTransformedFrom.concat( blocksToBeTransformedTo ) )
		.reduce( ( memo, name ) => {
			const type = getBlockType( name );
			return !! type ? memo.concat( type ) : memo;
		}, [] );

	return allowedBlocks;
}

/**
 * Switch one or more blocks into one or more blocks of the new block type.
 *
 * @param  {Array|Object}  blocks     Blocks array or block object
 * @param  {string}        name       Block name
 * @return {Array}                    Array of blocks
 */
export function switchToBlockType( blocks, name ) {
	const blocksArray = castArray( blocks );
	const isMultiBlock = blocksArray.length > 1;
	const fistBlock = blocksArray[ 0 ];
	const sourceName = fistBlock.name;

	if ( isMultiBlock && ! every( blocksArray, ( block ) => ( block.name === sourceName ) ) ) {
		return null;
	}

	// Find the right transformation by giving priority to the "to"
	// transformation.
	const destinationType = getBlockType( name );
	const sourceType = getBlockType( sourceName );
	const transformationsFrom = get( destinationType, 'transforms.from', [] );
	const transformationsTo = get( sourceType, 'transforms.to', [] );
	const transformation =
		find(
			transformationsTo,
			t => t.type === 'block' && t.blocks.indexOf( name ) !== -1 && ( ! isMultiBlock || t.isMultiBlock )
		) ||
		find(
			transformationsFrom,
			t => t.type === 'block' && t.blocks.indexOf( sourceName ) !== -1 && ( ! isMultiBlock || t.isMultiBlock )
		);

	// Stop if there is no valid transformation. (How did we get here?)
	if ( ! transformation ) {
		return null;
	}

	let transformationResults;
	if ( transformation.isMultiBlock ) {
		transformationResults = transformation.transform( blocksArray.map( ( currentBlock ) => currentBlock.attributes ) );
	} else {
		transformationResults = transformation.transform( fistBlock.attributes );
	}

	// Ensure that the transformation function returned an object or an array
	// of objects.
	if ( ! isObjectLike( transformationResults ) ) {
		return null;
	}

	// If the transformation function returned a single object, we want to work
	// with an array instead.
	transformationResults = castArray( transformationResults );

	// Ensure that every block object returned by the transformation has a
	// valid block type.
	if ( transformationResults.some( ( result ) => ! getBlockType( result.name ) ) ) {
		return null;
	}

	const firstSwitchedBlock = findIndex( transformationResults, ( result ) => result.name === name );

	// Ensure that at least one block object returned by the transformation has
	// the expected "destination" block type.
	if ( firstSwitchedBlock < 0 ) {
		return null;
	}

	return transformationResults.map( ( result, index ) => ( {
		...result,
		// The first transformed block whose type matches the "destination"
		// type gets to keep the existing UID of the first block.
		uid: index === firstSwitchedBlock ? fistBlock.uid : result.uid,
	} ) );
}

/**
 * Creates a new reusable block.
 *
 * @param {String} type       The type of the block referenced by the reusable block
 * @param {Object} attributes The attributes of the block referenced by the reusable block
 * @return {Object}           A reusable block object
 */
export function createReusableBlock( type, attributes ) {
	return {
		id: uuid(),
		name: __( 'Untitled block' ),
		type,
		attributes,
	};
}
