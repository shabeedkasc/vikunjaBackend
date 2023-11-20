import {calculateDayInterval} from './calculateDayInterval'
import {calculateNearestHours} from './calculateNearestHours'
import {replaceAll} from '../replaceAll'

interface dateParseResult {
	newText: string,
	date: Date | null,
}

interface dateFoundResult {
	foundText: string | null,
	date: Date | null,
}

const monthsRegexGroup = '(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)'

function matchesDateExpr(text: string, dateExpr: string): boolean {
	return text.match(new RegExp('(^| )' + dateExpr, 'g')) !== null
}

export const parseDate = (text: string, now: Date = new Date()): dateParseResult => {
	const lowerText: string = text.toLowerCase()

	if (matchesDateExpr(lowerText, 'today')) {
		return addTimeToDate(text, getDateFromInterval(calculateDayInterval('today')), 'today')
	}
	if (matchesDateExpr(lowerText, 'tomorrow')) {
		return addTimeToDate(text, getDateFromInterval(calculateDayInterval('tomorrow')), 'tomorrow')
	}
	if (matchesDateExpr(lowerText, 'next monday')) {
		return addTimeToDate(text, getDateFromInterval(calculateDayInterval('nextMonday')), 'next monday')
	}
	if (matchesDateExpr(lowerText, 'this weekend')) {
		return addTimeToDate(text, getDateFromInterval(calculateDayInterval('thisWeekend')), 'this weekend')
	}
	if (matchesDateExpr(lowerText, 'later this week')) {
		return addTimeToDate(text, getDateFromInterval(calculateDayInterval('laterThisWeek')), 'later this week')
	}
	if (matchesDateExpr(lowerText, 'later next week')) {
		return addTimeToDate(text, getDateFromInterval(calculateDayInterval('laterNextWeek')), 'later next week')
	}
	if (matchesDateExpr(lowerText, 'next week')) {
		return addTimeToDate(text, getDateFromInterval(calculateDayInterval('nextWeek')), 'next week')
	}
	if (matchesDateExpr(lowerText, 'next month')) {
		const date: Date = new Date()
		date.setDate(1)
		date.setMonth(date.getMonth() + 1)
		date.setHours(calculateNearestHours(date))
		date.setMinutes(0)
		date.setSeconds(0)

		return addTimeToDate(text, date, 'next month')
	}
	if (matchesDateExpr(lowerText, 'end of month')) {
		const curDate: Date = new Date()
		const date: Date = new Date(curDate.getFullYear(), curDate.getMonth() + 1, 0)
		date.setHours(calculateNearestHours(date))
		date.setMinutes(0)
		date.setSeconds(0)

		return addTimeToDate(text, date, 'end of month')
	}

	let parsed = getDateFromWeekday(text)
	if (parsed.date !== null) {
		return addTimeToDate(text, parsed.date, parsed.foundText)
	}

	parsed = getDayFromText(text)
	if (parsed.date !== null) {
		const month = getMonthFromText(text, parsed.date)
		return addTimeToDate(text, month.date, parsed.foundText)
	}

	parsed = getDateFromTextIn(text, now)
	if (parsed.date !== null) {
		return addTimeToDate(text, parsed.date, parsed.foundText)
	}

	parsed = getDateFromText(text)

	if (parsed.date === null) {
		return {
			newText: replaceAll(text, parsed.foundText, ''),
			date: parsed.date,
		}
	}

	return addTimeToDate(text, parsed.date, parsed.foundText)
}

const addTimeToDate = (text: string, date: Date, previousMatch: string | null): dateParseResult => {
	previousMatch = previousMatch?.trim() || ''
	text = replaceAll(text, previousMatch, '')
	if (previousMatch === null) {
		return {
			newText: text,
			date: null,
		}
	}

	const timeRegex = ' (at|@) ([0-9][0-9]?(:[0-9][0-9]?)?( ?(a|p)m)?)'
	const matcher = new RegExp(timeRegex, 'ig')
	const results = matcher.exec(text)

	if (results !== null) {
		const time = results[2]
		const parts = time.split(':')
		let hours = parseInt(parts[0])
		let minutes = 0
		if (time.endsWith('pm')) {
			hours += 12
		}
		if (parts.length > 1) {
			minutes = parseInt(parts[1])
		}

		date.setHours(hours)
		date.setMinutes(minutes)
		date.setSeconds(0)
	}

	const replace = results !== null ? results[0] : previousMatch
	return {
		newText: replaceAll(text, replace, ''),
		date: date,
	}
}

export const getDateFromText = (text: string, now: Date = new Date()) => {
	const fullDateRegex = /(^| )([0-9][0-9]?\/[0-9][0-9]?\/[0-9][0-9]([0-9][0-9])?|[0-9][0-9][0-9][0-9]\/[0-9][0-9]?\/[0-9][0-9]?|[0-9][0-9][0-9][0-9]-[0-9][0-9]?-[0-9][0-9]?)/ig

	// 1. Try parsing the text as a "usual" date, like 2021-06-24 or 06/24/2021
	let results: string[] | null = fullDateRegex.exec(text)
	let result: string | null = results === null ? null : results[0]
	let foundText: string | null = result
	let containsYear = true
	if (result === null) {
		// 2. Try parsing the date as something like "jan 21" or "21 jan"
		const monthRegex = new RegExp(`(^| )(${monthsRegexGroup} [0-9][0-9]?|[0-9][0-9]? ${monthsRegexGroup})`, 'ig')
		results = monthRegex.exec(text)
		result = results === null ? null : `${results[0]} ${now.getFullYear()}`.trim()
		foundText = results === null ? '' : results[0].trim()
		containsYear = false

		if (result === null) {
			// 3. Try parsing the date as "27/01" or "01/27"
			const monthNumericRegex = /(^| )([0-9][0-9]?\/[0-9][0-9]?)/ig
			results = monthNumericRegex.exec(text)

			// Put the year before or after the date, depending on what works
			result = results === null ? null : `${now.getFullYear()}/${results[0]}`
			if (result === null) {
				return {
					foundText,
					date: null,
				}
			}

			foundText = results === null ? '' : results[0]
			if (result === null || isNaN(new Date(result).getTime())) {
				result = results === null ? null : `${results[0]}/${now.getFullYear()}`
			}
			if (result === null || (isNaN(new Date(result).getTime()) && foundText !== '')) {
				const parts = foundText.split('/')
				result = `${parts[1]}/${parts[0]}/${now.getFullYear()}`
			}
		}
	}

	if (result === null) {
		return {
			foundText,
			date: null,
		}
	}

	const date = new Date(result)
	if (isNaN(date.getTime())) {
		return {
			foundText,
			date: null,
		}
	}

	if (!containsYear && date < now) {
		date.setFullYear(date.getFullYear() + 1)
	}

	return {
		foundText,
		date,
	}
}

export const getDateFromTextIn = (text: string, now: Date = new Date()) => {
	const regex = /(in [0-9]+ (hours?|days?|weeks?|months?))/ig
	const results = regex.exec(text)
	if (results === null) {
		return {
			foundText: '',
			date: null,
		}
	}

	const foundText: string = results[0]
	const date = new Date(now)
	const parts = foundText.split(' ')
	switch (parts[2]) {
		case 'hours':
		case 'hour':
			date.setHours(date.getHours() + parseInt(parts[1]))
			break
		case 'days':
		case 'day':
			date.setDate(date.getDate() + parseInt(parts[1]))
			break
		case 'weeks':
		case 'week':
			date.setDate(date.getDate() + parseInt(parts[1]) * 7)
			break
		case 'months':
		case 'month':
			date.setMonth(date.getMonth() + parseInt(parts[1]))
			break
	}

	return {
		foundText,
		date,
	}
}

const getDateFromWeekday = (text: string): dateFoundResult => {
	const matcher = /(^| )(next )?(monday|mon|tuesday|tue|wednesday|wed|thursday|thu|friday|fri|saturday|sat|sunday|sun)($| )/g
	const results: string[] | null = matcher.exec(text.toLowerCase()) // The i modifier does not seem to work.
	if (results === null) {
		return {
			foundText: null,
			date: null,
		}
	}

	const date: Date = new Date()
	const currentDay: number = date.getDay()
	let day = 0

	switch (results[3]) {
		case 'mon':
		case 'monday':
			day = 1
			break
		case 'tue':
		case 'tuesday':
			day = 2
			break
		case 'wed':
		case 'wednesday':
			day = 3
			break
		case 'thu':
		case 'thursday':
			day = 4
			break
		case 'fri':
		case 'friday':
			day = 5
			break
		case 'sat':
		case 'saturday':
			day = 6
			break
		case 'sun':
		case 'sunday':
			day = 0
			break
		default:
			return {
				foundText: null,
				date: null,
			}
	}

	const distance: number = (day + 7 - currentDay) % 7
	date.setDate(date.getDate() + distance)

	// This a space at the end of the found text to not break parsing suffix strings like "at 14:00" in cases where the 
	// matched string comes with a space at the end (last part of the regex).
	let foundText = results[0]
	if (foundText.endsWith(' ')) {
		foundText = foundText.slice(0, foundText.length - 1)
	}

	return {
		foundText: foundText,
		date: date,
	}
}

const getDayFromText = (text: string) => {
	const matcher = /(^| )(([1-2][0-9])|(3[01])|(0?[1-9]))(st|nd|rd|th|\.)($| )/ig
	const results = matcher.exec(text)
	if (results === null) {
		return {
			foundText: null,
			date: null,
		}
	}

	const now = new Date()
	const date = new Date(now)
	const day = parseInt(results[0])
	date.setDate(day)

	// If the parsed day is the 31st (or 29+ and the next month is february) but the next month only has 30 days, 
	// setting the day to 31 will "overflow" the date to the next month, but the first.
	// This would look like a very weired bug. Now, to prevent that, we check if the day is the same as parsed after 
	// setting it for the first time and set it again if it isn't - that would mean the month overflowed.
	while (date < now) {
		date.setMonth(date.getMonth() + 1)
	}

	if (date.getDate() !== day) {
		date.setDate(day)
	}

	return {
		foundText: results[0],
		date: date,
	}
}

const getMonthFromText = (text: string, date: Date) => {
	const matcher = new RegExp(monthsRegexGroup, 'ig')
	const results = matcher.exec(text)

	if (results === null) {
		return {
			newText: text,
			date,
		}
	}

	const fullDate = new Date(`${results[0]} 1 ${(new Date()).getFullYear()}`)
	date.setMonth(fullDate.getMonth())
	return {
		newText: replaceAll(text, results[0], ''),
		date,
	}
}

const getDateFromInterval = (interval: number): Date => {
	const newDate = new Date()
	newDate.setDate(newDate.getDate() + interval)
	newDate.setHours(calculateNearestHours(newDate), 0, 0)

	return newDate
}
