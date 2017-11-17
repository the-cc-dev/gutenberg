/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { flow, noop, partial } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { isEditorSidebarOpened } from '../../selectors';
import { toggleSidebar, setActivePanel } from '../../actions';

export function BlockInspectorButton( {
	isSidebarOpened,
	onToggleSidebar,
	onShowInspector,
	onClick = noop,
	small = false,
} ) {
	const toggleInspector = () => {
		onShowInspector();
		if ( ! isSidebarOpened ) {
			onToggleSidebar();
		}
	};
	const label = __( 'Settings' );

	return (
		<IconButton
			className="editor-block-settings-menu__control"
			onClick={ flow( toggleInspector, onClick ) }
			icon="admin-generic"
			label={ small ? label : undefined }
		>
			{ ! small && label }
		</IconButton>
	);
}

export default connect(
	( state ) => ( {
		isSidebarOpened: isEditorSidebarOpened( state ),
		isMobile: ! state.responsive.greaterThan.medium,
	} ),
	( dispatch ) => ( {
		onShowInspector() {
			dispatch( setActivePanel( 'block' ) );
		},
		onToggleSidebar( isMobile = false ) {
			dispatch( toggleSidebar( isMobile ) );
		},
	} ),
	( stateProps, dispatchProps, ownProps ) => ( {
		...ownProps,
		...stateProps,
		...dispatchProps,
		onToggleSidebar: partial( dispatchProps.onToggleSidebar, stateProps.isMobile ),
	} )

)( BlockInspectorButton );
