<template>
  <div class="container">
    <div
      class="item"
      :style="{
        paddingLeft: $props.push ? $props.push + 'px' : undefined,
        minWidth: $props.sidebarWidth + 'px',
      }"
    >
      <span
        class="button-lead"
        @click="toggleTree"
        :style="{
          visibility: $props.node.items.length === 0 ? 'hidden' : 'visible',
        }"
      >
        <img
          src="~/assets/chevron-down-solid.svg"
          class="button-lead-img"
          :class="{ rotate: treeOpen }"
        />
      </span>
      <a
        class="button"
        :class="{ bold: $props.node.bold, italic: $props.node.italic }"
        @click="link.click"
        :title="node.title + '\n' + link.title()"
        >{{ node.title }}</a
      >
    </div>
    <div
      class="tree"
      :class="{ open: treeOpen }"
      :style="{ '--tree-height': treeHeight + 'px' }"
      ref="tree"
    >
      <PdfSidebarItem
        v-for="child in $props.node.items"
        :key="child.title"
        :node="child"
        :push="($props.push ?? 0) + 20"
        :sidebar-width="$props.sidebarWidth"
        @go-to-page="goToPage"
        @tree-open-change="renewHeight"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { OutlineNode } from "~/types/OutlineNode";
const { $NativeService } = useNuxtApp();

const props = defineProps<{
  node: OutlineNode;
  sidebarWidth: number;
  push?: number;
}>();
const emit = defineEmits<{
  goToPage: [index: number];
  treeOpenChange: [height: number];
}>();

const treeOpen = ref(false);
let tree = ref() as Ref<HTMLDivElement>;

const treeHeight = ref(0);

const renewHeight = (height: number) => {
  treeHeight.value = tree.value.scrollHeight + height;
  console.log(treeHeight.value, height);
};

const toggleTree = () => {
  renewHeight(0);
  treeOpen.value = !treeOpen.value;
  emit("treeOpenChange", treeOpen.value ? treeHeight.value : -treeHeight.value);
};

const goToPage = (index: number) => {
  emit("goToPage", index);
};

const link = usePDFLink(props.node, $NativeService().openFileOrUrl, goToPage);
</script>

<style scoped lang="scss">
.item {
  display: flex;
  box-sizing: border-box;
}

.button {
  overflow: hidden;

  user-select: none;
  cursor: pointer;

  flex-grow: 1;

  padding: 4px 5px;
  font-size: 0.8rem;

  border-radius: 5px;

  transition: 0.2s;

  &:hover {
    background: #444;
  }

  &.bold {
    font-weight: bold;
  }

  &.italic {
    font-style: italic;
  }
}

.button-lead {
  padding-left: 8px;
  padding-right: 8px;

  cursor: pointer;

  display: flex;
  justify-content: center;
  align-items: center;

  user-select: none;

  .button-lead-img {
    width: 10px;

    transition: 0.2s;

    &.rotate {
      transform: rotate(-180deg);
    }
  }
}

.tree {
  overflow: hidden;
  max-height: 0;
  transition: 0.2s;

  &.open {
    max-height: var(--tree-height);
  }
}
</style>
