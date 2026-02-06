/**
 * Dashboard Page Component for AI Organizer.
 *
 * Displays scan status, progress, and action buttons.
 *
 * @package VmfaAiOrganizer
 */

import { useState } from '@wordpress/element';
import { Button, Card, CardBody, CardHeader, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

import { ScanProgress } from '../components/ScanProgress';
import { RestorePanel } from '../components/RestorePanel';
import { PreviewModal } from '../components/PreviewModal';

/**
 * Dashboard Page component.
 *
 * @param {Object}   props                Component props.
 * @param {Object}   props.status         Scan status object.
 * @param {Object}   props.stats          Media stats object.
 * @param {string}   props.mode           Current scan mode.
 * @param {boolean}  props.dryRun         Whether dry run is enabled.
 * @param {boolean}  props.isLoading      Whether status is loading.
 * @param {Function} props.onStartScan    Start scan callback.
 * @param {Function} props.onCancelScan   Cancel scan callback.
 * @param {Function} props.onReset        Reset callback.
 * @param {Function} props.onApplyCached  Apply cached results callback.
 * @param {Function} props.onRefresh      Refresh callback.
 * @return {JSX.Element} The dashboard page content.
 */
export function DashboardPage( {
	status,
	stats,
	mode,
	dryRun,
	isLoading,
	onStartScan,
	onCancelScan,
	onReset,
	onApplyCached,
	onRefresh,
} ) {
	const [ showPreview, setShowPreview ] = useState( false );
	const [ previewResults, setPreviewResults ] = useState( [] );
	const [ notice, setNotice ] = useState( null );

	const isRunning = status?.status === 'running';
	const isCompleted = status?.status === 'completed';
	const isCancelled = status?.status === 'cancelled';
	const isIdle = ! status || status?.status === 'idle';
	const hasCachedResults = isCompleted && status?.dry_run;

	/**
	 * Handle scan start.
	 */
	const handleStartScan = async () => {
		try {
			setNotice( null );
			await onStartScan();
			setNotice( {
				type: 'success',
				message: dryRun
					? __(
							'Preview scan started. Results will be shown when complete.',
							'vmfa-ai-organizer'
					  )
					: __(
							'Scan started. Media files are being organized.',
							'vmfa-ai-organizer'
					  ),
			} );
		} catch ( err ) {
			setNotice( {
				type: 'error',
				message:
					err.message ||
					__( 'Failed to start scan.', 'vmfa-ai-organizer' ),
			} );
		}
	};

	/**
	 * Handle scan cancellation.
	 */
	const handleCancelScan = async () => {
		try {
			await onCancelScan();
			setNotice( {
				type: 'info',
				message: __( 'Scan cancelled.', 'vmfa-ai-organizer' ),
			} );
		} catch ( err ) {
			setNotice( {
				type: 'error',
				message:
					err.message ||
					__( 'Failed to cancel scan.', 'vmfa-ai-organizer' ),
			} );
		}
	};

	/**
	 * Handle reset.
	 */
	const handleReset = async () => {
		try {
			await onReset();
			setNotice( null );
		} catch ( err ) {
			setNotice( {
				type: 'error',
				message:
					err.message || __( 'Failed to reset.', 'vmfa-ai-organizer' ),
			} );
		}
	};

	/**
	 * Fetch cached results and show preview modal.
	 */
	const handleShowPreview = async () => {
		try {
			const response = await apiFetch( {
				path: '/vmfa/v1/scan/cached-results',
				method: 'GET',
			} );
			setPreviewResults( response.results || [] );
		} catch ( err ) {
			setPreviewResults( status?.results || [] );
		} finally {
			setShowPreview( true );
		}
	};

	/**
	 * Apply preview results using cached dry-run data.
	 */
	const handleApplyPreview = async () => {
		setShowPreview( false );
		try {
			setNotice( {
				type: 'info',
				message: __(
					'Applying cached preview results…',
					'vmfa-ai-organizer'
				),
			} );
			const response = await onApplyCached();
			setNotice( {
				type: 'success',
				message:
					response?.message ||
					__(
						'Preview results applied successfully.',
						'vmfa-ai-organizer'
					),
			} );
		} catch ( err ) {
			setNotice( {
				type: 'error',
				message:
					err.message ||
					__( 'Failed to apply preview results.', 'vmfa-ai-organizer' ),
			} );
		}
	};

	return (
		<>
			{ notice && (
				<Notice
					status={ notice.type }
					isDismissible={ true }
					onRemove={ () => setNotice( null ) }
				>
					{ notice.message }
				</Notice>
			) }

			{ /* Scan Actions Card */ }
			<Card className="vmfo-dashboard-card vmfo-actions-card">
				<CardHeader>
					<h3>{ __( 'Scan Actions', 'vmfa-ai-organizer' ) }</h3>
				</CardHeader>
				<CardBody>
					<p className="vmfo-action-description">
						{ dryRun
							? __(
									'Start a preview scan to see proposed changes without applying them.',
									'vmfa-ai-organizer'
							  )
							: __(
									'Start organizing your media library based on AI analysis.',
									'vmfa-ai-organizer'
							  ) }
					</p>

					<div className="vmfo-action-buttons">
						{ ! isRunning && (
							<Button
								variant="primary"
								onClick={ handleStartScan }
								disabled={
									isLoading ||
									( mode === 'organize_unassigned' &&
										stats?.unassigned === 0 )
								}
							>
								{ dryRun
									? __( 'Preview Changes', 'vmfa-ai-organizer' )
									: __(
											'Start Organizing',
											'vmfa-ai-organizer'
									  ) }
							</Button>
						) }

						{ isRunning && (
							<Button
								variant="secondary"
								isDestructive
								onClick={ handleCancelScan }
								disabled={ isLoading }
							>
								{ __( 'Cancel Scan', 'vmfa-ai-organizer' ) }
							</Button>
						) }

						{ ( isCompleted || isCancelled ) && (
							<Button
								variant="secondary"
								onClick={ handleReset }
								disabled={ isLoading }
							>
								{ __( 'Reset', 'vmfa-ai-organizer' ) }
							</Button>
						) }
					</div>

					{ mode === 'organize_unassigned' &&
						stats?.unassigned === 0 && (
							<Notice
								status="info"
								isDismissible={ false }
								className="vmfo-inline-notice"
							>
								{ __(
									'All media items are already assigned to folders.',
									'vmfa-ai-organizer'
								) }
							</Notice>
						) }
				</CardBody>
			</Card>

			{ /* Status Summary Card */ }
			{ ( isRunning || isCompleted || isCancelled ) && (
				<Card className="vmfo-dashboard-card">
					<CardHeader>
						<h3>{ __( 'Scan Status', 'vmfa-ai-organizer' ) }</h3>
					</CardHeader>
					<CardBody>
						<ScanProgress
							status={ status }
							onCancel={ handleCancelScan }
							onReset={ handleReset }
							isLoading={ isLoading }
						/>
					</CardBody>
				</Card>
			) }

			{ /* Last Scan Results */ }
			{ isCompleted && status?.results_count > 0 && (
				<Card className="vmfo-dashboard-card">
					<CardHeader>
						<h3>
							{ __( 'Last Scan Results', 'vmfa-ai-organizer' ) }
						</h3>
					</CardHeader>
					<CardBody>
						<p>
							{ __(
								'Processed:',
								'vmfa-ai-organizer'
							) }{ ' ' }
							<strong>
								{ status.processed } / { status.total }
							</strong>{ ' ' }
							{ __( 'items', 'vmfa-ai-organizer' ) }
						</p>
						{ status.dry_run && (
							<p className="vmfo-dry-run-notice">
								{ __(
									'This was a preview scan. Results are cached and can be applied below.',
									'vmfa-ai-organizer'
								) }
							</p>
						) }
					</CardBody>
				</Card>
			) }

			{ /* Apply Cached Results Card */ }
			{ hasCachedResults && (
				<Card className="vmfo-dashboard-card vmfo-cached-results">
					<CardHeader>
						<h3>
							{ __( 'Preview Results Available', 'vmfa-ai-organizer' ) }
						</h3>
					</CardHeader>
					<CardBody>
						<p>
							{ __(
								'A preview scan has completed. Review and apply the cached results.',
								'vmfa-ai-organizer'
							) }
						</p>
						<div className="vmfo-action-buttons">
							<Button
								variant="primary"
								onClick={ handleShowPreview }
							>
								{ __( 'View & Apply Results', 'vmfa-ai-organizer' ) }
							</Button>
						</div>
					</CardBody>
				</Card>
			) }

			{ /* Restore Panel */ }
			<RestorePanel onRestore={ onRefresh } />

			{ /* Info Card */ }
			<Card className="vmfo-dashboard-card vmfo-info-card">
				<CardHeader>
					<h3>{ __( 'How Scanning Works', 'vmfa-ai-organizer' ) }</h3>
				</CardHeader>
				<CardBody>
					<ol>
						<li>
							{ __(
								'Configure scan mode and options in the Configure tab',
								'vmfa-ai-organizer'
							) }
						</li>
						<li>
							{ __(
								'Start with Preview Mode to see changes before applying',
								'vmfa-ai-organizer'
							) }
						</li>
						<li>
							{ __(
								'The AI analyzes each image and suggests folder assignments',
								'vmfa-ai-organizer'
							) }
						</li>
						<li>
							{ __(
								'Review and apply changes when satisfied',
								'vmfa-ai-organizer'
							) }
						</li>
					</ol>
				</CardBody>
			</Card>

			{ /* Preview Modal */ }
			{ showPreview && (
				<PreviewModal
					results={ previewResults }
					onClose={ () => setShowPreview( false ) }
					onApply={ handleApplyPreview }
				/>
			) }
		</>
	);
}

export default DashboardPage;
