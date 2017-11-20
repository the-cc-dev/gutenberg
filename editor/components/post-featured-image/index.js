/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { flowRight } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Spinner, ResponsiveWrapper, withAPIData } from '@wordpress/components';
import { MediaUploadButton } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import { getEditedPostAttribute } from '../../selectors';
import { editPost } from '../../actions';

function PostFeaturedImage( { featuredImageId, onUpdateImage, onRemoveImage, media, postType } ) {
	if ( ! postType.data ) {
		return null;
	}
	const postLabel = postType.data.labels;
	return (
		<div className="editor-post-featured-image">
			{ !! featuredImageId &&
				<MediaUploadButton
					title={ postLabel.set_featured_image }
					buttonProps={ { className: 'button-link editor-post-featured-image__preview' } }
					onSelect={ onUpdateImage }
					type="image"
				>
					{ media && !! media.data &&
						<ResponsiveWrapper
							naturalWidth={ media.data.media_details.width }
							naturalHeight={ media.data.media_details.height }
						>
							<img src={ media.data.source_url } alt={ __( 'Featured image' ) } />
						</ResponsiveWrapper>
					}
					{ media && media.isLoading && <Spinner /> }
				</MediaUploadButton>
			}
			{ !! featuredImageId && media && ! media.isLoading &&
				<p className="editor-post-featured-image__howto">
					{ __( 'Click the image to edit or update' ) }
				</p>
			}
			{ ! featuredImageId &&
				<MediaUploadButton
					title={ postLabel.set_featured_image }
					buttonProps={ { className: 'editor-post-featured-image__toggle button-link' } }
					onSelect={ onUpdateImage }
					type="image"
				>
					{ postLabel.set_featured_image }
				</MediaUploadButton>
			}
			{ !! featuredImageId &&
				<Button className="editor-post-featured-image__toggle button-link" onClick={ onRemoveImage }>
					{ postLabel.remove_featured_image }
				</Button>
			}
		</div>
	);
}

const applyConnect = connect(
	( state ) => {
		return {
			featuredImageId: getEditedPostAttribute( state, 'featured_media' ),
		};
	},
	{
		onUpdateImage( image ) {
			return editPost( { featured_media: image.id } );
		},
		onRemoveImage() {
			return editPost( { featured_media: 0 } );
		},
	}
);

const applyWithAPIData = withAPIData( ( { featuredImageId } ) => {
	if ( ! featuredImageId ) {
		return {};
	}

	return {
		media: `/wp/v2/media/${ featuredImageId }`,
		postType: '/wp/v2/types/post?context=edit',
	};
} );

export default flowRight(
	applyConnect,
	applyWithAPIData,
)( PostFeaturedImage );
