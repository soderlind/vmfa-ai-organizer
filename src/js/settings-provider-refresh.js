/**
 * Provider model refresh scripts for Ollama and Exo AI providers.
 *
 * Reads configuration from window.vmfaProviderConfig.
 *
 * @package VmfaAiOrganizer
 * @since 1.1.1
 */
( function () {
	var config = window.vmfaProviderConfig || {};

	// Ollama model refresh.
	function refreshOllamaModels() {
		var ollamaUrlField = document.getElementById( 'vmfa_ollama_url' );
		var ollamaModelField = document.getElementById( 'vmfa_ollama_model' );
		var ollamaRefreshBtn = document.getElementById(
			'vmfa-ollama-refresh-models'
		);

		var endpoint = ollamaUrlField ? ollamaUrlField.value.trim() : '';
		if ( ! endpoint ) {
			alert( config.i18n.enterOllamaUrl || 'Please enter the Ollama URL first.' );
			return;
		}

		if ( ollamaRefreshBtn ) {
			ollamaRefreshBtn.disabled = true;
		}

		fetch( config.ollamaModelsUrl || '', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': config.nonce || '',
			},
			body: JSON.stringify( { endpoint: endpoint } ),
		} )
			.then( function ( response ) {
				return response.json();
			} )
			.then( function ( data ) {
				if (
					data.models &&
					Array.isArray( data.models ) &&
					ollamaModelField
				) {
					var currentValue = ollamaModelField.value;
					ollamaModelField.innerHTML = '';

					if ( data.models.length === 0 ) {
						var opt = document.createElement( 'option' );
						opt.value = '';
						opt.textContent = config.i18n.noModels || '— No models available —';
						ollamaModelField.appendChild( opt );
					} else {
						data.models.forEach( function ( model ) {
							var opt = document.createElement( 'option' );
							opt.value = model.id || model;
							opt.textContent = model.name || model.id || model;
							if ( opt.value === currentValue ) {
								opt.selected = true;
							}
							ollamaModelField.appendChild( opt );
						} );
					}
				} else if ( data.error ) {
					alert(
						( config.i18n.fetchFailed || 'Failed to fetch models:' ) +
							' ' +
							data.error
					);
				}
			} )
			.catch( function ( e ) {
				alert(
					( config.i18n.fetchFailed || 'Failed to fetch models:' ) +
						' ' +
						e.message
				);
			} )
			.finally( function () {
				if ( ollamaRefreshBtn ) {
					ollamaRefreshBtn.disabled = false;
				}
			} );
	}

	// Exo health check.
	function checkExoHealth() {
		var exoEndpointField = document.getElementById( 'vmfa_exo_endpoint' );
		var exoHealthIndicator = document.getElementById(
			'vmfa-exo-health-indicator'
		);

		var endpoint = exoEndpointField ? exoEndpointField.value.trim() : '';
		if ( ! endpoint ) {
			if ( exoHealthIndicator ) {
				exoHealthIndicator.textContent = '';
			}
			return;
		}

		if ( exoHealthIndicator ) {
			exoHealthIndicator.textContent = '\u23F3';
		}

		fetch( config.exoHealthUrl || '', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': config.nonce || '',
			},
			body: JSON.stringify( { endpoint: endpoint } ),
		} )
			.then( function ( response ) {
				return response.json();
			} )
			.then( function ( data ) {
				if ( exoHealthIndicator ) {
					exoHealthIndicator.textContent =
						data.status === 'ok' ? '\u2705' : '\u274C';
					exoHealthIndicator.title =
						data.status === 'ok'
							? 'Connected'
							: data.message || 'Connection failed';
				}
			} )
			.catch( function ( e ) {
				if ( exoHealthIndicator ) {
					exoHealthIndicator.textContent = '\u274C';
					exoHealthIndicator.title = 'Connection failed: ' + e.message;
				}
			} );
	}

	// Exo model refresh.
	function refreshExoModels() {
		var exoEndpointField = document.getElementById( 'vmfa_exo_endpoint' );
		var exoModelField = document.getElementById( 'vmfa_exo_model' );
		var exoRefreshBtn = document.getElementById( 'vmfa-exo-refresh-models' );

		var endpoint = exoEndpointField ? exoEndpointField.value.trim() : '';
		if ( ! endpoint ) {
			alert( config.i18n.enterExoUrl || 'Please enter the Exo endpoint first.' );
			return;
		}

		if ( exoRefreshBtn ) {
			exoRefreshBtn.disabled = true;
		}

		fetch( config.exoModelsUrl || '', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': config.nonce || '',
			},
			body: JSON.stringify( { endpoint: endpoint } ),
		} )
			.then( function ( response ) {
				return response.json();
			} )
			.then( function ( data ) {
				if (
					data.models &&
					Array.isArray( data.models ) &&
					exoModelField
				) {
					var currentValue = exoModelField.value;
					exoModelField.innerHTML = '';

					if ( data.models.length === 0 ) {
						var opt = document.createElement( 'option' );
						opt.value = '';
						opt.textContent = config.i18n.noModels || '— No models available —';
						exoModelField.appendChild( opt );
					} else {
						data.models.forEach( function ( model ) {
							var opt = document.createElement( 'option' );
							opt.value = model.id || model;
							opt.textContent = model.name || model.id || model;
							if ( opt.value === currentValue ) {
								opt.selected = true;
							}
							exoModelField.appendChild( opt );
						} );
					}

					checkExoHealth();
				} else if ( data.error ) {
					alert(
						( config.i18n.fetchFailed || 'Failed to fetch models:' ) +
							' ' +
							data.error
					);
				}
			} )
			.catch( function ( e ) {
				alert(
					( config.i18n.fetchFailed || 'Failed to fetch models:' ) +
						' ' +
						e.message
				);
			} )
			.finally( function () {
				if ( exoRefreshBtn ) {
					exoRefreshBtn.disabled = false;
				}
			} );
	}

	// Bind event listeners.
	var ollamaRefreshBtn = document.getElementById(
		'vmfa-ollama-refresh-models'
	);
	var exoCheckBtn = document.getElementById( 'vmfa-exo-check-connection' );
	var exoRefreshBtn = document.getElementById( 'vmfa-exo-refresh-models' );

	if ( ollamaRefreshBtn ) {
		ollamaRefreshBtn.addEventListener( 'click', refreshOllamaModels );
	}
	if ( exoCheckBtn ) {
		exoCheckBtn.addEventListener( 'click', checkExoHealth );
	}
	if ( exoRefreshBtn ) {
		exoRefreshBtn.addEventListener( 'click', refreshExoModels );
	}
} )();
