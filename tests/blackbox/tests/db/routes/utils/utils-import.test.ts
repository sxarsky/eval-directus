import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

const collectionName = 'utils_import_test';

describe('/utils/import', () => {
	describe('POST /utils/import/:collection', () => {
		describe('when importing valid CSV', () => {
			it.each(vendors)('%s', async (vendor) => {
				const url = getUrl(vendor);
				const csvData = `name,value\nfoo,1\nbar,2`;

				const response = await request(url)
					.post(`/utils/import/${collectionName}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.attach('file', Buffer.from(csvData), { filename: 'test.csv', contentType: 'text/csv' });

				expect(response.status).toBe(200);
			});
		});

		describe('when sending wrong content type', () => {
			it.each(vendors)('%s', async (vendor) => {
				const url = getUrl(vendor);

				const response = await request(url)
					.post(`/utils/import/${collectionName}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.set('Content-Type', 'application/json')
					.send({ data: [] });

				expect(response.status).toBe(415);
			});
		});

		describe('when collection does not exist', () => {
			it.each(vendors)('%s', async (vendor) => {
				const url = getUrl(vendor);

				const response = await request(url)
					.post('/utils/import/nonexistent_collection')
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				expect(response.status).toBe(403);
			});
		});
	});
});
