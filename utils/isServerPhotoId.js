/**
 * True only for a valid server photo id — a positive integer (or a string
 * of digits, which the Laravel `integer` rule coerces and accepts).
 *
 * Local images carry ids that are NOT server photo ids: camera-roll photos use
 * a local counter and onboarding photos use a string like "onboarding_<ts>_<rnd>".
 * Posting tags with one of those yields a 422 "The photo id field must be an
 * integer." (string/null) or silently tags the wrong photo (small integer).
 * Guard the tag-post flow with this so only real server ids are sent.
 */
export default function isServerPhotoId(id) {
    if (typeof id === 'number') {
        return Number.isInteger(id) && id > 0;
    }
    if (typeof id === 'string') {
        return /^[1-9]\d*$/.test(id);
    }
    return false;
}
