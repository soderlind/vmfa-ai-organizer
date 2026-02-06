/**
 * Logs Page Component for AI Organizer.
 *
 * Placeholder for future activity logs feature.
 *
 * @package VmfaAiOrganizer
 */

import { Card, CardBody, CardHeader } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Logs Page component.
 *
 * @return {JSX.Element} The logs page content.
 */
export function LogsPage() {
	return (
		<Card className="vmfo-logs-card">
			<CardHeader>
				<h3>{ __( 'Activity Logs', 'vmfa-ai-organizer' ) }</h3>
			</CardHeader>
			<CardBody>
				<div className="vmfo-addon-shell__empty-state">
					<p>
						{ __(
							'Activity logging is coming in a future update. This will show a history of scan operations, folder assignments, and restoration events.',
							'vmfa-ai-organizer'
						) }
					</p>
				</div>
			</CardBody>
		</Card>
	);
}

export default LogsPage;
