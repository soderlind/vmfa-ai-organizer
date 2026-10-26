/**
 * PostCSS config for wp-scripts.
 *
 * Keeps the default @wordpress/scripts pipeline and adds the official
 * WordPress Design System token fallbacks: every `var(--wpds-*)` gets the
 * WordPress 7 value as a fallback, so styles work even when neither core
 * (WP < 7) nor Virtual Media Folders (< 2.2.0) defines the tokens.
 */
const { default: dsTokenFallbacks } = require( '@wordpress/theme/postcss-plugins/postcss-ds-token-fallbacks' );

module.exports = ( { env } ) => ( {
	plugins: [
		dsTokenFallbacks(),
		...require( '@wordpress/postcss-plugins-preset' ),
		...( env === 'production'
			? [ require( 'cssnano' )( { preset: [ 'default', { discardComments: { removeAll: true } } ] } ) ]
			: [] ),
	],
} );
