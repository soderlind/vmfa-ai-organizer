/**
 * Overview Page Component for AI Organizer.
 *
 * Displays add-on description, KPI stats, and quick info.
 *
 * @package VmfaAiOrganizer
 */

import { useState, useEffect, useCallback } from '@wordpress/element';
import { Card, CardBody, CardHeader, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

import { StatsCard } from '@vmfo/shared';

/**
 * Overview Page component.
 *
 * @return {JSX.Element} The overview page content.
 */
export function OverviewPage() {
	const [ stats, setStats ] = useState( null );
	const [ loading, setLoading ] = useState( true );

	/**
	 * Fetch media statistics.
	 */
	const fetchStats = useCallback( async () => {
		try {
			const response = await apiFetch( {
				path: '/vmfa/v1/stats',
				method: 'GET',
			} );
			setStats( response );
		} catch ( err ) {
			// Ignore fetch errors; stats may still show loading.
		} finally {
			setLoading( false );
		}
	}, [] );

	useEffect( () => {
		fetchStats();
	}, [ fetchStats ] );

	const kpiStats = stats
		? [
				{
					label: __( 'Total Media', 'vmfa-ai-organizer' ),
					value: stats.total_media?.toLocaleString() ?? '—',
				},
				{
					label: __( 'In Folders', 'vmfa-ai-organizer' ),
					value: stats.assigned?.toLocaleString() ?? '—',
				},
				{
					label: __( 'Unassigned', 'vmfa-ai-organizer' ),
					value: stats.unassigned?.toLocaleString() ?? '—',
				},
				{
					label: __( 'Folders', 'vmfa-ai-organizer' ),
					value: stats.folders?.toLocaleString() ?? '—',
				},
		  ]
		: [
				{
					label: __( 'Total Media', 'vmfa-ai-organizer' ),
					isLoading: loading,
				},
				{
					label: __( 'In Folders', 'vmfa-ai-organizer' ),
					isLoading: loading,
				},
				{
					label: __( 'Unassigned', 'vmfa-ai-organizer' ),
					isLoading: loading,
				},
				{
					label: __( 'Folders', 'vmfa-ai-organizer' ),
					isLoading: loading,
				},
		  ];

	return (
		<>
			<StatsCard stats={ kpiStats } />

			<Card className="vmfo-overview-card">
				<CardHeader>
					<h3>{ __( 'About AI Organizer', 'vmfa-ai-organizer' ) }</h3>
				</CardHeader>
				<CardBody>
					<p>
						{ __(
							'AI Organizer uses artificial intelligence to automatically analyze and organize your media library into logical folders. It examines image content, filenames, and metadata to suggest the best folder structure.',
							'vmfa-ai-organizer'
						) }
					</p>
					<h4>{ __( 'Features', 'vmfa-ai-organizer' ) }</h4>
					<ul>
						<li>
							{ __(
								'Automatic folder suggestions based on image content',
								'vmfa-ai-organizer'
							) }
						</li>
						<li>
							{ __(
								'Support for multiple AI providers (OpenAI, Anthropic, Google Gemini, Ollama)',
								'vmfa-ai-organizer'
							) }
						</li>
						<li>
							{ __(
								'Preview mode to review changes before applying',
								'vmfa-ai-organizer'
							) }
						</li>
						<li>
							{ __(
								'Automatic backups before reorganization',
								'vmfa-ai-organizer'
							) }
						</li>
					</ul>
				</CardBody>
			</Card>

			<Card className="vmfo-overview-card">
				<CardHeader>
					<h3>{ __( 'Quick Start', 'vmfa-ai-organizer' ) }</h3>
				</CardHeader>
				<CardBody>
					<ol>
						<li>
							{ __(
								'Go to Configure tab and set up your AI provider',
								'vmfa-ai-organizer'
							) }
						</li>
						<li>
							{ __(
								'Navigate to Actions tab and run a preview scan',
								'vmfa-ai-organizer'
							) }
						</li>
						<li>
							{ __(
								'Review the suggested changes in the preview modal',
								'vmfa-ai-organizer'
							) }
						</li>
						<li>
							{ __(
								'Apply changes if satisfied with the results',
								'vmfa-ai-organizer'
							) }
						</li>
					</ol>
				</CardBody>
			</Card>
		</>
	);
}

export default OverviewPage;
