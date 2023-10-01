<template>
  <div
    class="pdf-sidebar"
    :class="{ open: useContextMenu().options.panels.sidebar }"
    ref="sidebar"
    :style="{
      width: width + 'px',
      '--sidebar-width': width + 'px',
      transition: resizing ? undefined : '0.3s ease',
    }"
  >
    <PdfSidebarItem
      v-for="node in $props.outline"
      :node="node"
      :sidebar-width="width"
      @go-to-page="goToPage"
    />
  </div>
  <div
    class="sidebar-resizer"
    :style="{ left: width - 5 + 'px' }"
    ref="resizer"
  ></div>
</template>

<script setup lang="ts">
import { useContextMenu } from "~/stores/context_menu";
import { OutlineNode } from "~/types/OutlineNode";

let sidebar = ref() as Ref<HTMLDivElement>;
let resizer = ref() as Ref<HTMLDivElement>;

const minWidth = 100;
const width = ref(200);

const props = defineProps<{ outline: OutlineNode[] }>();
const resizing = ref(false);
const emit = defineEmits<{ goToPage: [index: number] }>();

const goToPage = (index: number) => {
  emit("goToPage", index);
};

const abortController = new AbortController();

onMounted(() => {
  resizer.value.onmousedown = (event: MouseEvent) => {
    if (event.button === 0) {
      resizing.value = true;
    }
  };

  window.addEventListener(
    "selectstart",
    (event: Event) => {
      if (resizing.value) event.preventDefault();
    },
    { signal: abortController.signal }
  );

  window.addEventListener(
    "mouseup",
    (event: MouseEvent) => {
      if (event.button === 0) {
        resizing.value = false;
      }
    },
    { signal: abortController.signal }
  );

  window.addEventListener(
    "mousemove",
    (event: MouseEvent) => {
      if (resizing.value) width.value = Math.max(event.clientX, minWidth);
    },
    { signal: abortController.signal }
  );
});

onUnmounted(() => {
  abortController.abort();
});
</script>

<style scoped lang="scss">
.pdf-sidebar {
  background: #1a1a1a;
  color: #fff;

  overflow-y: scroll;
  overflow-x: visible;

  box-shadow: 0 0 5px 4px rgba(0, 0, 0, 0.35);

  display: flex;
  flex-direction: column;
  row-gap: 2px;

  max-width: 0;

  &.open {
    max-width: var(--sidebar-width);
  }

  position: relative;
}

.sidebar-resizer {
  display: none;
  position: absolute;
  z-index: 10;
  top: 0;
  bottom: 0;
  width: 10px;
  cursor: ew-resize;

  .open + & {
    display: block;
  }
}
</style>
