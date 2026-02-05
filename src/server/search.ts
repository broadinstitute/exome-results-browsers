/* eslint-disable max-classes-per-file */

type Results<T> = {
  word: string,
  docs: T[],
}[]

type NodeEntry<T> = [string, PrefixTrieNode<T>]

class PrefixTrieNode<T> {
  key: string | undefined;
  parent: PrefixTrieNode<T> | null;
  children: Map<string, PrefixTrieNode<T>>;
  docs: T[];

  constructor(key?: string) {
    this.key = key
    this.parent = null
    this.children = new Map()
    this.docs = []
  }

  isLeaf() {
    return this.docs.length > 0
  }
}

export class PrefixTrie<T> {
  private root: PrefixTrieNode<T>;

  constructor() {
    this.root = new PrefixTrieNode()
  }

  add(word: string, doc: T): void {
    let node = this.root
    for (const char of word) {
      if (node.children.has(char)) {
        node = node.children.get(char)!
      } else {
        const newNode = new PrefixTrieNode<T>(char)
        const entries = [...node.children.entries(), [char, newNode] as NodeEntry<T>]
        node.children = new Map(
          entries.sort((a, b) => a[0].localeCompare(b[0]))
        )
        newNode.parent = node
        node = newNode
      }
    }
    node.docs.push(doc)
  }

  get(word: string): T[] | undefined {
    let node: PrefixTrieNode<T> | undefined = this.root
    for (const char of word) {
      node = node.children.get(char)
      if (node === undefined) {
        return undefined
      }
    }

    if (!node.isLeaf()) {
      return undefined
    }

    return node.docs
  }

  search(prefix: string): Results<T> {
    let node: PrefixTrieNode<T> | undefined = this.root
    for (const char of prefix) {
      node = node.children.get(char)
      if (node === undefined) {
        return []
      }
    }

    const results: Results<T> = []
    this.searchHelper(prefix, node, results) // eslint-disable-line no-use-before-define
    return results
  }


  private searchHelper(word: string, node: PrefixTrieNode<T>, results: Results<T>): void {
    if (node.isLeaf()) {
      results.push({
        word,
        docs: node.docs,
      })
    }

    for (const [childKey, childNode] of node.children.entries()) {
      this.searchHelper(word + childKey, childNode, results);
    }

  }
}
