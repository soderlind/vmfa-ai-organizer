=== Virtual Media Folders AI Organizer ===
Contributors: starter
Donate link: https://developer.yoast.com/blog/real-world-implementation-of-wordpresss-plugin-dependencies-feature/
Tags: media, folders, ai, organization, virtual folders
Requires at least: 6.8
Tested up to: 7.0
Stable tag: 1.4.0
Requires PHP: 8.3
Requires Plugins: virtual-media-folders
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

AI-powered media organization add-on for Virtual Media Folders. Uses vision AI to analyze images and organize them into virtual folders.

== Description ==

Virtual Media Folders AI Organizer is a powerful add-on for the [Virtual Media Folders](https://wordpress.org/plugins/virtual-media-folders/) plugin that uses AI vision capabilities to automatically organize your WordPress media library.

Unlike traditional media organizers that rely only on metadata, this plugin actually **analyzes what's in your images** using state-of-the-art AI vision models to make intelligent folder suggestions.

= Key Features =

* **Vision-Based AI Analysis** – Analyzes actual image content (objects, scenes, people, colors) - not just filenames
* **Multiple AI Providers** – Choose from OpenAI, Azure OpenAI, Anthropic Claude, Google Gemini, Ollama, Grok, Exo.
  * v1.3.0 adds support for **WordPress Core AI provider** (WP 7.0+ AI Client) as a first-class provider option. Seamlessly integrates any AI provider registered with the WordPress AI Client, with automatic detection and configuration links.
* **Three Scan Modes**:
  * Organize Unassigned – Only process media not already in a folder
  * Re-analyze All – Re-analyze all media and update assignments
  * Reorganize All – Remove all folders and rebuild from scratch
* **Preview Mode** – Dry-run to see proposed changes before applying
* **Backup & Restore** – Automatic backup before reorganization with one-click restore
* **Background Processing** – Uses Action Scheduler for efficient chunked processing
* **Real-time Progress** – Live progress updates in the admin UI

= How It Works =

1. Select your preferred AI provider and configure your API key
2. Choose a scan mode (unassigned only, re-analyze, or full reorganize)
3. Optionally preview the results first with dry-run mode
4. Apply the suggestions to automatically organize your media

The AI analyzes each image in this priority order:

1. **Image Content** (primary) – What's actually visible in the image
2. **EXIF/Metadata** – Camera info, date taken, GPS location, keywords
3. **Text Metadata** – Title, alt text, caption, description
4. **Filename** – Used only as a last resort hint

= Supported AI Providers =

* **OpenAI** – GPT-4o, GPT-4o-mini, GPT-4-turbo
* **Azure OpenAI** – Enterprise Azure-hosted deployments
* **Anthropic** – Claude 3 Haiku, Sonnet, Opus, Claude 3.5 Sonnet
* **Google Gemini** – Gemini 1.5 Flash, Gemini 1.5 Pro, Gemini 2.0 Flash
* **Ollama** – Local LLMs including LLaVA for vision
* **Grok (xAI)** – Grok Beta, Grok 2
* **Exo** – Distributed local inference
* **Heuristic** – Free pattern-matching fallback (no API required)

= Requirements =

* WordPress 6.8 or higher
* PHP 8.3 or higher
* [Virtual Media Folders](https://wordpress.org/plugins/virtual-media-folders/) plugin (required)

== Installation ==

1. Install and activate the [Virtual Media Folders](https://wordpress.org/plugins/virtual-media-folders/) plugin first
2. Upload the `vmfa-ai-organizer` folder to `/wp-content/plugins/`
3. Activate the plugin through the 'Plugins' menu in WordPress
4. Go to **Media → AI Organizer** to configure your AI provider
5. Enter your API key and select your preferred model
6. Start organizing your media!

= WP-CLI Support =

The plugin includes comprehensive WP-CLI commands for automation:

`
# Start a preview scan
wp vmfa-ai scan start

# Watch progress with live updates
wp vmfa-ai scan status --watch

# Apply the changes
wp vmfa-ai scan apply

# Show media statistics
wp vmfa-ai stats
`

See the full [WP-CLI documentation](https://github.com/soderlind/vmfa-ai-organizer/blob/main/docs/WP-CLI.md) for all available commands.

= Configuration via Constants =

You can also configure the plugin using PHP constants in your `wp-config.php`:

`
// Provider Selection
define( 'VMFA_AI_PROVIDER', 'openai' );

// OpenAI / Azure OpenAI
define( 'VMFA_AI_OPENAI_TYPE', 'openai' ); // 'openai' or 'azure'
define( 'VMFA_AI_OPENAI_KEY', 'sk-...' );
define( 'VMFA_AI_OPENAI_MODEL', 'gpt-4o-mini' );

// Azure-specific
define( 'VMFA_AI_AZURE_ENDPOINT', 'https://your-resource.openai.azure.com' );
define( 'VMFA_AI_AZURE_API_VERSION', '2024-02-15-preview' );
`

== Frequently Asked Questions ==

= Does this plugin require an AI API key? =

For best results, yes. However, the plugin includes a free "Heuristic" provider that uses pattern matching on filenames and metadata – no API key required.

= Which AI provider should I use? =

For most users, we recommend GPT-4o-mini (OpenAI) for the best balance of speed, cost, and accuracy. For enterprise users, Azure OpenAI provides the same capabilities with enterprise compliance.

= Does it actually look at my images? =

Yes! Unlike metadata-only solutions, this plugin sends your images to vision-capable AI models that can understand what's actually in the image – people, objects, scenes, text, and more.

= Is my data safe? =

Images are sent to your chosen AI provider for analysis. No data is stored by this plugin beyond the folder assignments. Review your AI provider's privacy policy for their data handling practices.

= Can I use local AI models? =

Yes! Ollama and Exo providers support running AI models locally on your own hardware. This keeps all data on your server.

= What image formats are supported? =

JPEG, PNG, GIF, and WebP images up to 10MB. SVG and other formats are processed using metadata only.

= How long does scanning take? =

It depends on your media library size and AI provider speed. The plugin processes media in batches using background jobs, so you can continue working while it runs.

= Ollama is timing out on some images. How do I fix this? =

Vision models can take 30+ seconds per image, and complex or high-resolution images may take longer. Increase the timeout in the AI Provider settings (default is 120 seconds, max 600 seconds), or add to wp-config.php:

`define( 'VMFA_AI_OLLAMA_TIMEOUT', 180 ); // 3 minutes`

= I have duplicate or messy folder structures. How do I clean them up? =

Use the "Reorganize All" scan mode. This removes all existing folder assignments and rebuilds your organization from scratch using the AI. Make sure to preview the results first with dry-run mode, and note that a backup is automatically created before reorganization.


== Changelog ==

= 1.4.0 =
* Added: WP 7.0+ design-token style overrides for scan progress, results, and preview modal

= 1.3.2 =
* Security: Updated npm dependencies.

= 1.3.1 =
* Changed: Tested up to WordPress 7.0

= 1.3.0 =
* Added: WordPress Core AI provider (WP 7.0+ AI Client) as first-class provider option
* Added: Connectors settings link shown when WordPress Core provider is selected
* Added: Dynamic provider registration — WordPress AI auto-appears when WP 7.0+ detected
* Changed: Hide "WordPress AI Client detected" notice when WordPress Core is already selected
* Changed: Tested up to WordPress 7.0

= 1.2.1 =
* Fixed: Added Node.js build step to GitHub Actions release workflows
* Fixed: Added `build/` to `.gitignore`
* Fixed: Use `--optimize-autoloader` for Composer in CI

= 1.2.0 =
* Changed: Replaced inline plugin updater with shared `class-github-updater.php`

= 1.1.1 =
* Fixed: Added ABSPATH guards to all PHP source files
* Fixed: Extracted inline Ollama/Exo provider scripts to enqueued external JS file
* Added: uninstall.php for clean plugin removal

= 1.1.0 =
* Fixed: Duplicate "Settings saved" notice when integrated with parent plugin subtabs
* Changed: Integrated as subtab within parent plugin's settings page
* Changed: Media Scanner, Settings, and AI Provider now appear as subtabs

= 1.0.1 =
* Updated WordPress packages (@wordpress/components 32.1.0, @wordpress/scripts 31.4.0, @wordpress/eslint-plugin 24.1.0, and others)
* Updated dev dependencies (vitest 4.0.18, @testing-library/react 16.3.2)

= 1.0.0 =
* First stable release of Virtual Media Folders AI Organizer
* Comprehensive AI-powered media organization with vision analysis
* Full support for multiple AI providers (OpenAI, Azure OpenAI, Anthropic, Google Gemini, Ollama, Grok, Exo)
* Background processing with Action Scheduler and WP-Cron fallback
* Complete WP-CLI support for automation
* Preview mode with backup and restore functionality

= 0.6.0 =
* Improved scan reliability across hosts
* Scan scheduling falls back to WP-Cron when Action Scheduler is missing
* Keeps locale consistent for background scan callbacks
* Handles attachments served from a CDN (non-local upload URLs)

= 0.5.7 =
* Fixed: keep locale consistent for background scan jobs (WP-Cron / Action Scheduler), improving folder name consistency

= 0.5.6 =
* Fixed fatal error when Action Scheduler is not available
* Scheduling now falls back to WP-Cron when Action Scheduler is missing

= 0.5.5 =
* Fixed Action Scheduler loading for release packaging differences
* Plugin now loads Action Scheduler from either vendor/ or woocommerce/ when bundled

= 0.5.4 =
* Added explicit check for Action Scheduler in release workflow (build fails if missing)

= 0.5.3 =
* Fixed Action Scheduler loading order - now loads at plugin file level instead of plugins_loaded hook
* Added Action Scheduler availability checks before scheduling operations
* Prevents "Call to undefined function as_schedule_single_action()" errors

= 0.5.2 =
* Fixed fatal error when Action Scheduler functions called without global namespace prefix
* Affected WP-CLI scans on production sites without WooCommerce

= 0.5.1 =
* Housekeeping

= 0.5.0 =
* Settings now appear as a tab within Virtual Media Folders "Folder Settings" page
* Backwards compatible: falls back to standalone menu if parent plugin is outdated

= 0.4.3 =
* Improved AI system prompt to prevent creating overly specific subfolders
* AI now uses existing broader categories (e.g., "Insects" instead of creating "Bees")

= 0.4.2 =
* Fixed scan status showing stale completed_at timestamp from previous scans

= 0.4.1 =
* Fixed WP-CLI `--watch` Action Scheduler processing
* Added stale action recovery for killed CLI processes
* Documented `--watch` is for interactive terminal use only

= 1.0.0 =
* Stable release of Virtual Media Folders AI Organizer
* Comprehensive AI-powered media organization with vision analysis
* Full support for multiple AI providers (OpenAI, Azure OpenAI, Anthropic, Google Gemini, Ollama, Grok, Exo)
* Background processing with Action Scheduler and WP-Cron fallback
* Complete WP-CLI support for automation
* Preview mode with backup and restore functionality

= 0.4.0 =
* Added comprehensive WP-CLI support for command-line automation
* New commands: `wp vmfa-ai scan start`, `status`, `apply`, `cancel`, `reset`, `results`
* New commands: `wp vmfa-ai analyze`, `backup`, `provider`, `stats`
* Live progress monitoring with `--watch` flag (runs Action Scheduler queue automatically)
* AI provider/model override via CLI parameters (`--provider`, `--model`, `--api-key`)
* Machine-readable output with `--porcelain` for scripting
* Full documentation in docs/WP-CLI.md

= 0.3.0 =
* Deterministic type routing: documents go to "Documents" and videos go to "Videos" before image AI analysis
* Reorganize All preview: type-based routing respects simulated empty folders (avoids false assigns)
* Documents/Videos folder names are deterministic (not translated)

= 0.2.4 =
* Improved reliability when AI returns invalid folder IDs (prompt now includes IDs and parser falls back to folder path)
* Reduced false skips when creating new folders is allowed (requires new_folder_path)
* Prevented emoji/emoticon folder names from being created (emoji stripping enforced)
* Improved prompt consistency (restored visual_description and strengthened anti-synonym guidance)
* Reduced "Skipped: Folder not found" in Reorganize All preview when starting from an empty folder list
* Filtered out generic numbered folders (e.g. "Subfolder 01") from the AI-visible folder list

= 0.2.3 =
* Fixed Ollama JSON parse errors with structured JSON output schema
* Added truncated response recovery to salvage data from incomplete AI responses
* Added JSON response format to all AI providers (OpenAI, Gemini, Grok, Exo)
* Fixed Ollama model matching and changed default to llama3.2-vision:latest
* Added is_configured() caching to reduce redundant API calls
* Cancel scan now properly cleans up Action Scheduler jobs

= 0.2.2 =
* Fixed JSON parse error when Ollama returns responses with control characters (soft hyphens)
* Fixed settings checkbox to properly save unchecked state

= 0.2.1 =
* Fixed settings tab isolation: saving Organization Settings no longer clears AI Provider settings
* Improved AI system prompt for better folder variety and naming
* Folder names now allow natural spaces (e.g., "Street Art" instead of "Street_Art")

= 0.2.0 =
* Complete overhaul of "Reorganize All" feature
* Fixed folders not being deleted before rebuilding from scratch
* Preview mode now correctly simulates empty folders for accurate predictions
* Direct database queries bypass WordPress/Redis term cache for fresh data
* Fixed folders not being created when applying cached preview results
* Documents/Videos folders now always created when needed (type-based, not AI-suggested)
* Comprehensive hierarchy inversion prevention across batches
* "Reorganize All" now always allows creating new folders since starting from scratch

= 0.1.9 =
* Fixed Documents/Videos folders not being created during "Reorganize All" when "Allow New Folders" is disabled

= 0.1.8 =
* Added hierarchy inversion prevention: AI now detects and prevents creating inverted folder hierarchies
* Automatic remapping to existing paths when conflicts are detected (e.g., Events/Outdoor vs Outdoor/Events)
* Enhanced system prompt with explicit anti-inversion rules and examples
* Fixed document/video assignment when target folders exist as subfolders
* Added folder name caching for efficient lookups during scans

= 0.1.7 =
* Ollama: Dynamic model list populated from running Ollama server with "Refresh Models" button
* Ollama: Configurable timeout setting (10-600 seconds) for larger models or slower hardware
* Improved JSON parsing for AI responses wrapped in markdown code blocks
* Fixed WordPress 6.7 CheckboxControl deprecation warning

= 0.1.6 =
* Added Exo settings enhancements: health check button, dynamic model dropdown, refresh models button
* Added ExoController REST API for Exo health check and model listing
* Renamed VMFA_AI_EXO_URL to VMFA_AI_EXO_ENDPOINT for consistency

= 0.1.5 =
* Reorganized settings into three tabs: Media Scanner, Settings, and AI Provider
* Simplified README documentation, now points to AI Provider Guide for details
* Moved development documentation to separate file (docs/DEVELOPMENT.md)

= 0.1.4 =
* Folders are now sorted alphabetically in the preview modal and when creating virtual folders
* Scan progress component now uses full available width for better visibility

= 0.1.2 =
* Fixed GitHubPluginUpdater class namespace to match PSR-4 autoloading
* Documents and Videos folders are now translatable using gettext

= 0.1.1 =
* Fixed JavaScript translations not loading for non-English locales
* Removed redundant dependency check (now handled by WordPress Requires Plugins header)
* Added i18n build scripts for translation workflow

= 0.1.0 =
* Initial release
* Vision-based AI analysis for image content
* Support for OpenAI, Azure OpenAI, Anthropic, Gemini, Ollama, Grok, Exo providers
* Heuristic fallback for metadata-based organization
* Three scan modes: unassigned, re-analyze, reorganize
* Preview mode with dry-run capability
* Backup and restore functionality
* Background processing with Action Scheduler
* Real-time progress tracking
* Settings tabs for Media Scanner and AI Provider configuration
* Full Azure OpenAI support with endpoint and API version configuration

== Upgrade Notice ==

= 1.0.0 =
First stable release. Includes all features from 0.x development cycle with improved reliability.

= 0.1.0 =
Initial release of Virtual Media Folders AI Organizer.
