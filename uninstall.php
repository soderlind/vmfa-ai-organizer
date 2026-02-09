<?php
/**
 * Uninstall handler for Virtual Media Folders – AI Organizer.
 *
 * Removes all plugin options and cancels any scheduled Action Scheduler tasks.
 *
 * @package VmfaAiOrganizer
 */

// If uninstall not called from WordPress, die.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	die;
}

// Plugin options.
$options = array(
	'vmfa_ai_organizer_settings',
	'vmfa_scan_progress',
	'vmfa_scan_pending_results',
	'vmfa_scan_dryrun_cache',
	'vmfa_scan_attachment_ids',
	'vmfa_session_suggested_folders',
	'vmfo_reorganize_backup',
);

foreach ( $options as $option ) {
	delete_option( $option );
}

// Unschedule Action Scheduler tasks.
if ( function_exists( 'as_unschedule_all_actions' ) ) {
	$hooks = array(
		'vmfa_process_media_batch',
		'vmfa_apply_assignments',
		'vmfa_finalize_scan',
		'vmfa_cleanup_folders',
	);

	foreach ( $hooks as $hook ) {
		as_unschedule_all_actions( $hook, array(), 'vmfa-ai-organizer' );
	}
}
