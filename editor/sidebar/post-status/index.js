/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import PostVisibility from '../post-visibility';
import PostTrash from '../post-trash';
import PostSchedule from '../post-schedule';
import PostSticky from '../post-sticky';
import PostAuthor from '../post-author';
import PostFormat from '../post-format';
import PostPendingStatus from '../post-pending-status';
import {
	isEditorSidebarPanelOpened,
} from '../../selectors';
import { toggleSidebarPanel } from '../../actions';

/**
 * Module Constants
 */
const PANEL_NAME = 'post-status';

function PostStatus( { isOpened, onTogglePanel } ) {
	return (
		<PanelBody title={ __( 'Status & Visibility' ) } opened={ isOpened } onToggle={ onTogglePanel }>
			<PostVisibility />
			<PostSchedule />
			<PostFormat />
			<PostSticky />
			<PostPendingStatus />
			<PostAuthor />
			<PostTrash />
		</PanelBody>
	);
}

export default connect(
	( state ) => ( {
		isOpened: isEditorSidebarPanelOpened( state, PANEL_NAME ),
	} ),
	{
		onTogglePanel() {
			return toggleSidebarPanel( PANEL_NAME );
		},
	}
)( PostStatus );

