<?php
/**
 * WordPress AI Client Provider.
 *
 * Uses the built-in WordPress AI Client (WP 7.0+) for AI analysis.
 *
 * @package VmfaAiOrganizer
 */

declare(strict_types=1);

namespace VmfaAiOrganizer\AI;

defined( 'ABSPATH' ) || exit;

/**
 * WordPress core AI Client provider.
 *
 * Available in WordPress 7.0+ when AI connectors are configured via Settings → Connectors.
 * Uses the fluent wp_ai_client_prompt() API introduced in WP 7.0.
 *
 * @see https://developer.wordpress.org/apis/ai-client/
 */
class WordPressAIProvider extends AbstractProvider {

	/**
	 * Connectors settings page URL.
	 */
	public const CONNECTORS_URL = 'options-general.php?page=connectors-wp-admin';

	/**
	 * Check if WordPress AI Client is available.
	 *
	 * @return bool True if wp_ai_client_prompt() function exists (WP 7.0+).
	 */
	public static function is_available(): bool {
		return function_exists( 'wp_ai_client_prompt' );
	}

	/**
	 * Check if WordPress AI Client has any connectors configured.
	 *
	 * Tests whether text generation is supported, which requires at least
	 * one AI connector to be configured in Settings → Connectors.
	 *
	 * @return bool True if at least one AI connector is configured.
	 */
	public static function has_connectors(): bool {
		if ( ! self::is_available() ) {
			return false;
		}

		try {
			return wp_ai_client_prompt( 'test' )->is_supported_for_text_generation();
		} catch ( \Exception $e ) {
			return false;
		}
	}

	/**
	 * {@inheritDoc}
	 */
	public function get_name(): string {
		return 'wordpress';
	}

	/**
	 * {@inheritDoc}
	 */
	public function get_label(): string {
		return __( 'WordPress AI (Core)', 'vmfa-ai-organizer' );
	}

	/**
	 * {@inheritDoc}
	 */
	public function analyze(
		array $media_metadata,
		array $folder_paths,
		int $max_depth,
		bool $allow_new_folders,
		?array $image_data = null,
		array $suggested_folders = array()
	): array {
		if ( ! $this->is_configured() ) {
			return array(
				'action'          => 'skip',
				'folder_id'       => null,
				'new_folder_path' => null,
				'confidence'      => 0.0,
				'reason'          => sprintf(
					/* translators: %s: URL to connectors settings */
					__( 'No AI connectors configured. Configure at %s', 'vmfa-ai-organizer' ),
					admin_url( self::CONNECTORS_URL )
				),
			);
		}

		$system_prompt = $this->get_system_prompt();
		$user_prompt   = $this->build_user_prompt( $media_metadata, $folder_paths, $max_depth, $allow_new_folders, $suggested_folders );

		try {
			// Build prompt using the WP 7.0 fluent API.
			$builder = wp_ai_client_prompt( $user_prompt )
				->using_system_instruction( $system_prompt )
				->using_max_tokens( 500 )
				->using_temperature( 0.3 );

			// Attach image if available.
			if ( $image_data ) {
				$image_string = $this->format_image_data( $image_data );
				$mime_type    = $image_data['mime_type'] ?? null;
				$builder      = $builder->with_file( $image_string, $mime_type );
			}

			$result = $builder->generate_text();

			if ( is_wp_error( $result ) ) {
				return array(
					'action'          => 'skip',
					'folder_id'       => null,
					'new_folder_path' => null,
					'confidence'      => 0.0,
					'reason'          => sprintf(
						/* translators: %s: error message */
						__( 'WordPress AI error: %s', 'vmfa-ai-organizer' ),
						$result->get_error_message()
					),
				);
			}

			return $this->parse_response( $result, $folder_paths );
		} catch ( \Exception $e ) {
			return array(
				'action'          => 'skip',
				'folder_id'       => null,
				'new_folder_path' => null,
				'confidence'      => 0.0,
				'reason'          => sprintf(
					/* translators: %s: error message */
					__( 'WordPress AI exception: %s', 'vmfa-ai-organizer' ),
					$e->getMessage()
				),
			);
		}
	}

	/**
	 * Format image data for the AI Client's with_file() method.
	 *
	 * Returns a data URI string or URL that the File DTO can auto-detect.
	 *
	 * @param array $image_data Image data (url, base64, mime_type).
	 * @return string Data URI or URL string.
	 */
	private function format_image_data( array $image_data ): string {
		if ( ! empty( $image_data['base64'] ) && ! empty( $image_data['mime_type'] ) ) {
			return 'data:' . $image_data['mime_type'] . ';base64,' . $image_data['base64'];
		}

		return $image_data['url'] ?? '';
	}

	/**
	 * {@inheritDoc}
	 */
	public function test( array $settings ): ?string {
		if ( ! self::is_available() ) {
			return __( 'WordPress AI Client is not available. Requires WordPress 7.0 or later.', 'vmfa-ai-organizer' );
		}

		if ( ! self::has_connectors() ) {
			return sprintf(
				/* translators: %s: URL to connectors settings */
				__( 'No AI connectors configured. Go to %s to add an AI connector.', 'vmfa-ai-organizer' ),
				admin_url( self::CONNECTORS_URL )
			);
		}

		try {
			$result = wp_ai_client_prompt( 'Say "OK" if you can read this.' )
				->using_max_tokens( 10 )
				->generate_text();

			if ( is_wp_error( $result ) ) {
				return $result->get_error_message();
			}

			return null;
		} catch ( \Exception $e ) {
			return $e->getMessage();
		}
	}

	/**
	 * {@inheritDoc}
	 */
	public function is_configured(): bool {
		return self::is_available() && self::has_connectors();
	}

	/**
	 * {@inheritDoc}
	 */
	public function get_available_models(): array {
		// The WordPress AI Client handles model selection internally via Connectors.
		return array(
			'default' => __( 'Default (configured in Connectors)', 'vmfa-ai-organizer' ),
		);
	}
}
