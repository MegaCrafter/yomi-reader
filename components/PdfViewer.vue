<template>
  <div class="pdf-viewer" v-if="$props.book && isPDFLoaded">
    <PdfSidebar
      v-if="isPDFLoaded"
      :outline="$props.book?.outline ?? []"
      @go-to-page="goToPage"
    />
    <div class="pdf-pageview" v-if="isPDFLoaded" ref="viewerdiv">
      <div class="pdf-inner">
        <div
          class="pdf-page"
          :class="{ bounce: loaded.includes(pagenum) }"
          v-for="pagenum in $props.book?.numPages"
          ref="pagediv"
          :id="$props.book?.fingerprint + '-page-' + pagenum"
        >
          <!-- HACK: This cannot be v-if because the canvas has to exist on mount to set the width and height -->
          <!-- and the canvas should not lose the width and height. -->
          <!-- The width and height of the canvas cannot be set in the render because it causes some scroll jump glitch. -->
          <div
            class="pdf-content"
            v-show="loading.includes(pagenum) || pagenum === 1 || !isMounted"
          >
            <canvas></canvas>
            <div class="pdf-text">
              <PdfTextSpan
                v-for="span in textSpans[pagenum - 1]"
                :text-span="span"
              />
            </div>
            <div class="pdf-annotations">
              <PdfAnnotation
                v-for="annot in annotations[pagenum - 1]"
                :annotation="annot"
                @go-to-page="goToPage"
              />
            </div>
          </div>
          <h1
            class="pdf-page-loading"
            v-if="!loaded.includes(pagenum) && pagenum !== 1"
          >
            Loading...
          </h1>
        </div>
      </div>
    </div>
    <h1 v-else>This PDF could not be loaded!</h1>
  </div>
</template>

<script setup lang="ts">
// TODO: Outline
import { BookModel } from "~/types/BookModel";
import { TidyTextSpan } from "~/types/TidyTextSpan";
import { Annotation } from "~/types/Annotation";
import { useTabIndex } from "~/stores/tab_index";

const { $PdfService, $NativeService } = useNuxtApp();

let viewerdiv = ref() as Ref<HTMLDivElement>;
let pagediv = ref([]) as Ref<HTMLDivElement[]>;

const props = defineProps<{ book?: BookModel; index: number }>();

const textSpans = ref([]) as Ref<TidyTextSpan[][]>;
const annotations = ref([]) as Ref<Annotation[][]>;

const loading = ref([]) as Ref<number[]>;
const loaded = ref([]) as Ref<number[]>;
const height = ref(1400);
const timeouts = [] as NodeJS.Timeout[];
const observing = [] as number[];

const isPDFLoaded = ref(true);

let isMounted = ref(false);
let scrolled = ref(false);

const zoomAmount = 100;
let reRenderTimeout: NodeJS.Timeout;

onMounted(async () => {
  if (!props.book) {
    return;
  }

  // Intersection observer doesn't trigger by visibility change
  // So just render the first 2 pages to be sure
  await renderPage(1);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const pagenum = parseInt(entry.target.id.split("-").pop()!);

      if (
        entry.isIntersecting &&
        (entry.target as HTMLElement).offsetParent !== null
        // entry.target.checkVisibility({ checkVisibilityCSS: true })
      ) {
        observing.push(pagenum);

        if (timeouts.length > 4) {
          clearTimeout(timeouts.shift());
        }
        const timeout = setTimeout(() => {
          if (
            entry.isIntersecting &&
            (entry.target as HTMLElement).offsetParent !== null
            // entry.target.checkVisibility({ checkVisibilityCSS: true })
          ) {
            // If the page is still visible after some time
            if (pagenum > 1) renderPage(pagenum - 1);
            renderPage(pagenum);
            if (pagenum < props.book!.numPages) renderPage(pagenum + 1);
          }
        }, 300);
        timeouts.push(timeout);
      } else {
        const index = observing.indexOf(pagenum);
        observing.splice(index);
      }
    });
  });

  for (let i = 0; i < props.book.numPages; i++) {
    const dim = await $PdfService().getPageDimensions(
      props.book.fingerprint,
      i + 1,
      {
        height: height.value,
      }
    );
    if (!dim) {
      isPDFLoaded.value = false;
      return;
    }

    pagediv.value[i].style.width = dim.width + "px";
    pagediv.value[i].style.height = dim.height + "px";
    canvasOf(i + 1).width = dim.width;
    canvasOf(i + 1).height = dim.height;
    observer.observe(pagediv.value[i]);
  }

  viewerdiv.value.onwheel = (event: WheelEvent) => {
    if (event.ctrlKey) {
      event.preventDefault();

      const zoomMul = event.deltaY > 0 ? -zoomAmount : zoomAmount;

      if (props.book) {
        const scrollScale =
          viewerdiv.value.scrollTop / viewerdiv.value.scrollHeight;
        const newScroll =
          (viewerdiv.value.scrollHeight + zoomMul * props.book?.numPages) *
          scrollScale;
        nextTick().then(() => {
          viewerdiv.value.scrollTo(0, newScroll);
        });
      }

      height.value += zoomMul;

      for (let i = 0; i < (props.book?.numPages ?? 0); i++) {
        $PdfService()
          .getPageDimensions(props.book!.fingerprint, i + 1, {
            height: height.value,
          })
          .then((dim) => {
            if (!dim) {
              isPDFLoaded.value = false;
              return;
            }

            pagediv.value[i].style.width = dim.width + "px";
            pagediv.value[i].style.height = dim.height + "px";
            canvasOf(i + 1).width = dim.width;
            canvasOf(i + 1).height = dim.height;
          });
      }
      if (reRenderTimeout) clearTimeout(reRenderTimeout);
      reRenderTimeout = setTimeout(async () => {
        reRenderPages();
      }, 500);
    }
  };

  isMounted.value = true;
});

if (props.book) {
  useTabIndex().$subscribe(async (_, state) => {
    if (state.tabIndex !== props.index && state.prevTabIndex === props.index) {
      loaded.value.forEach(cleanupPage);
      loaded.value.length = 0;
      loading.value.length = 0;

      const scroll = viewerdiv.value.scrollTop;
      useScrollStorage().set(props.book!.fingerprint, scroll);
    } else if (state.tabIndex === props.index && !scrolled.value) {
      await nextTick();

      const scroll = useScrollStorage().get(props.book!.fingerprint);
      viewerdiv.value.scrollTo(0, scroll);

      scrolled.value = true;
    }
  });

  $NativeService().onWindowClosing(() => {
    const scroll = viewerdiv.value.scrollTop;
    useScrollStorage().set(props.book!.fingerprint, scroll);
  });
}

const renderPage = async (pagenum: number, rerender?: boolean) => {
  if (!rerender) {
    if (loading.value.includes(pagenum)) return; // Don't try to load twice
    loading.value.push(pagenum);

    if (loading.value.length > 10 && !observing.includes(loaded.value[0])) {
      loading.value.shift();
      const delPage = loaded.value.shift();
      if (delPage === undefined) return;
      cleanupPage(delPage);
    }

    await nextTick();
  }
  const page = await $PdfService().renderPDFPage(
    props.book!.fingerprint,
    pagenum,
    canvasOf(pagenum),
    {
      height: height.value,
    }
  );

  if (!page) {
    isPDFLoaded.value = false;
    return;
  }

  textSpans.value[pagenum - 1] = page.text ?? [];
  annotations.value[pagenum - 1] = page.annotations ?? [];

  if (!rerender) {
    loaded.value.push(pagenum);
  }
};

const reRenderPages = async () => {
  for (const pagenum of loaded.value) {
    await renderPage(pagenum, true);
  }
};

const goToPage = (pageIndex: number) => {
  const index = props.book!.labels.indexOf((pageIndex + 1).toString());
  const top = pagediv.value[index].offsetTop - viewerdiv.value.offsetTop;
  // TODO: History
  viewerdiv.value.scrollTo(0, top);
};

const canvasOf = (pagenum: number) => {
  return pagediv.value[pagenum - 1].querySelector(
    "canvas"
  ) as HTMLCanvasElement;
};

const cleanupPage = (pagenum: number) => {
  const delCanvas = canvasOf(pagenum);
  const ctx = delCanvas.getContext("2d");
  ctx?.clearRect(0, 0, delCanvas.width, delCanvas.height);

  textSpans.value[pagenum - 1] = [];
  annotations.value[pagenum - 1] = [];
};
</script>

<style scoped lang="scss">
.pdf-viewer {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;

  display: flex;
}

.pdf-pageview {
  height: 100%;

  flex-grow: 1;

  overflow-x: hidden;
}

.pdf-inner {
  background: #222;
  display: flex;
  flex-direction: column;
  align-items: center;
  row-gap: 20px;
}

.pdf-page {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;

  background: #fff;

  box-shadow: 0 0 8px 8px rgba(0, 0, 0, 0.55);

  .pdf-page-loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  &.bounce {
    animation: bounce-in 0.5s forwards;
  }
}

.pdf-content {
  display: flex;
  justify-content: center;
  align-items: center;

  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.pdf-text {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  opacity: 0.2;
}
@keyframes bounce-in {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.03);
  }
  100% {
    transform: scale(1);
  }
}
</style>
