export function roundToHour(date: Date): Date {
	const rounded = new Date(date);
	rounded.setUTCMinutes(0, 0, 0);
	return rounded;
}

export function hourlyTaskReminderFlow(webhookUrl: string) {
	return {
		name: 'Hourly task reminders',
		trigger: 'schedule',
		status: 'active',
		options: { cron: '0 * * * *' },
		operations: [{ type: 'request', position: 1, options: { url: webhookUrl, method: 'POST' } }],
	};
}
