/**
 * Token-only stylelint config (run via `npm run lint:tokens`).
 *
 * Source styles use bare `var(--wpds-*)` tokens; postcss.config.js adds the
 * fallbacks at build time.
 */
export default {
	plugins: [
		'@wordpress/theme/stylelint-plugins/no-unknown-ds-tokens',
		'@wordpress/theme/stylelint-plugins/no-token-fallback-values',
		'@wordpress/theme/stylelint-plugins/no-setting-wpds-custom-properties',
	],
	rules: {
		'plugin-wpds/no-unknown-ds-tokens': true,
		'plugin-wpds/no-token-fallback-values': true,
		'plugin-wpds/no-setting-wpds-custom-properties': true,
	},
	overrides: [
		{
			files: [ '**/*.scss' ],
			customSyntax: 'postcss-scss',
		},
	],
};
