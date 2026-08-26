import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import SearchInput from './search-input.vue';
import { ClickOutside } from '@/__utils__/click-outside';
import { Tooltip } from '@/__utils__/tooltip';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';

const global: GlobalMountOptions = {
	stubs: {
		VIcon: true,
	},
	plugins: [
		i18n,
		createTestingPinia({
			createSpy: vi.fn,
		}),
	],
	directives: {
		'click-outside': ClickOutside,
		tooltip: Tooltip,
	},
	provide: {
		'main-element': document.body,
	},
};

describe('Component', () => {
	it('should mount', () => {
		const wrapper = mount(SearchInput, {
			props: {
				modelValue: '',
			},
			global,
		});

		expect(wrapper.exists()).toBe(true);
	});

	it('should render action buttons disabled when disabled', () => {
		const wrapper = mount(SearchInput, {
			props: {
				modelValue: 'test',
				disabled: true,
			},
			global,
		});

		expect(wrapper.find('.search-input').classes()).toContain('disabled');

		expect(wrapper.find('v-icon-stub.icon-search').attributes('disabled')).toBe('true');
		expect(wrapper.find('v-icon-stub.icon-filter').attributes('disabled')).toBe('true');
		expect(wrapper.find('v-icon-stub.icon-clear').attributes('disabled')).toBe('true');

		expect(wrapper.find('input').attributes('disabled')).toBe('');
	});

	it('should not render the search results popover when modelValue is empty', () => {
		const wrapper = mount(SearchInput, {
			props: {
				modelValue: '',
			},
			global,
		});

		expect(wrapper.find('[data-testid="search-results"]').exists()).toBe(false);
	});

	it('should render matching suggestions in a listbox after an input event', async () => {
		const wrapper = mount(SearchInput, {
			props: {
				modelValue: 'se',
			},
			global,
		});

		await wrapper.find('input').trigger('input');

		expect(wrapper.find('[data-testid="search-results"]').exists()).toBe(true);

		const options = wrapper.findAll('[data-testid="search-result-item"]');

		expect(options).toHaveLength(1);
		expect(options[0]!.text()).toBe('saved search');
	});

	it('should apply roving tabindex to the rendered options', async () => {
		const wrapper = mount(SearchInput, {
			props: {
				modelValue: 'e',
			},
			global,
		});

		await wrapper.find('input').trigger('input');

		const options = wrapper.findAll('[data-testid="search-result-item"]');

		expect(options).toHaveLength(3);
		expect(options.map((option) => option.attributes('tabindex'))).toEqual(['0', '-1', '-1']);
	});

	it('should expose the listbox and option roles', async () => {
		const wrapper = mount(SearchInput, {
			props: {
				modelValue: 'e',
			},
			global,
		});

		await wrapper.find('input').trigger('input');

		expect(wrapper.find('[data-testid="search-results"]').attributes('role')).toBe('listbox');

		for (const option of wrapper.findAll('[data-testid="search-result-item"]')) {
			expect(option.attributes('role')).toBe('option');
		}
	});
});
