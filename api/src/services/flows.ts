import { InvalidPayloadError } from '@directus/errors';
import type { AbstractServiceOptions, FlowRaw, Item, MutationOptions, PrimaryKey } from '@directus/types';

import { getFlowManager } from '../flows.js';
import { roundToHour } from '../utils/flow-schedule.js';
import { ItemsService } from './items.js';

export class FlowsService extends ItemsService<FlowRaw> {
	constructor(options: AbstractServiceOptions) {
		super('directus_flows', options);
	}

	override async createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		const result = await super.createOne(data, opts);

		const flowManager = getFlowManager();
		await flowManager.reload();

		return result;
	}

	override async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		const result = await super.updateMany(keys, data, opts);

		const flowManager = getFlowManager();
		await flowManager.reload();

		return result;
	}


	async triggerOne(key: PrimaryKey, triggerTime = new Date()) {
		const flow = await this.readOne(key, { fields: ['*', 'operations.*'] });

		if (!flow) {
			throw new InvalidPayloadError({ reason: 'Flow not found' });
		}

		if (flow['status'] === 'inactive') {
			return { executed: false, reason: 'flow_inactive' };
		}

		const executionId = crypto.randomUUID();
		const triggerHour = roundToHour(triggerTime);
		const dueBefore = new Date(triggerHour.getTime() + 24 * 60 * 60 * 1000);
		let webhook_count = 0;

		const tasks = await new ItemsService('tasks', { knex: this.knex, schema: this.schema, accountability: this.accountability }).readByQuery({
			filter: { due_at: { _between: [triggerHour.toISOString(), dueBefore.toISOString()] } },
			limit: -1,
		});

		const operations = ((flow as Record<string, any>)['operations'] ?? []).sort((a: any, b: any) => a['position'] - b['position']);
		const webhook = operations.find((operation: Record<string, any>) => operation['type'] === 'request' || operation['type'] === 'webhook');

		for (const task of tasks) {
			const dedupKey = `${key}:${task['id']}:${triggerHour.toISOString()}`;
			const inserted = await this.knex('directus_flow_dedup').insert({ key: dedupKey, flow: key, created_at: new Date() }).onConflict('key').ignore();
			const url = webhook?.options?.url;
			const method = webhook?.options?.method ?? 'POST';
			if (inserted.length === 0 || !url) continue;

			await fetch(url, {
				method,
				body: JSON.stringify(task),
				headers: { 'content-type': 'application/json' },
			});
			webhook_count++;
		}

		return { executed: true, execution_id: executionId, webhook_count };
	}

	override async deleteMany(keys: PrimaryKey[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		// this is to prevent foreign key constraint error on directus_operations resolve/reject during cascade deletion
		await this.knex('directus_operations').update({ resolve: null, reject: null }).whereIn('flow', keys);

		const result = await super.deleteMany(keys, opts);

		const flowManager = getFlowManager();
		await flowManager.reload();

		return result;
	}
}
