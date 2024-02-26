import { expose } from 'comlink';
import { marked } from 'marked';

class Compiler {
  state = {
    raw: '',
    compiled: '',
  };

  subscribers = [];

  async set(content) {
    this.state = {
      raw: content,
      compiled: marked(content),
    };

    await Promise.all(this.subscribers.map((s) => s(this.state)));
  }

  subscribe(cb) {
    this.subscribers.push(cb);
  }
}

const compiler = new Compiler();

onconnect = (e) => expose(compiler, e.ports[0]);
