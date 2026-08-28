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

	it('should not render the search results listbox before the user opens it', () => {
		const wrapper = mount(SearchInput, {
			props: {
				modelValue: 'search',
			},
			global,
		});

		expect(wrapper.find('[data-testid="search-results"]').exists()).toBe(false);
	});

	it('should open the results listbox and expose a focusable first option on ArrowDown', async () => {
		const wrapper = mount(SearchInput, {
			props: {
				modelValue: 'search',
			},
			global,
		});

		await wrapper.find('input').trigger('keydown.down');

		expect(wrapper.find('[data-testid="search-results"]').exists()).toBe(true);
		expect(wrapper.find('[data-testid="search-results"]').attributes('role')).toBe('listbox');

		const options = wrapper.findAll('[data-testid="search-result-item"]');

		expect(options).toHaveLength(1);
		expect(options[0]!.text()).toBe('saved search');
		expect(options[0]!.attributes('role')).toBe('option');
		expect(options[0]!.attributes('tabindex')).toBe('0');
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
});
