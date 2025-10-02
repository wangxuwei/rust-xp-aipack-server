import * as momentServer from "moment";
import moment, { Moment } from "moment";

const mom = moment || momentServer;

export function parseDateTime(value: string, format?: string): Moment | undefined {
	if (!value) {
		return;
	}

	const date = format ? mom(value, format, true) : mom(value);
	return date;
}

export function formatDateTime(date: Date | Moment | string, format?: string, zone = true): string | undefined {
	if (!date) {
		return;
	}

	const m = mom(date);
	if (!zone) {
		m.utcOffset(0);
	}
	const dateStr = format ? m.format(format) : m.utc().toISOString();
	return dateStr;
}

export function now(date?: Date | string): Moment {
	return mom(date ? date : new Date());
}

// returns a now formatted for database
export function nowTimestamp(date?: Date | string): string {
	return mom(date ? date : new Date())
		.utc()
		.toISOString();
}

export function nowDateString(date?: Date | string): string {
	return mom(date ? date : new Date())
		.utc()
		.hours(0)
		.minute(0)
		.seconds(0)
		.milliseconds(0)
		.toISOString();
}

export function fromNow(date: Date | Moment | string) {
	if (!date) {
		return;
	}

	let m: Moment = mom(date);
	if (typeof date == "string") {
		m = parseDateTime(date)!;
	}

	const diffDays = now().diff(m, "days");
	if (diffDays < 1) {
		return m.fromNow();
	} else if (diffDays == 1) {
		return "yesterday, " + m.format("ha") + ".";
	} else if (diffDays > 1) {
		return m.format("YYYY/MM/DD");
	}
}

export function timePassed(date: Date | Moment | string) {
	if (!date) {
		return;
	}

	let m: Moment = mom(date);
	if (typeof date == "string") {
		m = parseDateTime(date)!;
	}

	const diffSecs = now().diff(m, "seconds");
	if (diffSecs < 60) {
		return "Just now";
	} else if (diffSecs >= 60 && diffSecs < 3600) {
		const mins = Math.floor(diffSecs / 60);
		return `${mins} minute${mins == 1 ? "" : "s"}`;
	} else if (diffSecs >= 3600 && diffSecs < 3600 * 24) {
		const hours = Math.floor(diffSecs / 3600);
		return `${hours} hour${hours == 1 ? "" : "s"}`;
	} else {
		return formatDateTime(m, "YYYY/MM/DD");
	}
}

export function formatSeconds(time: number, sign: string = ":", showHour: boolean = false) {
	if (isNaN(time)) {
		return "00:00";
	}
	let hour = 0,
		min = 0,
		sec = 0;
	hour = Math.floor(time / 3600);
	min = Math.floor((time / 60) % 60);
	sec = Math.round(time % 60);

	// to make sure not happens 00:60
	if (sec == 60) {
		sec = 0;
		min += 1;
	}
	// to make sure not happens 00:60:00
	if (min == 60) {
		min = 0;
		hour += 1;
	}

	let hourStr = "";
	if (hour > 0) {
		hourStr = hour > 9 ? hour + sign : "0" + hour + sign;
	} else if (showHour) {
		hourStr = "00" + sign;
	}
	let minStr = min > 9 ? min : "0" + min;
	let secStr = sec > 9 ? sec : "0" + sec;
	return hourStr + minStr + sign + secStr;
}

// format HH:mm:ss
export function parseSeconds(time: string): number | null {
	if (!time) {
		return null;
	}
	if (!/^([0-9]{1,2}:)?([0-9]{1,2}:)?([0-9]{1,2})$/g.test(time)) {
		return null;
	}
	const values = time.split(":");

	if (values.length == 1) {
		return parseInt(values[0]);
	} else if (values.length == 2) {
		return parseInt(values[0]) * 60 + parseInt(values[1]);
	} else if (values.length == 3) {
		return parseInt(values[0]) * 3600 + parseInt(values[1]) * 60 + parseInt(values[2]);
	}

	return null;
}
