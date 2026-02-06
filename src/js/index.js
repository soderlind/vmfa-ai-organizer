/**
 * Virtual Media Folders AI Organizer - Admin Scripts
 *
 * @package
 */

import { useState, useEffect, useCallback } from '@wordpress/element';
import { createRoot } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

import { AddonShell, StatsCard } from '@vmfo/shared';
import { useScanStatus } from './hooks/useScanStatus';
import {
	OverviewPage,
	DashboardPage,
	ConfigurePage,
	ActionsPage,
	LogsPage,
} from './pages';

import './styles/admin.scss';

/**
 * Main AI Organizer App using AddonShell.
 *
 * @return {JSX.Element} The app component.
 */
function AiOrganizerApp() {
	const [ mode, setMode ] = useState( 'organize_unassigned' );
	const [ dryRun, setDryRun ] = useState( true );
	const [ stats, setStats ] = useState( null );
	const [ enabled, setEnabled ] = useState( true );

	const {
		status,
		isLoading,
		error,
		startScan,
		cancelScan,
		resetScan,
		applyCachedResults,
		refresh,
	} = useScanStatus();

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
			// Ignore fetch errors.
		}
	}, [] );

	useEffect( () => {
		fetchStats();
	}, [ fetchStats ] );

	/**
	 * Handle start scan.
	 */
	const handleStartScan = async () => {
		await startScan( mode, dryRun );
	};

	/**
	 * Handle apply cached results.
	 */
	const handleApplyCached = async () => {
		const result = await applyCachedResults( mode );
		await fetchStats();
		return result;
	};

	/**
	 * Handle reset.
	 */
	const handleReset = async () => {
		await resetScan();
		await fetchStats();
	};

	/**
	 * Handle refresh.
	 */
	const handleRefresh = () => {
		fetchStats();
		refresh();
	};

	// Build KPI stats for AddonShell
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
		: [];

	return (
		<AddonShell
			addonKey="ai-organizer"
			addonLabel={ __( 'AI Organizer', 'vmfa-ai-organizer' ) }
			enabled={ enabled }
			stats={ kpiStats }
			overviewContent={ <OverviewPage /> }
			dashboardContent={
				<DashboardPage
					status={ status }
					isLoading={ isLoading }
					onCancel={ cancelScan }
					onReset={ handleReset }
				/>
			}
			configureContent={
				<ConfigurePage
					mode={ mode }
					setMode={ setMode }
					dryRun={ dryRun }
					setDryRun={ setDryRun }
				/>
			}
			actionsContent={
				<ActionsPage
					status={ status }
					stats={ stats }
					mode={ mode }
					dryRun={ dryRun }
					isLoading={ isLoading }
					onStartScan={ handleStartScan }
					onCancelScan={ cancelScan }
					onReset={ handleReset }
					onApplyCached={ handleApplyCached }
					onRefresh={ handleRefresh }
				/>
			}
			logsContent={ <LogsPage /> }
		/>
	);
}

/**
 * Update visibility of provider-specific settings fields.
 *
 * @param {string} provider - The selected provider key.
 */
function updateProviderFields(provider) {
	document.querySelectorAll('.vmfa-provider-field').forEach((field) => {
		const row = field.closest('tr');
		if (row) {
			row.classList.add('vmfa-provider-row');
			const fieldProvider = field.dataset.provider;
			if (fieldProvider === provider) {
				row.classList.add('vmfa-provider-active');
			} else {
				row.classList.remove('vmfa-provider-active');
			}
		}
	});

	// Update Azure fields visibility based on openai_type when OpenAI is selected.
	if (provider === 'openai') {
		updateAzureFields();
	}
}

/**
 * Update visibility of Azure-specific fields based on openai_type selector.
 */
function updateAzureFields() {
	const openaiTypeSelect = document.getElementById('vmfa_openai_type');
	if (!openaiTypeSelect) {
		return;
	}

	const isAzure = openaiTypeSelect.value === 'azure';

	document.querySelectorAll('.vmfa-azure-field').forEach((field) => {
		const row = field.closest('tr');
		if (row) {
			// Mark as Azure row for CSS targeting
			row.classList.add('vmfa-azure-row');
			if (isAzure) {
				row.classList.add('vmfa-azure-active');
			} else {
				row.classList.remove('vmfa-azure-active');
			}
		}
	});
}

/**
 * Initialize the provider field toggle.
 */
function initProviderToggle() {
	const providerSelect = document.getElementById('vmfa_ai_provider');
	if (providerSelect) {
		// Set initial state.
		updateProviderFields(providerSelect.value);

		// Listen for changes.
		providerSelect.addEventListener('change', (e) => {
			updateProviderFields(e.target.value);
		});
	}

	// Listen for OpenAI type changes.
	const openaiTypeSelect = document.getElementById('vmfa_openai_type');
	if (openaiTypeSelect) {
		openaiTypeSelect.addEventListener('change', () => {
			updateAzureFields();
		});
	}
}

/**
 * Initialize the AI Organizer panel.
 */
function initAiOrganizer() {
	const container = document.getElementById('vmfa-ai-organizer-app');

	if (container) {
		const root = createRoot(container);
		root.render(<AiOrganizerApp />);
	}
}

/**
 * Handle settings form visibility based on subtab.
 *
 * @param {string} subtab - The active subtab.
 */
function updateSettingsFormVisibility(subtab) {
	const settingsForm = document.querySelector('.vmfa-settings-forms');
	if (settingsForm) {
		settingsForm.style.display = subtab === 'configure' ? '' : 'none';
	}
}

/**
 * Initialize settings form visibility listener.
 */
function initSettingsFormToggle() {
	// Listen for subtab changes from AddonShell.
	window.addEventListener('vmfo-subtab-change', (e) => {
		if (e.detail?.addonKey === 'ai-organizer') {
			updateSettingsFormVisibility(e.detail.tabId);
		}
	});

	// Set initial visibility based on URL.
	const params = new URLSearchParams(window.location.search);
	const subtab = params.get('subtab') || 'overview';
	updateSettingsFormVisibility(subtab);
}

// Initialize when DOM is ready.
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => {
		initProviderToggle();
		initAiOrganizer();
		initSettingsFormToggle();
	});
} else {
	initProviderToggle();
	initAiOrganizer();
	initSettingsFormToggle();}