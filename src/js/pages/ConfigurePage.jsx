/**
 * Configure Page Component for AI Organizer.
 *
 * Contains all settings - AI provider, scan mode options.
 * No action buttons here - just configuration.
 *
 * @package VmfaAiOrganizer
 */

import { useState, useEffect, useCallback } from '@wordpress/element';
import {
	Card,
	CardBody,
	CardHeader,
	RadioControl,
	CheckboxControl,
	Notice,
	SelectControl,
	TextControl,
	Button,
	Spinner,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * Configure Page component.
 *
 * @param {Object}   props              Component props.
 * @param {string}   props.mode         Current scan mode.
 * @param {Function} props.setMode      Set mode callback.
 * @param {boolean}  props.dryRun       Whether dry run is enabled.
 * @param {Function} props.setDryRun    Set dry run callback.
 * @return {JSX.Element} The configure page content.
 */
export function ConfigurePage( { mode, setMode, dryRun, setDryRun } ) {
	const modeOptions = [
		{
			label: __( 'Organize Unassigned', 'vmfa-ai-organizer' ),
			value: 'organize_unassigned',
		},
		{
			label: __( 'Re-analyze All', 'vmfa-ai-organizer' ),
			value: 'reanalyze_all',
		},
		{
			label: __( 'Reorganize All (Reset & Rebuild)', 'vmfa-ai-organizer' ),
			value: 'reorganize_all',
		},
	];

	/**
	 * Get help text for scan mode.
	 *
	 * @param {string} selectedMode - Scan mode.
	 * @return {string} Help text.
	 */
	const getModeHelp = ( selectedMode ) => {
		switch ( selectedMode ) {
			case 'organize_unassigned':
				return __(
					'Only process media files that are not already in a folder.',
					'vmfa-ai-organizer'
				);
			case 'reanalyze_all':
				return __(
					'Re-analyze all media and suggest new folder assignments.',
					'vmfa-ai-organizer'
				);
			case 'reorganize_all':
				return __(
					'Remove all folders and assignments, then create a new AI-optimized structure.',
					'vmfa-ai-organizer'
				);
			default:
				return '';
		}
	};

	return (
		<>
			{ /* Scan Mode Settings */ }
			<Card className="vmfo-configure-card">
				<CardHeader>
					<h3>{ __( 'Scan Options', 'vmfa-ai-organizer' ) }</h3>
				</CardHeader>
				<CardBody>
					<RadioControl
						label={ __( 'Scan Mode', 'vmfa-ai-organizer' ) }
						help={ getModeHelp( mode ) }
						selected={ mode }
						options={ modeOptions }
						onChange={ setMode }
					/>

					{ mode === 'reorganize_all' && (
						<Notice status="warning" isDismissible={ false }>
							{ __(
								'Warning: This will remove all existing folder assignments and reorganize from scratch. A backup will be created automatically.',
								'vmfa-ai-organizer'
							) }
						</Notice>
					) }

					<div style={ { marginTop: '1.5em' } }>
						<CheckboxControl
							__nextHasNoMarginBottom
							label={ __(
								'Preview mode (dry run)',
								'vmfa-ai-organizer'
							) }
							help={ __(
								'Show proposed changes without applying them. Recommended for first run.',
								'vmfa-ai-organizer'
							) }
							checked={ dryRun }
							onChange={ setDryRun }
						/>
					</div>
				</CardBody>
			</Card>

			{ /* AI Provider Info Card */ }
			<Card className="vmfo-configure-card vmfo-info-card">
				<CardHeader>
					<h3>{ __( 'AI Provider Settings', 'vmfa-ai-organizer' ) }</h3>
				</CardHeader>
				<CardBody>
					<p>
						{ __(
							'AI provider settings (API keys, models, endpoints) are configured in the WordPress settings form below. Changes are saved when you click "Save Settings" on the main settings form.',
							'vmfa-ai-organizer'
						) }
					</p>
					<p>
						<strong>
							{ __( 'Supported providers:', 'vmfa-ai-organizer' ) }
						</strong>
					</p>
					<ul>
						<li>
							{ __( 'OpenAI (GPT-4 Vision)', 'vmfa-ai-organizer' ) }
						</li>
						<li>
							{ __(
								'Azure OpenAI Service',
								'vmfa-ai-organizer'
							) }
						</li>
						<li>
							{ __( 'Anthropic (Claude)', 'vmfa-ai-organizer' ) }
						</li>
						<li>
							{ __( 'Google Gemini', 'vmfa-ai-organizer' ) }
						</li>
						<li>
							{ __(
								'Ollama (Local LLMs)',
								'vmfa-ai-organizer'
							) }
						</li>
						<li>{ __( 'xAI Grok', 'vmfa-ai-organizer' ) }</li>
						<li>{ __( 'Exo Cluster', 'vmfa-ai-organizer' ) }</li>
					</ul>
				</CardBody>
			</Card>
		</>
	);
}

export default ConfigurePage;
