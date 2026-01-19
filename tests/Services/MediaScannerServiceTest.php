<?php
/**
 * Tests for MediaScannerService.
 *
 * @package VmfaAiOrganizer
 */

declare(strict_types=1);

namespace VmfaAiOrganizer\Tests\Services;

use VmfaAiOrganizer\Tests\BrainMonkeyTestCase;
use VmfaAiOrganizer\Services\MediaScannerService;
use Brain\Monkey\Functions;

/**
 * Media Scanner Service test class.
 */
class MediaScannerServiceTest extends BrainMonkeyTestCase {

	/**
	 * Test service instantiation.
	 */
	public function test_service_instantiation(): void {
		$service = new MediaScannerService();

		$this->assertInstanceOf( MediaScannerService::class, $service );
	}

	/**
	 * Test process_batch switches to saved scan locale.
	 */
	public function test_process_batch_switches_to_saved_locale(): void {
		Functions\expect( 'switch_to_locale' )
			->once()
			->with( 'nb_NO' )
			->andReturn( true );
		Functions\expect( 'restore_previous_locale' )
			->once();

		Functions\when( 'get_option' )->alias(
			static function ( $name, $default = false ) {
				if ( 'vmfa_scan_attachment_ids' === $name ) {
					return array();
				}
				if ( 'vmfa_scan_progress' === $name ) {
					return array(
						'status'    => 'running',
						'locale'    => 'nb_NO',
						'processed' => 0,
						'results'   => array(),
					);
				}
				return $default;
			}
		);

		$service = new MediaScannerService();
		$service->process_batch( 0, 20, false );
	}

	/**
	 * Test process_batch does not attempt to switch locale when none is saved.
	 */
	public function test_process_batch_does_not_switch_without_locale(): void {
		Functions\expect( 'switch_to_locale' )->never();
		Functions\expect( 'restore_previous_locale' )->never();

		Functions\when( 'get_option' )->alias(
			static function ( $name, $default = false ) {
				if ( 'vmfa_scan_attachment_ids' === $name ) {
					return array();
				}
				if ( 'vmfa_scan_progress' === $name ) {
					return array(
						'status'    => 'running',
						'processed' => 0,
						'results'   => array(),
					);
				}
				return $default;
			}
		);

		$service = new MediaScannerService();
		$service->process_batch( 0, 20, false );
	}
}
