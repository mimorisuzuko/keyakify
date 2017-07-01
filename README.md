# Zelkova

**Zelkova** watches the update of your favorite keyakizaka 46 member.

## Usage

### `new Zelkova(url: string)`

Create the instance.

If there is a update, fire the following event

### `zelkova.on('update:blog', (args) => {})`

> （名前） 公式ブログ

#### `args`

* `url: string`
* `title: string`
* `thumbnail: string`

### `zelkova.on('update:news', (args) => {})`

> （名前）に関する最新ニュース

#### `args`

* `url: string`
* `content: string`
* `category: string`
* `date: Date`

### `zelkova.on('update:schedule', (args) => {})`

> （名前）に関する最新スケジュール

#### `args`

* `url: string`
* `content: string`
* `category: string`
* `date: Date`

### `zelkova.on('update:message', (args) => {})`

> 今月の直筆メッセージ

#### `args`

* `url: string`

Sample is [here](./sample).