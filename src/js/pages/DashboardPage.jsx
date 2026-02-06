/**
 * Dashboard Page Component for AI Organizer.
 *
 * Displays current scan status and progress visualization.
 *
 * @package VmfaAiOrganizer
 */

import { Card, CardBody, CardHeader, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { ScanProgress } from '../components/ScanProgress';

/**
 * Dashboard Page component.
 *
 * @param {Object}   props            Component props.
 * @param {Object}   props.status     Scan status object.
 * @param {boolean}  props.isLoading  Whether status is loading.
 * @param {Function} props.onCancel   Cancel callback.
 * @param {Function} props.onReset    Reset callback.
 * @return {JSX.Element} The dashboard page content.
 */
export function DashboardPage( { status, isLoading, onCancel, onReset } ) {
	const isRunning = status?.status === 'running';
	const isCompleted = status?.status === 'completed';
	const isCancelled = status?.status === 'cancelled';
	const isIdle = ! status || status?.status === 'idle';

	return (
		<>
			{ /* Status Summary Card */ }
			<Card className="vmfo-dashboard-card">
				<CardHeader>
					<h3>{ __( 'Scan Status', 'vmfa-ai-organizer' ) }</h3>
				</CardHeader>
				<CardBody>
					{ isIdle && (
						<div className="vmfo-status-idle">
							<p>
								{ __(
									'No scan is currently running. Go to the Actions tab to start a new scan.',
									'vmfa-ai-organizer'
								) }
							</p>
						</div>
					) }

					{ ( isRunning || isCompleted || isCancelled ) && (
						<ScanProgress
							status={ status }
							onCancel={ onCancel }
							onReset={ onReset }
							isLoading={ isLoading }
						/>
					) }
				</CardBody>
			</Card>

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
									'This was a preview scan. Results are cached and can be applied from the Actions tab.',
									'vmfa-ai-organizer'
								) }
							</p>
						) }
					</CardBody>
				</Card>
			) }

			{ /* Info Card */ }
			<Card className="vmfo-dashboard-card vmfo-info-card">
				<CardHeader>
					<h3>{ __( 'How Scanning Works', 'vmfa-ai-organizer' ) }</h3>
				</CardHeader>
				<CardBody>
					<ol>
						<li>
							{ __(
								'Select a scan mode in the Actions tab',
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
		</>
	);
}

export default DashboardPage;
