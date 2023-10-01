<template>
  <div class="tab">
    <slot></slot>
  </div>
</template>

<style scoped lang="scss">
.tab {
  position: absolute;
  right: 0;
  left: 0;
  bottom: 0;
  overflow: hidden;

  transition: 0.3s;
}
</style>
