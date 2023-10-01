<template>
  <div class="tab-header" ref="header">
    <div class="tab-buttons">
      <a class="tab-button main" @click="clickTab(-1)">M</a>
      <a
        class="tab-button"
        v-for="(book, index) in openBooks"
        :class="{ active: useTabIndex().tabIndex === index }"
        @click="clickTab(index)"
        :title="book.name"
      >
        {{ book.name }}
        <Transition name="fade">
          <div
            class="tab-button-close-wrapper"
            v-show="useTabIndex().tabIndex === index"
          >
            <img
              src="~/assets/xmark-solid.svg"
              class="tab-button-close"
              @click.capture.stop="closeTab(index)"
            />
          </div>
        </Transition>
      </a>
    </div>
  </div>
  <Tab
    class="main"
    v-show="useTabIndex().tabIndex === -1"
    :style="headerHeightStyle"
  >
    <slot></slot>
  </Tab>
  <Tab
    v-for="(book, index) in openBooks"
    v-show="useTabIndex().tabIndex === index"
    :style="headerHeightStyle"
  >
    <!-- <iframe
      :src="book.path"
      class="viewer"
      allowfullscreen
      frameborder="0"
      ref="booktabs"
    ></iframe> -->
    <PdfViewer :book="book" :index="index" />
  </Tab>
</template>

<script setup lang="ts">
import { useLibrary } from "~/stores/library";
import { useTabIndex } from "~/stores/tab_index";

let header = ref() as Ref<HTMLDivElement>;
let headerHeightStyle = ref({}) as Ref<object>;
onMounted(() => {
  headerHeightStyle.value = { top: header.value.offsetHeight + "px" };
});

const openBooks = useLibrary().openBooksResolved();

const clickTab = (index: number) => {
  useTabIndex().changeTab(index);
};

const closeTab = (index: number) => {
  useTabIndex().changeTab(-1);
  useLibrary().closeBookIndex(index);
};
</script>

<style scoped lang="scss">
.tab-header {
  background: #111;
  box-shadow: 0 0 4px 4px rgba(0, 0, 0, 0.35);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
}

.tab-buttons {
  box-sizing: border-box;
  height: 100%;
  display: flex;

  column-gap: 10px;
  padding: 7px;
}

.tab-button {
  color: #eee;
  font-size: 0.8rem;

  width: 100px;
  padding: 7px 7px;
  border-radius: 8px;

  user-select: none;
  cursor: default;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  border: 1px solid transparent;

  transition: 0.2s;

  position: relative;

  &:hover {
    background: #444;
  }

  &.active {
    background: var(--accent-color-darker);
    border: 1px solid var(--accent-color);
  }

  &.main {
    width: auto;
  }

  .tab-button-close-wrapper {
    position: absolute;

    top: 50%;
    right: 0;
    padding-right: 7px;
    transform: translateY(-50%);

    display: flex;
    justify-content: flex-start;
    align-items: center;

    background: var(--accent-color-darker);
    box-shadow: 0 0 10px 10px var(--accent-color-darker);

    transition: 0.2s;
  }

  .tab-button-close {
    height: 15px;
    padding: 3px 4px;

    transition: 0.2s;

    &:hover {
      border-radius: 5px;
      background: color-mix(in srgb, var(--accent-color) 100%, white);
    }
  }
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
