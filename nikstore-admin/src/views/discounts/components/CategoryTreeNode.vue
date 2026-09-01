<template>
  <div class="ctn-node">
    <div class="ctn-row" :style="{ paddingRight: `${depth * 14}px` }">
      <!-- expand/collapse button -->
      <button
        v-if="node.children?.length"
        type="button"
        class="ctn-chevron"
        :class="{ 'ctn-chevron--open': expanded }"
        @click.stop="expanded = !expanded"
      >
        <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
      <span v-else class="ctn-chevron-space" />

      <!-- checkbox + label -->
      <div class="ctn-label" @click="emit('toggle', node)">
        <span class="ctn-chk" :class="{ 'ctn-chk--on': isSelected }">
          <svg v-if="isSelected" width="9" height="9" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </span>
        <span class="ctn-name">{{ node.name }}</span>
        <span v-if="node.children?.length" class="ctn-sub-badge">{{ node.children.length }}</span>
      </div>
    </div>

    <!-- recursive children -->
    <div v-if="expanded && node.children?.length" class="ctn-children">
      <CategoryTreeNode
        v-for="child in node.children"
        :key="child._id"
        :node="child"
        :depth="depth + 1"
        :selected-ids="selectedIds"
        @toggle="emit('toggle', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  node:        { type: Object, required: true },
  depth:       { type: Number, default: 0 },
  selectedIds: { type: Array,  default: () => [] },
})

const emit = defineEmits(['toggle'])

const expanded   = ref(false)
const isSelected = computed(() => props.selectedIds.includes(props.node._id))
</script>

<style scoped>
.ctn-node { font-size: 0.8rem; }

.ctn-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0.28rem 0.4rem;
  border-radius: 7px;
  cursor: default;
  transition: background 0.1s;
}
.ctn-row:hover { background: var(--color-surface); }

.ctn-chevron {
  width: 18px; height: 18px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border: none; background: none; padding: 0; cursor: pointer;
  color: var(--color-text-disabled); border-radius: 4px;
  transition: transform 0.18s, color 0.15s, background 0.1s;
}
.ctn-chevron--open { transform: rotate(90deg); color: var(--color-text-secondary); }
.ctn-chevron:hover { color: var(--color-text-primary); background: var(--color-border); }
.ctn-chevron-space { width: 18px; height: 18px; flex-shrink: 0; }

.ctn-label {
  display: flex; align-items: center; gap: 6px;
  flex: 1; min-width: 0; cursor: pointer;
}

.ctn-chk {
  width: 15px; height: 15px; border-radius: 4px; flex-shrink: 0;
  border: 1.5px solid var(--color-border);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.ctn-chk--on { background: #1B4F8A; border-color: #1B4F8A; }

.ctn-name {
  flex: 1; min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  color: var(--color-text-secondary);
}
.ctn-row:hover .ctn-name { color: var(--color-text-primary); }

.ctn-sub-badge {
  font-size: 0.62rem; font-weight: 700;
  padding: 1px 6px; border-radius: 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-disabled);
  flex-shrink: 0; white-space: nowrap;
}

.ctn-children {
  border-right: 1.5px solid var(--color-border);
  margin-right: 13px;
}
</style>
