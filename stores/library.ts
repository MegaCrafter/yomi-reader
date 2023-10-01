import { defineStore } from "pinia";
import { BookModel } from "~/types/BookModel";

const loadBook = async (path: string) => {
  const { $PdfService, $NativeService } = useNuxtApp();

  const book = $PdfService().getLoadedBook(path);
  if (book) return book;

  const bin = await $NativeService().readBinaryLimited(path);
  if (bin) return $PdfService().loadPDF(bin, path);
  return null;
};

export const useLibrary = defineStore("library", {
  state: () => ({
    books: [] as BookModel[],
    openBooks: [] as string[],
    loading: false,
  }),

  actions: {
    async add(path: string) {
      console.log("Adding: ", path);

      this.loading = true;
      const book = await loadBook(path);
      this.loading = false;
      if (!book) {
        console.error("library.add() => Book could not be loaded");
        return;
      }

      const prev = this.books.find(
        (pre) => pre.fingerprint === book.fingerprint
      );
      if (prev) {
        // Don't open the same book twice
        console.warn("library.add() => Tried to load an already loaded book");
        return;
      }
      this.books.push(book);

      this.save();

      return book;
    },

    remove(book: BookModel) {
      const index = this.books.indexOf(book);
      if (index === -1) {
        console.error("library.remove() => Book could not be found");
        return;
      }

      this.books.splice(index);

      this.save();
    },

    async openBook(book: BookModel) {
      const prevIndex = this.openBooks.indexOf(book.fingerprint);
      if (prevIndex !== -1) {
        console.warn(
          "library.openBook() => Tried to open an already opened book"
        );
        return;
      }

      console.log("Opening: ", book.path, book.name);

      this.loading = true;
      await loadBook(book.path);
      this.loading = false;

      this.openBooks.push(book.fingerprint);

      this.save();
    },

    closeBookFingerprint(fingerprint: string) {
      const index = this.openBooks.indexOf(fingerprint);
      if (index === -1) {
        console.error(
          "library.closeBookFingerprint() => Book could not be found"
        );
        return;
      }

      this.closeBookIndex(index);
    },

    closeBookIndex(index: number) {
      const book = this.getOpenBookByIndex(index);

      this.openBooks.splice(index);
      const { $PdfService } = useNuxtApp();

      if (book) {
        $PdfService().cleanupPDF(book.fingerprint, book.path);
      }

      this.save();
    },

    save() {
      window.localStorage.setItem("books", JSON.stringify(this.books));
      window.localStorage.setItem("open_books", JSON.stringify(this.openBooks));
    },

    async load() {
      const ret = window.localStorage.getItem("books");
      if (ret) {
        const arr = JSON.parse(ret);

        for (const book of arr) {
          const prev = this.books.find(
            (pre) => pre.fingerprint === book.fingerprint
          );
          if (prev) {
            // Don't open the same book twice
            console.warn(
              "library.load() => Tried to load an already loaded book"
            );
            continue;
          }

          this.books.push(book);
        }

        this.loading = true;
        const openRet = window.localStorage.getItem("open_books");
        if (openRet) {
          const arr = JSON.parse(openRet);

          for (const fingerprint of arr) {
            const prevIndex = this.openBooks.indexOf(fingerprint);
            if (prevIndex !== -1) {
              console.warn(
                "library.load() => Tried to open an already opened book"
              );
              continue;
            }

            const book = this.getBookByFingerprint(fingerprint);
            if (!book) continue;

            await this.openBook(book);
          }
        }
      }
      this.loading = false;
    },

    getBookByFingerprint(fingerprint: string) {
      return this.books.find((pre) => pre.fingerprint === fingerprint);
    },

    getOpenBookByIndex(index: number) {
      const fingerprint = this.openBooks[index];
      return this.getBookByFingerprint(fingerprint);
    },

    openBooksResolved() {
      return computed(
        () => this.openBooks.map(this.getBookByFingerprint) as BookModel[]
      );
    },
  },
});
