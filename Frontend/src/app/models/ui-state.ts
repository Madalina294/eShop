/**
 * The four states every data-driven view can be in. Components expose this
 * instead of a bare `loading` boolean, so an empty list and a failed request
 * stop looking identical to the user.
 */
export type ViewState = 'loading' | 'ready' | 'empty' | 'error';
