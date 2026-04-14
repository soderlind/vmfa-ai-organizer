<?php
/**
 * Abstract AI Provider.
 *
 * @package VmfaAiOrganizer
 */

declare(strict_types=1);

namespace VmfaAiOrganizer\AI;

defined( 'ABSPATH' ) || exit;

use VmfaAiOrganizer\Plugin;

/**
 * Abstract base class for AI providers.
 */
abstract class AbstractProvider implements ProviderInterface {

	/**
	 * Default request timeout in seconds.
	 */
	protected const REQUEST_TIMEOUT = 30;

	/**
	 * Get the request timeout in seconds.
	 * Override in subclasses to provide a configurable timeout.
	 *
	 * @return int
	 */
	protected function get_request_timeout(): int {
		return static::REQUEST_TIMEOUT;
	}

	/**
	 * Get the system prompt for folder organization with vision capabilities.
	 *
	 * @return string The system prompt with language instruction.
	 */
	protected function get_system_prompt(): string {
		$locale        = get_locale();
		$language_name = $this->get_language_name( $locale );

		return <<<PROMPT
You are a media organization assistant with vision capabilities. Analyze image content to choose the best folder.

Respond with folder names in {$language_name}. Use Title Case, 1-3 words per level, max 3 levels deep. No emojis.

Analysis priority: 1) image content, 2) EXIF/metadata, 3) text metadata, 4) filename.

Folder rules:
- Always reuse an existing or session-suggested folder when it fits.
- No synonyms: if "Animals" exists, do not create "Wildlife" or "Fauna".
- No subsets: if "Insects" exists, do not create "Bees"—use "Insects".
- No hierarchy inversions: if "Events/Outdoor" exists, do not create "Outdoor/Events".
- Prefer broad canonical names (Animals, Nature, People, Buildings, Food, Travel, Events, Art, Sports, Technology).
- When uncertain, choose a broader category.

Respond with valid JSON only (no markdown):
{"visual_description":"string|null","action":"existing|new|skip","folder_id":int|null,"folder_path":"string|null","new_folder_path":"string|null","confidence":0.0-1.0,"reason":"string"}

action="existing": folder_id and folder_path are required (copy from Available Folders, omit "(ID: …)" suffix).
action="new": new_folder_path is required.
No existing folders listed → use "new" or "skip", never "existing".
PROMPT;
	}

	/**
	 * Get human-readable language name from WordPress locale.
	 *
	 * Uses WordPress core format_code_lang() when available (multisite),
	 * otherwise extracts the language code and returns a readable name.
	 *
	 * @param string $locale WordPress locale code (e.g., 'nb_NO', 'en_US').
	 * @return string Human-readable language name.
	 */
	protected function get_language_name( string $locale ): string {
		// Extract the two-letter language code.
		$lang_code = strtolower( substr( $locale, 0, 2 ) );

		// Load ms.php if not already loaded (contains format_code_lang).
		if ( ! function_exists( 'format_code_lang' ) ) {
			require_once ABSPATH . 'wp-admin/includes/ms.php';
		}

		return format_code_lang( $lang_code );
	}

	/**
	 * Make an HTTP POST request.
	 *
	 * @param string               $url     Request URL.
	 * @param array<string, mixed> $body    Request body.
	 * @param array<string, string> $headers Request headers.
	 * @return array{success: bool, data: mixed, error: string|null}
	 */
	protected function make_request( string $url, array $body, array $headers = array() ): array {
		$default_headers = array(
			'Content-Type' => 'application/json',
		);

		$response = wp_remote_post(
			$url,
			array(
				'headers'   => array_merge( $default_headers, $headers ),
				'body'      => wp_json_encode( $body ),
				'timeout'   => $this->get_request_timeout(),
				'sslverify' => true,
			)
		);

		if ( is_wp_error( $response ) ) {
			return array(
				'success' => false,
				'data'    => null,
				'error'   => $response->get_error_message(),
			);
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		$body        = wp_remote_retrieve_body( $response );

		// Sanitize response body to remove control characters before JSON parsing.
		$body = preg_replace( '/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $body );

		$data = json_decode( $body, true );

		if ( $status_code < 200 || $status_code >= 300 ) {
			// Extract error message from response or use a generic message.
			$error_message = "HTTP {$status_code} error";
			if ( is_array( $data ) ) {
				if ( isset( $data[ 'error' ][ 'message' ] ) ) {
					$error_message = $data[ 'error' ][ 'message' ];
				} elseif ( isset( $data[ 'error' ] ) && is_string( $data[ 'error' ] ) ) {
					$error_message = $data[ 'error' ];
				}
			} elseif ( ! empty( $body ) ) {
				// If JSON parsing failed, use sanitized raw body (truncated).
				$error_message = "HTTP {$status_code}: " . substr( $body, 0, 200 );
			}
			return array(
				'success' => false,
				'data'    => $data,
				'error'   => $error_message,
			);
		}

		return array(
			'success' => true,
			'data'    => $data,
			'error'   => null,
		);
	}

	/**
	 * Get OpenAI-compatible JSON response_format.
	 *
	 * @return array{type: string}
	 */
	protected function get_openai_json_response_format(): array {
		return array( 'type' => 'json_object' );
	}

	/**
	 * Extract token usage from a provider API response.
	 *
	 * Supports OpenAI-compatible (usage.prompt_tokens / usage.completion_tokens)
	 * and Anthropic (usage.input_tokens / usage.output_tokens) formats.
	 *
	 * @param array<string, mixed>|null $response_data Decoded API response data.
	 * @return array{prompt_tokens: int, completion_tokens: int, total_tokens: int}
	 */
	protected function extract_token_usage( ?array $response_data ): array {
		$usage = array(
			'prompt_tokens'     => 0,
			'completion_tokens' => 0,
			'total_tokens'      => 0,
		);

		if ( ! is_array( $response_data ) || ! isset( $response_data['usage'] ) ) {
			return $usage;
		}

		$raw = $response_data['usage'];

		// OpenAI / Grok / Exo format.
		if ( isset( $raw['prompt_tokens'] ) ) {
			$usage['prompt_tokens']     = (int) $raw['prompt_tokens'];
			$usage['completion_tokens'] = (int) ( $raw['completion_tokens'] ?? 0 );
		}
		// Anthropic format.
		elseif ( isset( $raw['input_tokens'] ) ) {
			$usage['prompt_tokens']     = (int) $raw['input_tokens'];
			$usage['completion_tokens'] = (int) ( $raw['output_tokens'] ?? 0 );
		}

		$usage['total_tokens'] = $usage['prompt_tokens'] + $usage['completion_tokens'];

		return $usage;
	}

	/**
	 * Build OpenAI-compatible user message content.
	 *
	 * For vision-capable models, this returns a multi-part content array (text + image_url).
	 * For text-only requests, returns the plain string prompt.
	 *
	 * @param string            $text_prompt The text prompt.
	 * @param array<mixed>|null $image_data  Image data (base64, mime_type).
	 * @param string|null       $detail      Optional OpenAI image detail (e.g. "low" or "high").
	 * @return string|array<int, array<string, mixed>>
	 */
	protected function build_openai_compatible_user_content( string $text_prompt, ?array $image_data, ?string $detail = null ): string|array {
		if ( null === $image_data || empty( $image_data[ 'base64' ] ) ) {
			return $text_prompt;
		}

		$image_url = array(
			'url' => 'data:' . ( $image_data[ 'mime_type' ] ?? 'image/jpeg' ) . ';base64,' . $image_data[ 'base64' ],
		);

		if ( null !== $detail && '' !== $detail ) {
			$image_url[ 'detail' ] = $detail;
		}

		return array(
			array(
				'type' => 'text',
				'text' => $text_prompt,
			),
			array(
				'type'      => 'image_url',
				'image_url' => $image_url,
			),
		);
	}

	/**
	 * Build an OpenAI-compatible chat request body.
	 *
	 * @param string|null       $model        Model name (optional for Azure-style endpoints).
	 * @param string|array      $user_content User message content.
	 * @param int               $max_tokens   Max tokens.
	 * @param float             $temperature  Temperature.
	 * @return array<string, mixed>
	 */
	protected function build_openai_compatible_chat_body( ?string $model, string|array $user_content, int $max_tokens = 500, float $temperature = 0.3 ): array {
		$body = array(
			'messages'        => array(
				array(
					'role'    => 'system',
					'content' => $this->get_system_prompt(),
				),
				array(
					'role'    => 'user',
					'content' => $user_content,
				),
			),
			'max_tokens'      => $max_tokens,
			'temperature'     => $temperature,
			'response_format' => $this->get_openai_json_response_format(),
		);

		if ( null !== $model && '' !== $model ) {
			$body[ 'model' ] = $model;
		}

		return $body;
	}

	/**
	 * Get a basic JSON schema for folder decision output.
	 *
	 * Primarily used by providers that support schema-constrained output (e.g. Ollama).
	 *
	 * @return array<string, mixed>
	 */
	protected function get_basic_result_json_schema(): array {
		return array(
			'type'       => 'object',
			'properties' => array(
				'action'          => array(
					'type' => 'string',
					'enum' => array( 'existing', 'new', 'skip' ),
				),
				'folder_id'       => array(
					'type' => array( 'integer', 'null' ),
				),
				'folder_path'     => array(
					'type'      => array( 'string', 'null' ),
					'maxLength' => 200,
				),
				'new_folder_path' => array(
					'type'      => array( 'string', 'null' ),
					'maxLength' => 100,
				),
				'confidence'      => array(
					'type'    => 'number',
					'minimum' => 0,
					'maximum' => 1,
				),
				'reason'          => array(
					'type'      => 'string',
					'maxLength' => 150,
				),
			),
			'required'   => array( 'action', 'folder_id', 'folder_path', 'new_folder_path', 'confidence', 'reason' ),
		);
	}

	/**
	 * Build the user prompt for media analysis.
	 *
	 * @param array<string, mixed> $media_metadata     Media metadata.
	 * @param array<string, int>   $folder_paths       Available folder paths.
	 * @param int                  $max_depth          Maximum folder depth.
	 * @param bool                 $allow_new_folders  Whether new folders are allowed.
	 * @param array<string>        $suggested_folders  Folders already suggested in this session.
	 * @return string
	 */
	/**
	 * Maximum session-suggested folders to include in the user prompt.
	 */
	private const MAX_SUGGESTED_FOLDERS_IN_PROMPT = 30;

	protected function build_user_prompt(
		array $media_metadata,
		array $folder_paths,
		int $max_depth,
		bool $allow_new_folders,
		array $suggested_folders = array()
	): string {
		$folders_list = empty( $folder_paths )
			? 'No existing folders.'
			: $this->format_folder_list( $folder_paths );

		$metadata_text = $this->format_metadata( $media_metadata );

		$constraints = $allow_new_folders
			? "May create new folders (max depth: {$max_depth})."
			: 'Use existing folders only.';

		if ( empty( $folder_paths ) ) {
			$constraints .= ' No existing folders—use "new" or "skip".';
		}

		// Cap session suggested folders to avoid unbounded prompt growth.
		$suggested_folders_text = '';
		if ( ! empty( $suggested_folders ) ) {
			$capped = array_slice( $suggested_folders, -self::MAX_SUGGESTED_FOLDERS_IN_PROMPT );
			$suggested_list         = implode( ', ', $capped );
			$suggested_folders_text = "\nSession folders (reuse if applicable): {$suggested_list}";
		}

		return <<<PROMPT
Suggest a folder for this media. Describe the image first if provided.

Metadata: {$metadata_text}

Folders:
{$folders_list}{$suggested_folders_text}

{$constraints}
PROMPT;
	}

	/**
	 * Format the folder list for the user prompt.
	 *
	 * Uses a compact format for large folder trees (>30 folders) to reduce tokens.
	 *
	 * @param array<string, int> $folder_paths Folder paths mapped to IDs.
	 * @return string Formatted folder list.
	 */
	protected function format_folder_list( array $folder_paths ): string {
		$count = count( $folder_paths );

		if ( $count <= 30 ) {
			return implode( "\n", array_map(
				fn( $path, $id ) => "- {$path} (ID: {$id})",
				array_keys( $folder_paths ),
				$folder_paths
			) );
		}

		// Compact format for large trees: "Path[ID]" one per line.
		return implode( "\n", array_map(
			fn( $path, $id ) => "{$path}[{$id}]",
			array_keys( $folder_paths ),
			$folder_paths
		) );
	}

	/**
	 * Format media metadata for the prompt.
	 *
	 * @param array<string, mixed> $metadata Media metadata.
	 * @return string
	 */
	protected function format_metadata( array $metadata ): string {
		$lines = array();

		if ( ! empty( $metadata[ 'filename' ] ) ) {
			$lines[] = "Filename: {$metadata[ 'filename' ]}";
		}

		if ( ! empty( $metadata[ 'mime_type' ] ) ) {
			$lines[] = "Type: {$metadata[ 'mime_type' ]}";
		}

		if ( ! empty( $metadata[ 'alt' ] ) ) {
			$lines[] = "Alt text: {$metadata[ 'alt' ]}";
		}

		if ( ! empty( $metadata[ 'caption' ] ) ) {
			$lines[] = "Caption: {$metadata[ 'caption' ]}";
		}

		if ( ! empty( $metadata[ 'description' ] ) ) {
			$lines[] = "Description: {$metadata[ 'description' ]}";
		}

		if ( ! empty( $metadata[ 'exif' ] ) && is_array( $metadata[ 'exif' ] ) ) {
			$exif_items = array();
			foreach ( $metadata[ 'exif' ] as $key => $value ) {
				if ( ! empty( $value ) && is_string( $value ) ) {
					$exif_items[] = "{$key}: {$value}";
				}
			}
			if ( ! empty( $exif_items ) ) {
				$lines[] = 'EXIF: ' . implode( ', ', $exif_items );
			}
		}

		return implode( "\n", $lines );
	}

	/**
	 * Parse the AI response into a structured result.
	 *
	 * @param string             $response      Raw AI response text.
	 * @param array<string, int> $folder_paths  Available folder paths.
	 * @return array{
	 *     action: string,
	 *     folder_id: int|null,
	 *     new_folder_path: string|null,
	 *     confidence: float,
	 *     reason: string
	 * }
	 */
	protected function parse_response( string $response, array $folder_paths ): array {
		// Clean up response - remove markdown code blocks if present.
		$original_response = $response;

		// Strip markdown code blocks: ```json ... ``` or ``` ... ```
		// Handle both opening and closing fences.
		if ( preg_match( '/```(?:json)?\s*\n?(.*?)\n?```/s', $response, $matches ) ) {
			$response = $matches[ 1 ];
		} else {
			// Fallback: try to extract just the JSON object/array.
			if ( preg_match( '/(\{[\s\S]*\}|\[[\s\S]*\])/', $response, $matches ) ) {
				$response = $matches[ 1 ];
			}
		}
		$response = trim( $response );

		// Sanitize control characters that break JSON parsing.
		// Remove all control characters except tab, newline, carriage return.
		$response = preg_replace( '/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $response );
		// Remove soft hyphens and zero-width characters (common in LLM output).
		$response = preg_replace( '/[\x{00AD}\x{00A0}\x{200B}-\x{200D}\x{FEFF}\x{2028}\x{2029}]/u', '', $response );
		// Remove any remaining non-printable characters that might break JSON.
		// This catches extended control characters in Latin-1 supplement.
		$response = preg_replace( '/[\x{0080}-\x{009F}]/u', '', $response );

		// Fix unescaped newlines inside JSON string values.
		// LLMs sometimes return multi-line strings which are invalid JSON.
		$response = $this->fix_json_string_newlines( $response );

		// Fallback: if JSON still has control chars, try aggressive cleanup.
		// Replace all newlines/carriage returns that aren't already escaped.
		$response = preg_replace( '/(?<!\\\\)[\r\n]+/', ' ', $response );

		// Check for empty response.
		if ( empty( $response ) ) {
			return array(
				'action'          => 'skip',
				'folder_id'       => null,
				'new_folder_path' => null,
				'confidence'      => 0.0,
				'reason'          => __( 'AI returned empty response.', 'vmfa-ai-organizer' ),
			);
		}

		$data       = json_decode( $response, true );
		$json_error = json_last_error();

		// If JSON parsing failed, try to salvage truncated JSON.
		if ( JSON_ERROR_NONE !== $json_error ) {
			$data       = $this->try_fix_truncated_json( $response );
			$json_error = null === $data ? JSON_ERROR_SYNTAX : JSON_ERROR_NONE;
		}

		// Check for JSON parsing errors.
		if ( JSON_ERROR_NONE !== $json_error ) {
			$error_messages = array(
				JSON_ERROR_DEPTH          => 'Maximum stack depth exceeded',
				JSON_ERROR_STATE_MISMATCH => 'Underflow or mode mismatch',
				JSON_ERROR_CTRL_CHAR      => 'Unexpected control character',
				JSON_ERROR_SYNTAX         => 'Syntax error, malformed JSON',
				JSON_ERROR_UTF8           => 'Malformed UTF-8 characters',
			);
			$error_msg      = $error_messages[ $json_error ] ?? "Unknown error (code: {$json_error})";

			// Find control characters in SANITIZED response for debugging.
			$control_chars = array();
			for ( $i = 0; $i < strlen( $response ); $i++ ) {
				$ord = ord( $response[ $i ] );
				// Control chars are 0-31 (except tab=9, lf=10, cr=13) and 127.
				if ( ( $ord < 32 && ! in_array( $ord, array( 9, 10, 13 ), true ) ) || 127 === $ord ) {
					$control_chars[] = sprintf( 'pos %d: 0x%02X', $i, $ord );
				}
			}
			$control_info = ! empty( $control_chars )
				? ' [SANITIZED has ctrl chars: ' . implode( ', ', array_slice( $control_chars, 0, 5 ) ) . ']'
				: '';

			// Show sanitized response with visible newlines.
			$debug_response = str_replace( array( "\r", "\n", "\t" ), array( '\\r', '\\n', '\\t' ), $response );

			return array(
				'action'          => 'skip',
				'folder_id'       => null,
				'new_folder_path' => null,
				'confidence'      => 0.0,
				'reason'          => sprintf(
					'JSON error: %s.%s SANITIZED: %s',
					$error_msg,
					$control_info,
					$debug_response
				),
			);
		}

		if ( ! is_array( $data ) ) {
			return array(
				'action'          => 'skip',
				'folder_id'       => null,
				'new_folder_path' => null,
				'confidence'      => 0.0,
				'reason'          => __( 'AI response is not a valid JSON object.', 'vmfa-ai-organizer' ),
			);
		}

		// Handle the new schema format (from structured outputs).
		// New format uses: action: existing/new/skip, folder_id, folder_path, new_folder_path.
		if ( isset( $data[ 'action' ] ) && in_array( $data[ 'action' ], array( 'existing', 'new', 'skip' ), true ) ) {
			$action          = $data[ 'action' ];
			$folder_id       = isset( $data[ 'folder_id' ] ) ? (int) $data[ 'folder_id' ] : null;
			$folder_path     = isset( $data[ 'folder_path' ] ) && is_string( $data[ 'folder_path' ] ) ? $data[ 'folder_path' ] : '';
			$new_folder_path = $data[ 'new_folder_path' ] ?? null;
			$confidence      = (float) ( $data[ 'confidence' ] ?? 0.5 );
			$reason          = $data[ 'reason' ] ?? '';

			// Normalize folder_path if model copied the "(ID: N)" suffix.
			if ( '' !== $folder_path ) {
				$folder_path = trim( $folder_path );
				$folder_path = preg_replace( '/\s*\(ID:\s*\d+\)\s*$/', '', $folder_path );
				$folder_path = trim( $folder_path );
			}

			// Validate folder_id exists for "existing" action.
			if ( 'existing' === $action ) {
				// Some models return action=existing but put the suggestion in new_folder_path.
				// If so, treat it as a create action.
				if ( ! empty( $new_folder_path ) && is_string( $new_folder_path ) ) {
					return array(
						'action'          => 'create',
						'folder_id'       => null,
						'new_folder_path' => $new_folder_path,
						'confidence'      => $confidence * 0.95,
						'reason'          => $reason ?: __( 'Treated as new folder suggestion.', 'vmfa-ai-organizer' ),
					);
				}

				// Prefer folder_id when valid.
				if ( $folder_id && in_array( $folder_id, $folder_paths, true ) ) {
					return array(
						'action'          => 'assign',
						'folder_id'       => $folder_id,
						'new_folder_path' => null,
						'confidence'      => $confidence,
						'reason'          => $reason,
					);
				}

				// Fallback: map folder_path to ID (prevents skips when model hallucinates folder_id).
				if ( '' !== $folder_path ) {
					if ( isset( $folder_paths[ $folder_path ] ) ) {
						return array(
							'action'          => 'assign',
							'folder_id'       => $folder_paths[ $folder_path ],
							'new_folder_path' => null,
							'confidence'      => $confidence,
							'reason'          => $reason,
						);
					}

					// Case-insensitive exact match.
					foreach ( $folder_paths as $path => $id ) {
						if ( 0 === strcasecmp( $path, $folder_path ) ) {
							return array(
								'action'          => 'assign',
								'folder_id'       => $id,
								'new_folder_path' => null,
								'confidence'      => $confidence,
								'reason'          => $reason,
							);
						}
					}
				}

				// If there are no existing folders provided (e.g., Reorganize All preview),
				// and the model still provided a folder_path, treat it as a request to create that folder.
				if ( '' !== $folder_path && empty( $folder_paths ) ) {
					return array(
						'action'          => 'create',
						'folder_id'       => null,
						'new_folder_path' => $folder_path,
						'confidence'      => $confidence * 0.9,
						'reason'          => $reason ?: __( 'Folder not found; treated as new folder suggestion.', 'vmfa-ai-organizer' ),
					);
				}

				// Folder not found, skip.
				return array(
					'action'          => 'skip',
					'folder_id'       => null,
					'new_folder_path' => null,
					'confidence'      => 0.0,
					'reason'          => $folder_id
						? sprintf(
							/* translators: %d: folder ID */
							__( 'Folder ID %d not found.', 'vmfa-ai-organizer' ),
							$folder_id
						)
						: __( 'Folder not found.', 'vmfa-ai-organizer' ),
				);
			}

			if ( 'new' === $action && ! empty( $new_folder_path ) ) {
				return array(
					'action'          => 'create',
					'folder_id'       => null,
					'new_folder_path' => $new_folder_path,
					'confidence'      => $confidence,
					'reason'          => $reason,
				);
			}

			// Skip action or fallback.
			return array(
				'action'          => 'skip',
				'folder_id'       => null,
				'new_folder_path' => null,
				'confidence'      => $confidence,
				'reason'          => $reason ?: __( 'AI chose to skip this image.', 'vmfa-ai-organizer' ),
			);
		}

		// Handle the legacy format (from other providers or old prompts).
		// Legacy format uses: action: assign/create, folder_path.
		$action      = $data[ 'action' ] ?? 'assign';
		$folder_path = $data[ 'folder_path' ] ?? '';
		$confidence  = (float) ( $data[ 'confidence' ] ?? 0.5 );
		$reason      = $data[ 'reason' ] ?? '';

		// Check for missing folder_path.
		if ( empty( $folder_path ) ) {
			return array(
				'action'          => 'skip',
				'folder_id'       => null,
				'new_folder_path' => null,
				'confidence'      => 0.0,
				'reason'          => sprintf(
					/* translators: %s: AI's reason if provided */
					__( 'AI did not suggest a folder. %s', 'vmfa-ai-organizer' ),
					$reason
				),
			);
		}

		// Validate and map folder path to ID.
		if ( 'assign' === $action && isset( $folder_paths[ $folder_path ] ) ) {
			return array(
				'action'          => 'assign',
				'folder_id'       => $folder_paths[ $folder_path ],
				'new_folder_path' => null,
				'confidence'      => $confidence,
				'reason'          => $reason,
			);
		}

		// If action is "create" OR action is "assign" but folder doesn't exist,
		// treat it as a create action (the folder path was suggested but doesn't exist).
		if ( ! empty( $folder_path ) && ( 'create' === $action || ! isset( $folder_paths[ $folder_path ] ) ) ) {
			return array(
				'action'          => 'create',
				'folder_id'       => null,
				'new_folder_path' => $folder_path,
				'confidence'      => $confidence,
				'reason'          => $reason,
			);
		}

		// Fallback: try to find a partial match.
		foreach ( $folder_paths as $path => $id ) {
			if ( stripos( $path, $folder_path ) !== false || stripos( $folder_path, $path ) !== false ) {
				return array(
					'action'          => 'assign',
					'folder_id'       => $id,
					'new_folder_path' => null,
					'confidence'      => $confidence * 0.8,
					'reason'          => $reason . ' (partial match)',
				);
			}
		}

		// Should not reach here, but if we do, suggest creating the folder.
		return array(
			'action'          => 'create',
			'folder_id'       => null,
			'new_folder_path' => $folder_path,
			'confidence'      => $confidence,
			'reason'          => $reason,
		);
	}

	/**
	 * Fix unescaped newlines inside JSON string values.
	 *
	 * LLMs sometimes return JSON with literal newlines inside string values,
	 * which is invalid JSON. This method escapes them properly.
	 *
	 * @param string $json The potentially malformed JSON string.
	 * @return string The fixed JSON string.
	 */
	protected function fix_json_string_newlines( string $json ): string {
		// Use regex to find string values and escape newlines within them.
		// Match JSON strings: "..." (handling escaped quotes).
		// The 's' flag allows '.' to match newlines.
		$pattern = '/"((?:[^"\\\\]|\\\\.)*)"/s';

		return preg_replace_callback(
			$pattern,
			function ( $matches ) {
				$content = $matches[ 1 ];
				// Replace literal newlines with escaped versions.
				$content = str_replace( array( "\r\n", "\r", "\n" ), '\\n', $content );
				// Replace literal tabs with escaped versions.
				$content = str_replace( "\t", '\\t', $content );
				return '"' . $content . '"';
			},
			$json
		);
	}

	/**
	 * Try to fix and parse truncated JSON from LLM responses.
	 *
	 * LLMs sometimes run out of tokens and return incomplete JSON.
	 * This attempts to extract usable data from partial responses.
	 *
	 * @param string $json The truncated JSON string.
	 * @return array|null Parsed data or null if unrecoverable.
	 */
	protected function try_fix_truncated_json( string $json ): ?array {
		// Try to extract known fields using regex.
		$data = array();

		// Extract action.
		if ( preg_match( '/"action"\s*:\s*"(existing|new|skip)"/', $json, $matches ) ) {
			$data[ 'action' ] = $matches[ 1 ];
		}

		// Extract folder_id.
		if ( preg_match( '/"folder_id"\s*:\s*(\d+|null)/', $json, $matches ) ) {
			$data[ 'folder_id' ] = 'null' === $matches[ 1 ] ? null : (int) $matches[ 1 ];
		}

		// Extract new_folder_path.
		if ( preg_match( '/"new_folder_path"\s*:\s*"([^"]*)"/', $json, $matches ) ) {
			$data[ 'new_folder_path' ] = $matches[ 1 ];
		} elseif ( preg_match( '/"new_folder_path"\s*:\s*null/', $json ) ) {
			$data[ 'new_folder_path' ] = null;
		}

		// Extract confidence.
		if ( preg_match( '/"confidence"\s*:\s*([\d.]+)/', $json, $matches ) ) {
			$data[ 'confidence' ] = (float) $matches[ 1 ];
		}

		// Extract reason (might be truncated, that's OK).
		if ( preg_match( '/"reason"\s*:\s*"([^"]*)"?/', $json, $matches ) ) {
			$reason = $matches[ 1 ];
			// Clean up truncated reason.
			$reason           = rtrim( $reason, '\\' );
			$data[ 'reason' ] = $reason . ( strlen( $reason ) > 50 ? '...' : '' );
		}

		// Check if we have enough data to proceed.
		if ( isset( $data[ 'action' ] ) && ( isset( $data[ 'folder_id' ] ) || isset( $data[ 'new_folder_path' ] ) ) ) {
			// Fill in defaults for missing fields.
			$data[ 'folder_id' ]       = $data[ 'folder_id' ] ?? null;
			$data[ 'new_folder_path' ] = $data[ 'new_folder_path' ] ?? null;
			$data[ 'confidence' ]      = $data[ 'confidence' ] ?? 0.7;
			$data[ 'reason' ]          = $data[ 'reason' ] ?? 'Response was truncated but folder extracted.';

			return $data;
		}

		return null;
	}

	/**
	 * Get a setting value with config resolution.
	 *
	 * Priority: CLI override > constant > environment variable > database > default.
	 *
	 * @param string $key Setting key.
	 * @return mixed
	 */
	protected function get_setting( string $key ): mixed {
		// Check for CLI overrides first (highest priority when running via WP-CLI).
		if ( defined( 'WP_CLI' ) && WP_CLI && class_exists( \VmfaAiOrganizer\CLI\Commands::class) ) {
			if ( \VmfaAiOrganizer\CLI\Commands::has_override( $key ) ) {
				return \VmfaAiOrganizer\CLI\Commands::get_override( $key );
			}
		}

		return Plugin::get_instance()->get_setting( $key );
	}
}
