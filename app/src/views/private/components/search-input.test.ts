import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
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

	it('should not render the results popover when the query is empty', () => {
		const wrapper = mount(SearchInput, {
			props: {
				modelValue: '',
			},
			global,
		});

		expect(wrapper.find('[data-testid="search-results"]').exists()).toBe(false);
	});

	it('should render one option per matching suggestion when ArrowDown opens the popover', async () => {
		const wrapper = mount(SearchInput, {
			props: {
				modelValue: 'search',
			},
			global,
		});

		await wrapper.find('input').trigger('keydown.down');
		await nextTick();

		expect(wrapper.find('[data-testid="search-results"]').exists()).toBe(true);

		const options = wrapper.findAll('[data-testid="search-result-item"]');
		expect(options).toHaveLength(1);
		expect(options[0]!.text()).toBe('saved search');
	});

	it('should open the results popover on the first keystroke that produces matches', async () => {
		const wrapper = mount(SearchInput, {
			props: {
				modelValue: '',
			},
			global,
		});

		const input = wrapper.find('input');
		(input.element as HTMLInputElement).value = 'saved';
		await input.trigger('input');
		await nextTick();

		expect(wrapper.emitted('update:modelValue')).toBeTruthy();
		expect(wrapper.emitted('update:modelValue')![0]).toEqual(['saved']);

		// Regression: emitValue() reads the resultsList computed immediately after
		// emit('update:modelValue'), but props.modelValue is not updated synchronously in Vue,
		// so resultsActive is computed from the previous query and the popover fails to open
		// on the keystroke that first produces matches.
		expect(wrapper.find('[data-testid="search-results"]').exists()).toBe(true);
	});
});
