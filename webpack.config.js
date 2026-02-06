/**
 * Webpack configuration for VMFA AI Organizer.
 *
 * Extends default @wordpress/scripts webpack config to add
 * parent plugin's shared components as external dependency.
 */

const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

module.exports = {
	...defaultConfig,
	externals: {
		...defaultConfig.externals,
		// Map @vmfo/shared import to window.vmfo.shared global
		'@vmfo/shared': 'vmfo.shared',
	},
};
