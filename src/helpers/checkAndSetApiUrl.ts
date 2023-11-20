import {useConfigStore} from '@/stores/config'

const API_DEFAULT_PORT = '3456'

export const ERROR_NO_API_URL = 'noApiUrlProvided'

export class NoApiUrlProvidedError extends Error {
	constructor() {
		super()
		this.message = 'No API URL provided'
		this.name = 'NoApiUrlProvidedError'
	}
}

export class InvalidApiUrlProvidedError extends Error {
	constructor() {
		super()
		this.message = 'The provided API URL is invalid.'
		this.name = 'InvalidApiUrlProvidedError'
	}
}

export const checkAndSetApiUrl = (url: string | undefined | null): Promise<string> => {
	if (url === '' || url === null || typeof url === 'undefined') {
		throw new NoApiUrlProvidedError()
	}

	if (url.startsWith('/')) {
		url = window.location.host + url
	}

	// Check if the url has a http prefix
	if (
		!url.startsWith('http://') &&
		!url.startsWith('https://')
	) {
		url = `${window.location.protocol}//${url}`
	}
	
	let urlToCheck: URL
	try {
		urlToCheck = new URL(url)
	} catch (e) {
		throw new InvalidApiUrlProvidedError()
	}

	const origUrlToCheck = urlToCheck

	const oldUrl = window.API_URL
	window.API_URL = urlToCheck.toString()

	const configStore = useConfigStore()
	const updateConfig = () => configStore.update()

	// Check if the api is reachable at the provided url
	return updateConfig()
		.catch(e => {
			// Check if it is reachable at /api/v1 and http
			if (
				!urlToCheck.pathname.endsWith('/api/v1') &&
				!urlToCheck.pathname.endsWith('/api/v1/')
			) {
				urlToCheck.pathname = `${urlToCheck.pathname}api/v1`
				window.API_URL = urlToCheck.toString()
				return updateConfig()
			}
			throw e
		})
		.catch(e => {
			// Check if it is reachable at /api/v1 and https
			urlToCheck.pathname = origUrlToCheck.pathname
			if (
				!urlToCheck.pathname.endsWith('/api/v1') &&
				!urlToCheck.pathname.endsWith('/api/v1/')
			) {
				urlToCheck.pathname = `${urlToCheck.pathname}api/v1`
				window.API_URL = urlToCheck.toString()
				return updateConfig()
			}
			throw e
		})
		.catch(e => {
			// Check if it is reachable at port API_DEFAULT_PORT and https
			if (urlToCheck.port !== API_DEFAULT_PORT) {
				urlToCheck.port = API_DEFAULT_PORT
				window.API_URL = urlToCheck.toString()
				return updateConfig()
			}
			throw e
		})
		.catch(e => {
			// Check if it is reachable at :API_DEFAULT_PORT and /api/v1
			urlToCheck.pathname = origUrlToCheck.pathname
			if (
				!urlToCheck.pathname.endsWith('/api/v1') &&
				!urlToCheck.pathname.endsWith('/api/v1/')
			) {
				urlToCheck.pathname = `${urlToCheck.pathname}api/v1`
				window.API_URL = urlToCheck.toString()
				return updateConfig()
			}
			throw e
		})
		.catch(e => {
			window.API_URL = oldUrl
			throw e
		})
		.then(success => {
			if (success) {
				localStorage.setItem('API_URL', window.API_URL)
				return window.API_URL
			}

			throw new InvalidApiUrlProvidedError()
		})
}
