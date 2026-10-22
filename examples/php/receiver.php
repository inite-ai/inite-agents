<?php
/**
 * INITE Agents webhook receiver for PHP 7.4+, no dependencies.
 *
 * Put it where your web server runs PHP and add its https address in the
 * INITE cabinet, tab For agents. Set the secret the cabinet showed you as the
 * environment variable INITE_WEBHOOK_SECRET (or define it below). Try it
 * locally with the built-in server:
 *
 *   INITE_WEBHOOK_SECRET=whsec_... php -S localhost:8787 receiver.php
 *
 * Every delivery is checked before its body is trusted:
 *
 *   INITE-Signature: t=<unix seconds>,v1=<hex HMAC-SHA256(secret, "<t>.<raw body>")>
 *
 * The HMAC is computed over the raw body (php://input), never a re-encoded
 * array. A t more than five minutes from now is refused. INITE-Webhook-Id is
 * the same on every retry of one event, so a repeat is acknowledged and
 * dropped. Answer 2xx within ten seconds; anything else is retried after 1,
 * 5, 30, 120 and 360 minutes.
 */

const INITE_TOLERANCE_S = 300;
const INITE_ORIGIN      = 'https://inite.ai';

/**
 * True when one of the header's v1 signatures matches the raw body and t is
 * within five minutes of now.
 */
function inite_verify_signature( string $raw_body, ?string $header, string $secret, ?int $now = null ): bool {
	if ( '' === $secret || null === $header || '' === $header ) {
		return false;
	}
	$t          = null;
	$signatures = array();
	foreach ( explode( ',', $header ) as $part ) {
		$kv = explode( '=', trim( $part ), 2 );
		if ( 2 !== count( $kv ) ) {
			continue;
		}
		if ( 't' === $kv[0] && ctype_digit( $kv[1] ) ) {
			$t = (int) $kv[1];
		} elseif ( 'v1' === $kv[0] && '' !== $kv[1] ) {
			$signatures[] = $kv[1];
		}
	}
	$now = null === $now ? time() : $now;
	if ( null === $t || abs( $now - $t ) > INITE_TOLERANCE_S ) {
		return false;
	}
	$want = hash_hmac( 'sha256', $t . '.' . $raw_body, $secret );
	foreach ( $signatures as $got ) {
		if ( hash_equals( $want, $got ) ) {
			return true;
		}
	}
	return false;
}

/**
 * Whether this event id is new. A marker file per id, for the example; keep
 * the ids in your database in production.
 */
function inite_first_time( string $id ): bool {
	if ( ! preg_match( '/^evt_[A-Za-z0-9_-]{1,64}$/', $id ) ) {
		return true;
	}
	$dir = sys_get_temp_dir() . '/inite-webhooks';
	if ( ! is_dir( $dir ) ) {
		mkdir( $dir, 0700, true );
	}
	// 'x' fails when the file exists, so two deliveries at once cannot both be first.
	$fh = @fopen( $dir . '/' . $id, 'x' );
	if ( false === $fh ) {
		return false;
	}
	fclose( $fh );
	return true;
}

/**
 * Tell INITE where an approved article was published. The address is built
 * here from the article id, never taken from the payload, so the site key
 * only ever goes to inite.ai. Returns the HTTP status.
 */
function inite_report_published( string $article_id, string $url, string $site_key ): int {
	$ch = curl_init( INITE_ORIGIN . '/api/site/v1/content/' . rawurlencode( $article_id ) . '/published' );
	curl_setopt_array(
		$ch,
		array(
			CURLOPT_POST           => true,
			CURLOPT_POSTFIELDS     => json_encode( array( 'url' => $url ) ),
			CURLOPT_HTTPHEADER     => array( 'Authorization: Bearer ' . $site_key, 'Content-Type: application/json' ),
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_FOLLOWLOCATION => false,
			CURLOPT_TIMEOUT        => 10,
		)
	);
	curl_exec( $ch );
	$status = (int) curl_getinfo( $ch, CURLINFO_RESPONSE_CODE );
	curl_close( $ch );
	return $status;
}

function inite_handle( array $event ): void {
	switch ( $event['event'] ?? '' ) {
		case 'facts.confirmed':
			// A new version of the facts: refresh whatever serves them.
			error_log( sprintf( 'facts.confirmed: %s is at version %d', $event['site'], $event['version'] ) );
			break;
		case 'content.approved':
			// The article exactly as the owner approved it: title, slug,
			// metaDescription, body (Markdown), html, lang, sources.
			error_log( sprintf( 'content.approved: "%s" for %s', $event['article']['title'], $event['site'] ) );
			// $url = create_post_in_your_cms( $event['article'] );
			// inite_report_published( $event['article']['id'], $url, getenv( 'INITE_SITE_KEY' ) );
			break;
	}
}

// ---- The request -----------------------------------------------------------

if ( 'POST' !== ( $_SERVER['REQUEST_METHOD'] ?? '' ) ) {
	http_response_code( 405 );
	header( 'Allow: POST' );
	exit;
}

$secret = (string) getenv( 'INITE_WEBHOOK_SECRET' );
$raw    = (string) file_get_contents( 'php://input' );
$header = $_SERVER['HTTP_INITE_SIGNATURE'] ?? null;

if ( ! inite_verify_signature( $raw, $header, $secret ) ) {
	http_response_code( 401 );
	echo "bad signature\n";
	exit;
}

$event = json_decode( $raw, true );
if ( ! is_array( $event ) ) {
	http_response_code( 400 );
	echo "bad json\n";
	exit;
}

$id = (string) ( $_SERVER['HTTP_INITE_WEBHOOK_ID'] ?? ( $event['id'] ?? '' ) );
if ( ! inite_first_time( $id ) ) {
	http_response_code( 200 );
	echo "already handled\n";
	exit;
}

http_response_code( 200 );
echo "ok\n";
// Under PHP-FPM, answer first and do the slow work (a CMS call) after.
if ( function_exists( 'fastcgi_finish_request' ) ) {
	fastcgi_finish_request();
}
inite_handle( $event );
