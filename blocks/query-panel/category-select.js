/**
 * WordPress dependencies
 */
import { withAPIData } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { buildTermsTree } from '../../editor/utils/terms';
import TermTreeSelect from '../term-tree-select';

function CategorySelect( { label, noOptionLabel, categories, selectedCategory, onChange } ) {
	return (
		<TermTreeSelect
			{ ...{ label, noOptionLabel } }
			termsTree={ buildTermsTree( categories.data ) }
			selectedTerm={ selectedCategory }
			onChange={ onChange }
		/>
	);
}

const applyWithAPIData = withAPIData( () => ( {
	categories: '/wp/v2/categories',
} ) );

export default applyWithAPIData( CategorySelect );
