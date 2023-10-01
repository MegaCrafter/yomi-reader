<template>
  <div class="mainpage">
    <button @click="preview">Choose File</button>

    <div class="library">
      <button
        v-for="book in useLibrary().books"
        @click="useLibrary().openBook(book)"
      >
        {{ book.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLibrary } from "~/stores/library";
const { $NativeService } = useNuxtApp();

const preview = async (event: Event) => {
  const files = await $NativeService().openFileDialog();
  if (!files) return;

  for (let file of files) {
    const book = await useLibrary().add(file);
    if (book) useLibrary().openBook(book);
  }
};
</script>

<style scoped>
.mainpage {
  color: #fff;
  background: #222;
  height: 100%;
}

.library {
  display: flex;
  flex-direction: column;
}
</style>
