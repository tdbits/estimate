type Duration = {
    weeks: number,
    days: number,
    hours: number,
    minutes: number
}

export function convertToMinutes(duration: Duration): number {
    return (duration.weeks * 5 * 8 * 60) +
            (duration.days * 8 * 60) +
            (duration.hours * 60) +
            duration.minutes;
}

export function convertToDuration(duration: string): Duration {
    let weeks = 0;
    let days = 0;
    let hours = 0;
    let minutes = 0;

    const weeks_match = duration.match(/(\d+)w/);
    const days_match = duration.match(/(\d+)d/);
    const hours_match = duration.match(/(\d+)h/);
    const minutes_match = duration.match(/(\d+)m/);

    if (weeks_match !== null) {
        weeks = parseInt(weeks_match[1]);
    }
    if (days_match !== null) {
        days = parseInt(days_match[1]);
    }
    if (hours_match !== null) {
        hours = parseInt(hours_match[1]);
    }
    if (minutes_match !== null) {
        minutes = parseInt(minutes_match[1]);
    }

    return { weeks, days, hours, minutes };
}

export function convertMinutes(totalMinutes: number): Duration {
    const weeks = Math.floor(totalMinutes / 2400);
    const days = Math.floor((totalMinutes % 2400) / 480);
    const hours = Math.floor(((totalMinutes % 2400) % 480) / 60);
    const minutes = totalMinutes % 60;

    return { weeks, days, hours, minutes };
}

export function durationToString(duration: Duration): string {
    const components = [];

    if (duration.weeks > 0) {
        components.push(`${duration.weeks}w`);
    }
    if (duration.days > 0) {
        components.push(`${duration.days}d`);
    }
    if (duration.hours > 0) {
        components.push(`${duration.hours}h`);
    }
    if (duration.minutes > 0) {
        components.push(`${duration.minutes}m`);
    }

    return components.join("");
}