export class HelloService {
  private text = ref('hello from service');

  helloText() {
    return this.text;
  }

  changeText() {
    this.text.value = 'Changed!';
  }
}
