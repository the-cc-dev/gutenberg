<?php
/**
 * Initialization and wp-admin integration for the Gutenberg editor plugin.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Renders a partial page of meta boxes.
 *
 * @since 1.5.0
 *
 * @param string $post_type Current post type.
 * @param string $meta_box_context  The context location of the meta box. Referred to as context in core.
 */
function gutenberg_meta_box_partial_page( $post_type, $meta_box_context ) {
	/**
	 * Needs classic editor to be active.
	 *
	 * @see https://github.com/WordPress/gutenberg/commit/bdf94e65ac0c10b3ce5d8e214f0c9e1081997d9b
	 */
	if ( ! isset( $_REQUEST['classic-editor'] ) ) {
		return;
	}

	/**
	 * The meta_box param as long as it is set on the wp-admin/post.php request
	 * will trigger this partial page.
	 *
	 * Essentially all that happens is we try to load in the scripts from admin_head
	 * and admin_footer to mimic the assets for a typical post.php.
	 *
	 * @in_the_future Hopefully the meta box param can be changed to a location,
	 * or contenxt, so that we can use this API to render meta boxes that appear,
	 * in the sidebar vs. regular content, or core meta boxes vs others. For now
	 * a request like http://local.wordpress.dev/wp-admin/post.php?post=40007&action=edit&meta_box=taco
	 * works just fine!
	 */
	if ( ! isset( $_REQUEST['meta_box'] ) || 'post.php' !== $GLOBALS['pagenow'] ) {
		return;
	}

	/**
	 * Prevent over firing of the meta box rendering.
	 *
	 * The hook do_action( 'do_meta_boxes', ... ) fires three times in
	 * edit-form-advanced.php
	 *
	 * To make sure we properly fire on all three meta box locations, except
	 * advanced, as advanced is tied in with normal for ease of use reasons, we
	 * need to verify that the action location/context matches our requests
	 * meta box location/context. We then exit early if they do not match.
	 * This will prevent execution thread from dieing, so the subsequent calls
	 * to do_meta_boxes can fire.
	 */
	if ( $_REQUEST['meta_box'] !== $meta_box_context ) {
		return;
	}

	// Ths action is not needed since it's an XHR call.
	remove_action( 'admin_head', 'wp_admin_canonical_url' );

	$location = $_REQUEST['meta_box'];

	if ( ! in_array( $_REQUEST['meta_box'], array( 'side', 'normal', 'advanced' ) ) ) {
		wp_die( __( 'The `meta_box` parameter should be one of "side", "normal", or "advanced".', 'gutenberg' ) );
	}

	the_gutenberg_metaboxes( array( $location ) );
}

add_action( 'do_meta_boxes', 'gutenberg_meta_box_partial_page', 1000, 2 );

/**
 * Allows the meta box endpoint to correctly redirect to the meta box endpoint
 * when a post is saved.
 *
 * @since 1.5.0
 *
 * @param string $location The location of the meta box, 'side', 'normal'.
 * @param int    $post_id  Post ID.
 *
 * @hooked redirect_post_location priority 10
 */
function gutenberg_meta_box_save_redirect( $location, $post_id ) {
	if ( isset( $_REQUEST['gutenberg_meta_boxes'] )
			&& isset( $_REQUEST['gutenberg_meta_box_location'] )
			&& 'gutenberg_meta_boxes' === $_REQUEST['gutenberg_meta_boxes'] ) {
		$meta_box_location = $_REQUEST['gutenberg_meta_box_location'];
		$location          = add_query_arg(
			array(
				'meta_box'       => $meta_box_location,
				'action'         => 'edit',
				'classic-editor' => true,
				'post'           => $post_id,
			),
			admin_url( 'post.php' )
		);
	}

	return $location;
}

add_filter( 'redirect_post_location', 'gutenberg_meta_box_save_redirect', 10, 2 );

/**
 * Filter out core meta boxes as well as the post thumbnail.
 *
 * @since 1.5.0
 *
 * @param array $meta_boxes Meta box data.
 */
function gutenberg_filter_meta_boxes( $meta_boxes ) {
	$core_side_meta_boxes = array(
		'submitdiv',
		'formatdiv',
		'categorydiv',
		'tagsdiv-post_tag',
		'postimagediv',
	);

	$core_normal_meta_boxes = array(
		'revisionsdiv',
		'postexcerpt',
		'trackbacksdiv',
		'postcustom',
		'commentstatusdiv',
		'commentsdiv',
		'slugdiv',
		'authordiv',
	);

	$taxonomy_callbacks_to_unset = array(
		'post_tags_meta_box',
		'post_categories_meta_box',
	);

	foreach ( $meta_boxes as $page => $contexts ) {
		foreach ( $contexts as $context => $priorities ) {
			foreach ( $priorities as $priority => $boxes ) {
				foreach ( $boxes as $name => $data ) {
					if ( 'normal' === $context && in_array( $name, $core_normal_meta_boxes ) ) {
						unset( $meta_boxes[ $page ][ $context ][ $priority ][ $name ] );
					}
					if ( 'side' === $context && in_array( $name, $core_side_meta_boxes ) ) {
						unset( $meta_boxes[ $page ][ $context ][ $priority ][ $name ] );
					}
					// Filter out any taxonomies as Gutenberg already provides JS alternative.
					if ( isset( $data['callback'] ) && in_array( $data['callback'], $taxonomy_callbacks_to_unset ) ) {
						unset( $meta_boxes[ $page ][ $context ][ $priority ][ $name ] );
					}
				}
			}
		}
	}

	return $meta_boxes;
}

/**
 * Check whether a meta box is empty.
 *
 * @since 1.5.0
 *
 * @param array  $meta_boxes Meta box data.
 * @param string $context    Location of meta box, one of side, advanced, normal.
 * @param string $post_type  Post type to investigate.
 * @return boolean Whether the meta box is empty.
 */
function gutenberg_is_meta_box_empty( $meta_boxes, $context, $post_type ) {
	$page = $post_type;

	if ( ! isset( $meta_boxes[ $page ][ $context ] ) ) {
		return true;
	}

	foreach ( $meta_boxes[ $page ][ $context ] as $priority => $boxes ) {
		if ( ! empty( $boxes ) ) {
			return false;
		}
	}

	return true;
}

add_filter( 'filter_gutenberg_meta_boxes', 'gutenberg_filter_meta_boxes' );


function the_gutenberg_metaboxes( $locations = array( 'advanced', 'normal', 'side') ) {
	global $post, $current_screen, $wp_meta_boxes;


	// Handle meta box state.
	$_original_meta_boxes = $wp_meta_boxes;

	/**
	 * Fires right before the meta boxes are rendered.
	 *
	 * This allows for the filtering of meta box data, that should already be
	 * present by this point. Do not use as a means of adding meta box data.
	 *
	 * By default gutenberg_filter_meta_boxes() is hooked in and can be
	 * unhooked to restore core meta boxes.
	 *
	 * @param array $wp_meta_boxes Global meta box state.
	 */
	$wp_meta_boxes = apply_filters( 'filter_gutenberg_meta_boxes', $wp_meta_boxes );

	// Render meta boxes.
	if ( ! empty( $locations ) ) {
		foreach ( $locations as $location ) {
			?>
			<form class="metabox-location-<?php echo $location; ?>">
			<?php
			do_meta_boxes(
				$current_screen,
				$location,
				$post
			);
			?>
			</form>
			<?php
		}
	}


	// Reset meta box data.
	$wp_meta_boxes = $_original_meta_boxes;
}
