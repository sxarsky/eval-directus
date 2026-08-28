<script setup lang="ts">
import { debounce, isEqual } from 'lodash';
import { computed, ref, toRefs, watch } from 'vue';
import { useRouter } from 'vue-router';
import NavigationFolder from './files-navigation-folder.vue';
import VDivider from '@/components/v-divider.vue';
import VInput from '@/components/v-input.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VItemGroup from '@/components/v-item-group.vue';
import VListGroup from '@/components/v-list-group.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { useFolders } from '@/composables/use-folders';
import { FolderTarget, SpecialFolder } from '@/types/folders';

const router = useRouter();

const props = defineProps<{
	rootFolder?: string;
	currentFolder?: string;
	currentSpecial?: SpecialFolder;
	customTargetHandler?: (target: FolderTarget) => void;
	localOpenFolders?: boolean;
	actionsDisabled?: boolean;
}>();

const { rootFolder, localOpenFolders } = toRefs(props);

const { nestedFolders, folders, loading, openFolders } = useFolders(rootFolder, localOpenFolders);

const searchQuery = ref('');
const debouncedSearchQuery = ref('');

const updateDebouncedSearch = debounce((value: string) => {
	debouncedSearchQuery.value = value;
}, 250);

watch(searchQuery, (value) => updateDebouncedSearch(value));

const filteredNestedFolders = computed(() => {
	if (!debouncedSearchQuery.value) return nestedFolders.value ?? [];
	const query = debouncedSearchQuery.value.toLowerCase();

	function filterFolder(folder) {
		const nameMatch = folder.name.toLowerCase().includes(query);
		const children = folder.children?.map(filterFolder).filter(Boolean) ?? [];
		if (nameMatch || children.length > 0) {
			return { ...folder, children: children.length > 0 ? children : folder.children };
		}
		return null;
	}

	return (nestedFolders.value ?? []).map(filterFolder).filter(Boolean);
});

const hasVisibleFolders = computed(() => filteredNestedFolders.value.length > 0);

watch([() => props.currentFolder, loading], setOpenFolders, { immediate: true });

const rootFolderInfo = computed(() => {
	if (!folders.value || !rootFolder?.value) return;

	return folders.value.find((folder) => folder.id === rootFolder.value);
});

function onClick(target: FolderTarget) {
	if (props.customTargetHandler) {
		props.customTargetHandler(target);
	} else {
		const path = ['files'];
		if (target.folder) path.push('folders', target.folder);

		if (target.special) {
			path.push(target.special);
		}

		router.push(`/${path.join('/')}`);
	}
}

function setOpenFolders() {
	if (!folders.value) return;
	if (!openFolders?.value) return;

	const shouldBeOpen: string[] = [];
	const folder = folders.value.find((folder) => folder.id === props.currentFolder);

	if (folder?.parent) parseFolder(folder.parent);

	const newOpenFolders = [...openFolders.value];

	for (const folderID of shouldBeOpen) {
		if (newOpenFolders.includes(folderID) === false) {
			newOpenFolders.push(folderID);
		}
	}

	if (newOpenFolders.length !== 1 && isEqual(newOpenFolders, openFolders.value) === false) {
		openFolders.value = newOpenFolders;
	}

	function parseFolder(id: string) {
		if (!folders.value) return;
		shouldBeOpen.push(id);

		const folder = folders.value.find((folder) => folder.id === id);

		if (folder && folder.parent) {
			parseFolder(folder.parent);
		}
	}
}
</script>

<template>
	<div class="files-navigation">
		<div class="search-input">
			<VInput v-model="searchQuery" type="search" :placeholder="$t('search')" />
		</div>
	<VList nav>
		<template v-if="loading && (nestedFolders === null || nestedFolders.length === 0)">
			<VListItem v-for="n in 4" :key="n">
				<VSkeletonLoader type="list-item-icon" />
			</VListItem>
		</template>

		<div class="folders">
			<VItemGroup v-model="openFolders" scope="files-navigation" multiple>
				<VListGroup
					clickable
					:active="(!currentFolder && !currentSpecial) || (currentFolder !== undefined && currentFolder === rootFolder)"
					:value="rootFolder ?? 'root'"
					scope="files-navigation"
					exact
					disable-groupable-parent
					:arrow-placement="filteredNestedFolders && filteredNestedFolders.length > 0 ? 'after' : false"
					@click="onClick(rootFolder ? { folder: rootFolder } : {})"
				>
					<template #activator>
						<VListItemIcon>
							<VIcon name="folder_special" outline />
						</VListItemIcon>
						<VListItemContent>
							<VTextOverflow v-if="rootFolderInfo" :text="rootFolderInfo.name" />
							<VTextOverflow v-else :text="$t('file_library')" />
						</VListItemContent>
					</template>

					<NavigationFolder
						v-for="folder in nestedFolders"
						:key="folder.id"
						:click-handler="onClick"
						:folder="folder"
						:current-folder="currentFolder"
						:actions-disabled="actionsDisabled"
					/>
				</VListGroup>
			</VItemGroup>
		</div>

		<VDivider />

		<VListItem clickable :active="currentSpecial === 'all'" @click="onClick({ special: 'all' })">
			<VListItemIcon><VIcon name="file_copy" outline /></VListItemIcon>
			<VListItemContent>
				<VTextOverflow :text="$t('all_files')" />
			</VListItemContent>
		</VListItem>

		<VListItem clickable :active="currentSpecial === 'mine'" @click="onClick({ special: 'mine' })">
			<VListItemIcon><VIcon name="folder_shared" /></VListItemIcon>
			<VListItemContent>
				<VTextOverflow :text="$t('my_files')" />
			</VListItemContent>
		</VListItem>

		<VListItem clickable :active="currentSpecial === 'recent'" @click="onClick({ special: 'recent' })">
			<VListItemIcon><VIcon name="history" /></VListItemIcon>
			<VListItemContent>
				<VTextOverflow :text="$t('recent_files')" />
			</VListItemContent>
		</VListItem>
	</VList>
	</div>
</template>

<style lang="scss" scoped>
.v-skeleton-loader {
	--v-skeleton-loader-background-color: var(--theme--background-accent);
}

.files-navigation {
	display: flex;
	flex-direction: column;
}

.search-input {
	padding: 12px;
	padding-block-end: 0;
}

.no-folders-found {
	padding: 8px 16px;
	color: var(--theme--foreground-subdued);
}

.folders {
	inline-size: 100%;
	overflow-x: hidden;

	:deep(.v-list-item-content) {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
}
</style>
